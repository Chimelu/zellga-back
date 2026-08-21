import { randomUUID } from "crypto";
import {
  NotFoundError,
  ValidationError,
} from "../../../core/errors/app.error";
import {
  buildWhatsAppLink,
  buildWhatsAppOrderMessage,
} from "../../../core/utils/whatsapp";
import type { OrderChannel } from "../../../core/models/order.model";
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
        logoUrl: store.logoUrl,
        coverUrl: store.coverUrl,
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
        offerType: p.offerType,
        subtype: p.subtype,
        details: p.details,
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
     * was actually ordered. An item set to `both` allows either way, so the
     * basket allows a channel only when every item in it does. A basket that
     * agrees on nothing is paid on the platform — falling back to WhatsApp
     * would skip collecting money for the pay-online item in it.
     */
    const modes = lines.map(
      (line) =>
        byId.get(line.productId ?? "")?.checkoutMode ??
        store.defaultCheckoutMode
    );
    const allowsWhatsApp = modes.every(
      (mode) => mode === "whatsapp" || mode === "both"
    );
    const allowsPlatform = modes.every(
      (mode) => mode === "platform" || mode === "both"
    );

    /**
     * With both on offer the buyer's pick decides it, since they are the one
     * choosing how to pay. Without a pick, the store's own default breaks the
     * tie. A pick the basket does not allow is ignored rather than refused —
     * the response tells the storefront which way the order actually went.
     */
    const requested = input.channel;
    const chosenMode: OrderChannel =
      allowsWhatsApp && allowsPlatform
        ? (requested ??
          (store.defaultCheckoutMode === "whatsapp" ? "whatsapp" : "platform"))
        : allowsWhatsApp
          ? "whatsapp"
          : "platform";

    /**
     * A referred sale is always paid on the platform, whatever the item's own
     * mode says. Commission on a WhatsApp handoff rests on the seller
     * remembering to confirm a transfer by hand — until they do, the affiliate
     * has no proof they made the sale. Paystack settling the money is that
     * proof, so the referral link is what decides the channel here.
     */
    const channel: OrderChannel = affiliate ? "platform" : chosenMode;

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
