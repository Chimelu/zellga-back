export type OrderLine = {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
};

/**
 * Where the seller is with the order. Deliberately separate from
 * `PaymentStatus`: an order can be paid but not yet shipped, or completed but
 * never paid online (cash on delivery), and one field cannot say both.
 */
export type OrderStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "processing"
  | "completed"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
];

/** Orders still needing the seller's attention. */
export const OPEN_ORDER_STATUSES: OrderStatus[] = [
  "new",
  "contacted",
  "confirmed",
  "processing",
];

export type OrderChannel = "whatsapp" | "platform";

/**
 * What the money did. `manual` payments (a vendor confirming a WhatsApp
 * transfer) land here too, so platform and off-platform revenue report the
 * same way.
 */
export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type OrderProps = {
  id: string;
  /** Per-store counter behind `reference`, e.g. 1024. */
  orderNumber: number;
  reference: string;
  storeId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  items: OrderLine[];
  total: number;
  channel: OrderChannel;
  status: OrderStatus;
  note: string | null;
  affiliateId: string | null;
  commissionAmount: number;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentReference: string | null;
  paymentChannel: string | null;
  amountPaid: number;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Order {
  readonly id: string;
  orderNumber: number;
  reference: string;
  readonly storeId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  items: OrderLine[];
  total: number;
  channel: OrderChannel;
  status: OrderStatus;
  note: string | null;
  affiliateId: string | null;
  commissionAmount: number;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentReference: string | null;
  paymentChannel: string | null;
  amountPaid: number;
  paidAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: OrderProps) {
    this.id = props.id;
    this.orderNumber = props.orderNumber;
    this.reference = props.reference;
    this.storeId = props.storeId;
    this.buyerName = props.buyerName;
    this.buyerPhone = props.buyerPhone;
    this.buyerEmail = props.buyerEmail;
    this.items = props.items;
    this.total = props.total;
    this.channel = props.channel;
    this.status = props.status;
    this.note = props.note;
    this.affiliateId = props.affiliateId;
    this.commissionAmount = props.commissionAmount;
    this.paymentStatus = props.paymentStatus;
    this.paymentProvider = props.paymentProvider;
    this.paymentReference = props.paymentReference;
    this.paymentChannel = props.paymentChannel;
    this.amountPaid = props.amountPaid;
    this.paidAt = props.paidAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get itemCount(): number {
    return this.items.reduce((sum, line) => sum + line.quantity, 0);
  }

  /** Settled money — a second webhook for the same order must not re-apply. */
  get isPaid(): boolean {
    return this.paymentStatus === "paid";
  }

  /** Only an open, platform-checkout order can be sent to the gateway. */
  get isPayable(): boolean {
    return (
      this.channel === "platform" &&
      this.status !== "cancelled" &&
      !this.isPaid
    );
  }

  /**
   * Payment confirms an order the seller has not worked yet. Anything further
   * along is left alone — money arriving does not undo `processing`.
   */
  private advanceOnPayment(): void {
    if (this.status === "new" || this.status === "contacted") {
      this.status = "confirmed";
    }
  }

  /** Marks a payment attempt as started, before the buyer is redirected. */
  markPaymentPending(provider: string, paymentReference: string): void {
    this.paymentProvider = provider;
    this.paymentReference = paymentReference;
    this.paymentStatus = "pending";
    this.updatedAt = new Date();
  }

  /**
   * Applies a confirmed payment. Idempotent: replaying the same webhook after
   * the order is already paid changes nothing, which matters because Paystack
   * retries until it gets a 200.
   */
  markPaid(input: {
    amountPaid: number;
    channel: string | null;
    paidAt: Date | null;
    provider?: string;
    paymentReference?: string | null;
  }): boolean {
    if (this.isPaid) return false;

    this.paymentStatus = "paid";
    this.amountPaid = input.amountPaid;
    this.paymentChannel = input.channel;
    this.paidAt = input.paidAt ?? new Date();
    if (input.provider) this.paymentProvider = input.provider;
    if (input.paymentReference) this.paymentReference = input.paymentReference;

    this.advanceOnPayment();
    this.updatedAt = new Date();
    return true;
  }

  /**
   * A vendor confirming money that arrived outside the platform — a transfer
   * agreed over WhatsApp, or cash on delivery. Recorded as a real payment so
   * WhatsApp revenue and affiliate commission count the same as card sales.
   */
  markPaidManually(amount?: number): boolean {
    if (this.isPaid) return false;

    this.paymentStatus = "paid";
    this.amountPaid = amount ?? this.total;
    this.paymentProvider = "manual";
    this.paymentChannel = this.paymentChannel ?? "manual";
    this.paidAt = new Date();

    this.advanceOnPayment();
    this.updatedAt = new Date();
    return true;
  }

  /** A failed attempt leaves the order open so the buyer can try again. */
  markPaymentFailed(): boolean {
    if (this.isPaid) return false;
    this.paymentStatus = "failed";
    this.updatedAt = new Date();
    return true;
  }

  /** Reverses a settled payment without touching fulfilment history. */
  markRefunded(): boolean {
    if (this.paymentStatus !== "paid") return false;
    this.paymentStatus = "refunded";
    this.updatedAt = new Date();
    return true;
  }
}

/** Per-store counters start here so a store's first order reads as 1001. */
export const ORDER_NUMBER_START = 1000;

/** Human-facing code a buyer quotes back over WhatsApp, e.g. `ZLG-1024`. */
export function buildOrderReference(orderNumber: number): string {
  return `ZLG-${orderNumber}`;
}
