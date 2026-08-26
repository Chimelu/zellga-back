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

/**
 * What a paid digital order actually hands over. Flattened out of the offer's
 * `details` so the storefront renders links without knowing the offer shape,
 * and only ever built for an order the provider has confirmed.
 */
export type DigitalAccessItemDto = {
  productId: string;
  /** The offer's name — what the buyer bought, not the file on disk. */
  name: string;
  fileUrl: string | null;
  /** The file's own name, e.g. `canva-guide.pdf`. */
  fileName: string | null;
  videoUrl: string | null;
  modules: {
    title: string;
    lessons: {
      title: string;
      videoUrl: string | null;
      resourceUrl: string | null;
    }[];
  }[];
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
  /**
   * The digital offers in this order, with their links. Empty until the
   * payment is confirmed — this is the automatic delivery, so it must not
   * exist a moment before the money does.
   */
  digitalAccess: DigitalAccessItemDto[];
};
