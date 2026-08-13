import { randomUUID } from "crypto";
import {
  NotFoundError,
  ValidationError,
} from "../../../core/errors/app.error";
import { Order, buildOrderReference } from "../../../core/models/order.model";
import type { OrderRepository } from "../../../core/repositories/order.repository";
import type { ProductRepository } from "../../../core/repositories/product.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type { UserRepository } from "../../../core/repositories/user.repository";
import type { AffiliateService } from "../../affiliates/services/affiliate.service";
import type {
  CreatedOrderDto,
  CreateOrderDto,
  PublicProductDto,
  PublicStoreDto,
} from "../dto/store.dto";

export class StoresService {
  constructor(
    private readonly stores: StoreRepository,
    private readonly products: ProductRepository,
    private readonly users: UserRepository,
    private readonly orders: OrderRepository,
    private readonly affiliates: AffiliateService
  ) {}

  async getPublicBySlug(slug: string): Promise<{
    store: PublicStoreDto;
    products: PublicProductDto[];
  }> {
    const store = await this.stores.findBySlug(slug);
    if (!store) {
      throw new NotFoundError("Store not found");
    }

    const owner = await this.users.findById(store.ownerId);
    if (!owner) {
      throw new NotFoundError("Store not found");
    }

    // Hidden products (available=false) are excluded from the storefront link
    const visible = await this.products.findVisibleByStoreId(store.id);

    return {
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        category: store.category,
        description: store.description,
        ownerName: owner.name,
        phone: owner.phone,
      },
      products: visible.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        imageUrl: p.imageUrl,
        media: p.media.map((m) => ({ url: m.url, type: m.type })),
        category: p.category,
        checkoutMode: p.checkoutMode,
      })),
    };
  }

  /**
   * Creates an order from a public storefront. Prices come from the database,
   * never the request, so a tampered payload cannot change what is owed or
   * inflate an affiliate's commission.
   */
  async createOrder(
    slug: string,
    input: CreateOrderDto
  ): Promise<CreatedOrderDto> {
    const store = await this.stores.findBySlug(slug);
    if (!store) {
      throw new NotFoundError("Store not found");
    }

    const catalogue = await this.products.findVisibleByStoreId(store.id);
    const byId = new Map(catalogue.map((product) => [product.id, product]));

    const lines = input.items.map((line) => {
      const product = byId.get(line.productId);
      if (!product) {
        throw new ValidationError("One of those items is no longer available");
      }
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: line.quantity,
      };
    });

    const total = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0
    );

    const affiliate = await this.affiliates.resolveReferral(store.id, input.ref);
    const commissionAmount = affiliate ? affiliate.commissionOn(total) : 0;

    const now = new Date();
    const saved = await this.orders.save(
      new Order({
        id: randomUUID(),
        reference: buildOrderReference(randomUUID().replace(/-/g, "")),
        storeId: store.id,
        buyerName: input.buyerName.trim(),
        buyerPhone: input.buyerPhone.trim(),
        items: lines,
        total,
        channel: store.defaultCheckoutMode,
        status: "pending",
        note: input.note?.trim() || null,
        affiliateId: affiliate?.id ?? null,
        commissionAmount,
        createdAt: now,
        updatedAt: now,
      })
    );

    return {
      id: saved.id,
      reference: saved.reference,
      total: saved.total,
      itemCount: saved.itemCount,
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
      attributed: Boolean(saved.affiliateId),
    };
  }
}
