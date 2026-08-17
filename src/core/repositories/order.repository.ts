import type {
  Order,
  OrderChannel,
  OrderProps,
  OrderStatus,
  PaymentStatus,
} from "../models/order.model";

/**
 * A new order before the store assigns it a number. The repository fills in
 * `orderNumber` and `reference` as it inserts.
 */
export type OrderDraft = Omit<OrderProps, "orderNumber" | "reference">;

export type OrderListQuery = {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  channel?: OrderChannel;
  sort: "newest" | "oldest" | "highest" | "lowest";
  page: number;
  pageSize: number;
};

export type OrderListPage = {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Headline numbers for the seller's orders screen. */
export type OrderSummary = {
  orders: number;
  /** Gross value of every order that is not cancelled. */
  revenue: number;
  /** Money actually collected, card and manually-confirmed alike. */
  paidRevenue: number;
  pendingPayments: number;
  /** Orders not yet completed or cancelled. */
  open: number;
  whatsappOrders: number;
  platformOrders: number;
};

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  /** References are unique per store, so the store must be known. */
  findByStoreAndReference(
    storeId: string,
    reference: string
  ): Promise<Order | null>;
  /**
   * Looks an order up by the reference sent to the payment provider, which
   * differs from the order reference once a buyer retries a failed payment.
   */
  findByPaymentReference(paymentReference: string): Promise<Order | null>;
  listByStore(storeId: string, query: OrderListQuery): Promise<OrderListPage>;
  summaryByStore(storeId: string): Promise<OrderSummary>;
  /**
   * Assigns the next per-store order number and persists in one step. Separate
   * from `save` because allocating a number must be serialized per store, or
   * two simultaneous buyers would be handed the same one.
   */
  create(draft: OrderDraft): Promise<Order>;
  save(order: Order): Promise<Order>;
}
