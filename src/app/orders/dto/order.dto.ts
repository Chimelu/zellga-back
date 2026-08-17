import type {
  OrderChannel,
  OrderStatus,
  PaymentStatus,
} from "../../../core/models/order.model";

export type SellerOrderDto = {
  id: string;
  /** Per-store counter, e.g. 1024. */
  orderNumber: number;
  /** Human-facing code, e.g. `ZLG-1024`. */
  reference: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  items: {
    productId: string | null;
    name: string;
    price: number;
    quantity: number;
  }[];
  itemCount: number;
  total: number;
  channel: OrderChannel;
  status: OrderStatus;
  note: string | null;
  payment: {
    status: PaymentStatus;
    provider: string | null;
    reference: string | null;
    channel: string | null;
    amountPaid: number;
    paidAt: string | null;
  };
  /** Present when an affiliate referred the sale. */
  affiliateId: string | null;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type SellerOrderListQueryDto = {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  channel?: OrderChannel;
  sort: "newest" | "oldest" | "highest" | "lowest";
  page: number;
  pageSize: number;
};

export type SellerOrderListDto = {
  items: SellerOrderDto[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type SellerOrderSummaryDto = {
  orders: number;
  revenue: number;
  paidRevenue: number;
  pendingPayments: number;
  /** Orders not yet completed or cancelled. */
  open: number;
  whatsappOrders: number;
  platformOrders: number;
};

export type UpdateOrderStatusDto = {
  status: OrderStatus;
};

export type UpdatePaymentStatusDto = {
  paymentStatus: "paid" | "refunded" | "unpaid";
  amountPaid?: number;
};
