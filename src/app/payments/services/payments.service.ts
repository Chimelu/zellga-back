import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../core/errors/app.error";
import type { Order } from "../../../core/models/order.model";
import type { OrderRepository } from "../../../core/repositories/order.repository";
import type {
  Bank,
  PaymentEvent,
  PaymentGateway,
  PaymentVerification,
  ResolvedAccount,
} from "../../../core/services/payment.gateway";
import { generateRefCode } from "../../../core/utils/ref-code";
import type {
  InitializePaymentDto,
  InitializedPaymentDto,
  PaymentStatusDto,
} from "../dto/payment.dto";

/** Underpayment beyond this (in naira) is not treated as settled. */
const AMOUNT_TOLERANCE = 0.01;

export class PaymentsService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly gateway: PaymentGateway,
    private readonly callbackUrl: string
  ) {}

  /**
   * A reference can only be spent once at the provider, so each attempt gets a
   * fresh suffix. Retrying a failed payment would otherwise be rejected as a
   * duplicate.
   */
  private buildPaymentReference(orderReference: string): string {
    return `${orderReference}-${generateRefCode(6)}`;
  }

  private toStatusDto(order: Order): PaymentStatusDto {
    return {
      orderId: order.id,
      orderReference: order.reference,
      paymentReference: order.paymentReference,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      amount: order.total,
      amountPaid: order.amountPaid,
      paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      channel: order.paymentChannel,
    };
  }

  /**
   * Starts a payment for an existing order. The amount always comes from the
   * stored order, never the request, so a tampered client cannot decide what
   * it owes.
   */
  async initialize(
    input: InitializePaymentDto
  ): Promise<InitializedPaymentDto> {
    const order = await this.orders.findById(input.orderId);
    if (!order) {
      throw new NotFoundError("Order not found", "ORDER_NOT_FOUND");
    }

    if (order.channel !== "platform") {
      throw new ValidationError(
        "This order is completed over WhatsApp, not card payment"
      );
    }
    if (order.status === "cancelled") {
      throw new ValidationError("That order was cancelled");
    }
    if (order.isPaid) {
      throw new ValidationError("That order has already been paid for");
    }
    if (order.total <= 0) {
      throw new ValidationError("That order has nothing to pay for");
    }

    const email = input.email?.trim().toLowerCase() || order.buyerEmail;
    if (!email) {
      throw new ValidationError("An email is required to pay by card");
    }

    const paymentReference = this.buildPaymentReference(order.reference);

    // Recorded before the redirect so a webhook that lands while the buyer is
    // still on the Paystack page can be matched back to this order.
    order.buyerEmail = email;
    order.markPaymentPending(this.gateway.provider, paymentReference);
    await this.orders.save(order);

    const initialized = await this.gateway.initialize({
      email,
      amount: order.total,
      reference: paymentReference,
      callbackUrl: this.callbackUrl,
      metadata: {
        orderId: order.id,
        orderReference: order.reference,
        storeId: order.storeId,
        buyerName: order.buyerName,
        buyerPhone: order.buyerPhone,
      },
    });

    return {
      orderId: order.id,
      orderReference: order.reference,
      paymentReference,
      authorizationUrl: initialized.authorizationUrl,
      accessCode: initialized.accessCode,
      amount: order.total,
      currency: "NGN",
    };
  }

  /**
   * Confirms a transaction directly with the provider. The buyer's browser
   * hits this on return from checkout — a redirect alone proves nothing, and
   * it also covers the case where the webhook is delayed.
   */
  async verify(paymentReference: string): Promise<PaymentStatusDto> {
    const reference = paymentReference.trim();
    const order = await this.orders.findByPaymentReference(reference);
    if (!order) {
      throw new NotFoundError("Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (order.isPaid) {
      return this.toStatusDto(order);
    }

    const verification = await this.gateway.verify(reference);
    const updated = await this.applyOutcome(order, verification);
    return this.toStatusDto(updated);
  }

  /** Banks a seller can nominate for payout. */
  async listBanks(): Promise<Bank[]> {
    return this.gateway.listBanks();
  }

  /**
   * Confirms the name behind an account number before a seller saves it, so
   * money is not sent into a mistyped account.
   */
  async resolveAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<ResolvedAccount> {
    const digits = accountNumber.replace(/\D/g, "");
    if (digits.length !== 10) {
      throw new ValidationError("Nigerian account numbers are 10 digits");
    }

    try {
      return await this.gateway.resolveAccount(digits, bankCode.trim());
    } catch (err) {
      // An unknown account is bad input, not a provider outage — surfacing it
      // as 502 would tell the seller to "try again" on a number that will
      // never resolve.
      if (err instanceof AppError && err.code === "PAYMENT_PROVIDER_ERROR") {
        throw new ValidationError(
          "We couldn't find that account. Check the number and the bank."
        );
      }
      throw err;
    }
  }

  /** Read-only status for a polling checkout page. */
  async getOrderPaymentStatus(orderId: string): Promise<PaymentStatusDto> {
    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found", "ORDER_NOT_FOUND");
    }
    return this.toStatusDto(order);
  }

  /**
   * Handles a provider callback. Signature verification comes first: without
   * it anyone could POST a `charge.success` and mark orders paid for free.
   */
  async handleWebhook(
    rawBody: Buffer | string,
    signature: string | undefined
  ): Promise<{ received: true; applied: boolean }> {
    if (!this.gateway.verifySignature(rawBody, signature)) {
      throw new UnauthorizedError(
        "Invalid webhook signature",
        "INVALID_SIGNATURE"
      );
    }

    const payload = this.parseBody(rawBody);
    const event = this.gateway.parseEvent(payload);
    if (!event) {
      return { received: true, applied: false };
    }

    const order = await this.orders.findByPaymentReference(event.reference);
    if (!order) {
      // Nothing to match — acknowledge so the provider stops retrying.
      console.warn("Webhook for unknown payment reference", event.reference);
      return { received: true, applied: false };
    }

    const before = order.paymentStatus;
    const updated = await this.applyOutcome(order, event);
    return { received: true, applied: updated.paymentStatus !== before };
  }

  private parseBody(rawBody: Buffer | string): unknown {
    try {
      return JSON.parse(
        typeof rawBody === "string" ? rawBody : rawBody.toString("utf8")
      );
    } catch {
      return null;
    }
  }

  /**
   * Single place where a provider outcome changes an order, so the webhook and
   * the verify endpoint can never drift apart. Safe to run twice — `markPaid`
   * is a no-op once the order is settled.
   */
  private async applyOutcome(
    order: Order,
    outcome: PaymentVerification | PaymentEvent
  ): Promise<Order> {
    if (outcome.status === "success") {
      // Guards against a short payment (possible on bank transfer) being
      // accepted as settlement of the full order.
      if (outcome.amount + AMOUNT_TOLERANCE < order.total) {
        console.error(
          `Underpaid order ${order.reference}: expected ${order.total}, got ${outcome.amount}`
        );
        return order;
      }

      const changed = order.markPaid({
        amountPaid: outcome.amount,
        channel: outcome.channel,
        paidAt: outcome.paidAt,
        provider: this.gateway.provider,
        paymentReference: outcome.reference,
      });
      return changed ? this.orders.save(order) : order;
    }

    if (outcome.status === "failed") {
      const changed = order.markPaymentFailed();
      return changed ? this.orders.save(order) : order;
    }

    return order;
  }
}
