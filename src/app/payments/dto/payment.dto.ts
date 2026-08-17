import type { OrderStatus, PaymentStatus } from "../../../core/models/order.model";

export type InitializePaymentDto = {
  /**
   * Order id from checkout. The id rather than the reference, because
   * references are only unique within a store.
   */
  orderId: string;
  /**
   * Where the receipt goes. Optional once the order already carries an email —
   * sending it again updates the order.
   */
  email?: string;
};

export type InitializedPaymentDto = {
  orderId: string;
  orderReference: string;
  /** Reference for this attempt, used to verify the transaction afterwards. */
  paymentReference: string;
  /** Hosted Paystack page the buyer is redirected to. */
  authorizationUrl: string;
  accessCode: string;
  amount: number;
  currency: string;
};

export type PaymentStatusDto = {
  orderId: string;
  orderReference: string;
  paymentReference: string | null;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  amount: number;
  amountPaid: number;
  paidAt: string | null;
  channel: string | null;
};
