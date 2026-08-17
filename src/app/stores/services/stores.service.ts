import { randomUUID } from "crypto";
import {
  NotFoundError,
  ValidationError,
} from "../../../core/errors/app.error";
import {
  buildWhatsAppLink,
  buildWhatsAppOrderMessage,
} from "../../../core/utils/whatsapp";
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

    // Needed for the WhatsApp handoff — the buyer messages the seller direct.
    const owner = await this.users.findById(store.ownerId);
    if (!owner) {
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

    /**
     * The seller sets the payment method per item, so the order follows what
     * was actually ordered. A basket holding any pay-on-platform item is paid
     * on the platform — falling back to WhatsApp would skip collecting money
     * for that item. The store default only covers an empty catalogue lookup,
     * since every product carries its own mode.
     */
    const modes = lines.map(
      (line) => byId.get(line.productId ?? "")?.checkoutMode
    );
    const channel: "whatsapp" | "platform" = modes.some(
      (mode) => mode === "platform"
    )
      ? "platform"
      : modes.some((mode) => mode === "whatsapp")
        ? "whatsapp"
        : store.defaultCheckoutMode;

    const buyerEmail = input.buyerEmail?.trim().toLowerCase() || null;
    if (channel === "platform" && !buyerEmail) {
      throw new ValidationError("An email is required to pay on Zellga");
    }

    const now = new Date();
    // `create` allocates the store's next order number inside the insert.
    const saved = await this.orders.create({
      id: randomUUID(),
      storeId: store.id,
      buyerName: input.buyerName.trim(),
      buyerPhone: input.buyerPhone.trim(),
      buyerEmail,
      items: lines,
      total,
      channel,
      status: "new",
      note: input.note?.trim() || null,
      affiliateId: affiliate?.id ?? null,
      commissionAmount,
      // Nothing has been collected yet; the payment endpoints own these from
      // here on. WhatsApp orders stay `unpaid` until the seller confirms the
      // money arrived, or the buyer pays on the platform.
      paymentStatus: "unpaid",
      paymentProvider: null,
      paymentReference: null,
      paymentChannel: null,
      amountPaid: 0,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    });

    /**
     * Built here rather than in the browser so the reference the buyer sends
     * always names an order that exists. The seller's own number is the
     * destination — buyers message the store, not the platform.
     */
    const whatsappUrl =
      saved.channel === "whatsapp"
        ? buildWhatsAppLink(
            owner.phone,
            buildWhatsAppOrderMessage(saved, store.name)
          )
        : null;

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      reference: saved.reference,
      total: saved.total,
      itemCount: saved.itemCount,
      status: saved.status,
      channel: saved.channel,
      paymentStatus: saved.paymentStatus,
      /** Tells the storefront whether to call the initialize-payment endpoint. */
      paymentRequired: saved.channel === "platform",
      /** Ready-made `wa.me` link for a WhatsApp order; null for card checkout. */
      whatsappUrl,
      createdAt: saved.createdAt.toISOString(),
      attributed: Boolean(saved.affiliateId),
    };
  }
}
