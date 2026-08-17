import { createHmac, timingSafeEqual } from "crypto";
import { AppError } from "../../core/errors/app.error";
import type {
  Bank,
  InitializePaymentInput,
  InitializedPayment,
  PaymentEvent,
  PaymentGateway,
  PaymentVerification,
  ResolvedAccount,
} from "../../core/services/payment.gateway";
import { env } from "../config/env";

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackBankData = {
  name: string;
  code: string;
  slug?: string;
};

type PaystackResolveData = {
  account_number?: string;
  account_name?: string;
};

type PaystackTransactionData = {
  id?: number;
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  channel?: string | null;
  paid_at?: string | null;
  paidAt?: string | null;
};

/** Paystack works in kobo; our orders are stored in naira. */
function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

function toMajorUnits(amount: number | undefined): number {
  return Math.round(Number(amount ?? 0)) / 100;
}

function normalizeStatus(status: string | undefined): PaymentVerification["status"] {
  if (status === "success") return "success";
  if (status === "failed" || status === "reversed") return "failed";
  return "pending";
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class PaystackGateway implements PaymentGateway {
  readonly provider = "paystack";

  /** Shared across instances — the bank list is identical for every caller. */
  private static bankCache: Bank[] | null = null;

  constructor(
    private readonly secretKey: string | undefined = env.PAYSTACK_SECRET_KEY,
    private readonly baseUrl: string = env.PAYSTACK_BASE_URL
  ) {}

  /** Configured lazily so the API still boots without payment credentials. */
  private requireSecret(): string {
    if (!this.secretKey) {
      throw new AppError(
        "Card payment is not configured yet",
        503,
        "PAYMENTS_NOT_CONFIGURED"
      );
    }
    return this.secretKey;
  }

  get isConfigured(): boolean {
    return Boolean(this.secretKey);
  }

  private async request<T>(
    path: string,
    init: { method: "GET" | "POST"; body?: unknown }
  ): Promise<T> {
    const secret = this.requireSecret();

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: init.method,
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch (err) {
      console.error("Paystack request failed", err);
      throw new AppError(
        "Could not reach the payment provider. Please try again.",
        502,
        "PAYMENT_PROVIDER_UNREACHABLE"
      );
    }

    const body = (await res.json().catch(() => null)) as
      | PaystackEnvelope<T>
      | null;

    if (!res.ok || !body?.status) {
      // Paystack puts the actionable reason in `message`; keep it for the log
      // but hand the caller something safe.
      console.error("Paystack error", res.status, body?.message);
      throw new AppError(
        body?.message ?? "Payment provider rejected the request",
        502,
        "PAYMENT_PROVIDER_ERROR"
      );
    }

    return body.data;
  }

  async initialize(
    input: InitializePaymentInput
  ): Promise<InitializedPayment> {
    const data = await this.request<PaystackInitializeData>(
      "/transaction/initialize",
      {
        method: "POST",
        body: {
          email: input.email,
          amount: toMinorUnits(input.amount),
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: input.metadata,
        },
      }
    );

    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: data.reference,
    };
  }

  async verify(reference: string): Promise<PaymentVerification> {
    const data = await this.request<PaystackTransactionData>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      { method: "GET" }
    );

    return {
      reference: data.reference ?? reference,
      status: normalizeStatus(data.status),
      amount: toMajorUnits(data.amount),
      currency: data.currency ?? "NGN",
      channel: data.channel ?? null,
      paidAt: parseDate(data.paid_at ?? data.paidAt),
      providerReference: data.id ? String(data.id) : null,
    };
  }

  /**
   * Paystack signs the raw request body with HMAC-SHA512 keyed on the secret.
   * The comparison is constant-time so a mismatch leaks nothing by timing.
   */
  verifySignature(
    rawBody: Buffer | string,
    signature: string | undefined
  ): boolean {
    if (!signature || !this.secretKey) return false;

    const expected = createHmac("sha512", this.secretKey)
      .update(rawBody)
      .digest("hex");

    const provided = Buffer.from(signature, "utf8");
    const computed = Buffer.from(expected, "utf8");
    if (provided.length !== computed.length) return false;

    return timingSafeEqual(provided, computed);
  }

  /**
   * Nigerian banks Paystack can pay into. Cached in memory for the process
   * lifetime — the list changes rarely, and every payout form would otherwise
   * make the same slow call.
   */
  async listBanks(): Promise<Bank[]> {
    if (PaystackGateway.bankCache) return PaystackGateway.bankCache;

    const data = await this.request<PaystackBankData[]>(
      "/bank?country=nigeria&currency=NGN&perPage=100",
      { method: "GET" }
    );

    const banks = data
      .filter((bank) => bank.code && bank.name)
      .map((bank) => ({
        name: bank.name,
        code: bank.code,
        slug: bank.slug ?? bank.code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    PaystackGateway.bankCache = banks;
    return banks;
  }

  async resolveAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<ResolvedAccount> {
    const data = await this.request<PaystackResolveData>(
      `/bank/resolve?account_number=${encodeURIComponent(
        accountNumber
      )}&bank_code=${encodeURIComponent(bankCode)}`,
      { method: "GET" }
    );

    return {
      accountNumber: data.account_number ?? accountNumber,
      accountName: data.account_name ?? "",
      bankCode,
    };
  }

  parseEvent(payload: unknown): PaymentEvent | null {
    if (!payload || typeof payload !== "object") return null;

    const event = payload as { event?: string; data?: PaystackTransactionData };
    const data = event.data;
    if (!event.event || !data?.reference) return null;

    // `charge.success` is the one that settles an order; failures and
    // reversals are surfaced so a buyer can retry.
    const status: PaymentEvent["status"] =
      event.event === "charge.success"
        ? "success"
        : normalizeStatus(data.status);

    return {
      type: event.event,
      reference: data.reference,
      status,
      amount: toMajorUnits(data.amount),
      channel: data.channel ?? null,
      paidAt: parseDate(data.paid_at ?? data.paidAt),
      providerReference: data.id ? String(data.id) : null,
    };
  }
}
