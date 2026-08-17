import type { OrderStatus } from "../../../core/models/order.model";

export type PublicStoreDto = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  ownerName: string;
  phone: string;
};

export type PublicProductDto = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  media: { url: string; type: "image" | "video" }[];
  category: string | null;
  checkoutMode: "whatsapp" | "platform";
};

export type CreateOrderItemDto = {
  productId: string;
  quantity: number;
};

export type CreateOrderDto = {
  buyerName: string;
  buyerPhone: string;
  /** Required when the items are paid for on the platform. */
  buyerEmail?: string;
  items: CreateOrderItemDto[];
  note?: string;
  /** Affiliate ref code from the link the buyer arrived through. */
  ref?: string;
};

export type CreatedOrderDto = {
  id: string;
  /** Per-store counter behind the reference, e.g. 1024. */
  orderNumber: number;
  /** Human-facing code, e.g. `ZLG-1024`. */
  reference: string;
  total: number;
  itemCount: number;
  status: OrderStatus;
  channel: "whatsapp" | "platform";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  /**
   * True when the buyer must be sent to the payment provider next, via
   * `POST /api/payments/initialize` with this order's id.
   */
  paymentRequired: boolean;
  /**
   * Prefilled `wa.me` link carrying the order details and reference. Present
   * only for WhatsApp checkout — send the buyer here after creating the order.
   */
  whatsappUrl: string | null;
  createdAt: string;
  /** True when the order was credited to an affiliate. */
  attributed: boolean;
};
