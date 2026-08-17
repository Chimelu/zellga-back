/**
 * Payment provider port. The app layer talks only to this, so swapping or
 * adding a provider never reaches into checkout logic.
 */

export type InitializePaymentInput = {
  /** Provider-facing receipt address. Paystack requires one. */
  email: string;
  /** Major currency units (naira). The adapter converts to minor units. */
  amount: number;
  /** Our own order reference, reused as the provider reference. */
  reference: string;
  callbackUrl: string;
  /** Free-form context echoed back on the webhook. */
  metadata?: Record<string, unknown>;
};

export type InitializedPayment = {
  /** Hosted checkout page the buyer is sent to. */
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type PaymentVerification = {
  reference: string;
  /** Normalized across providers — anything not success/failed is pending. */
  status: "success" | "failed" | "pending";
  /** Major currency units, converted back from the provider's minor units. */
  amount: number;
  currency: string;
  /** Card, bank transfer, USSD… as reported by the provider. */
  channel: string | null;
  paidAt: Date | null;
  /** Provider-side identifier, kept for support and reconciliation. */
  providerReference: string | null;
};

export type PaymentEvent = {
  /** e.g. `charge.success`. */
  type: string;
  reference: string;
  status: "success" | "failed" | "pending";
  amount: number;
  channel: string | null;
  paidAt: Date | null;
  providerReference: string | null;
};

/** A bank a seller can be paid into. `code` is what transfers are keyed on. */
export type Bank = {
  name: string;
  code: string;
  slug: string;
};

/** Result of asking the provider who owns an account number. */
export type ResolvedAccount = {
  accountNumber: string;
  accountName: string;
  bankCode: string;
};

export interface PaymentGateway {
  readonly provider: string;

  initialize(input: InitializePaymentInput): Promise<InitializedPayment>;

  /**
   * Asks the provider what actually happened. Never trust a client-side
   * redirect on its own — this is the authoritative read.
   */
  verify(reference: string): Promise<PaymentVerification>;

  /** Constant-time check that a webhook really came from the provider. */
  verifySignature(rawBody: Buffer | string, signature: string | undefined): boolean;

  /** Parses a verified webhook payload into a provider-neutral event. */
  parseEvent(payload: unknown): PaymentEvent | null;

  /** Banks a seller can nominate for payout. */
  listBanks(): Promise<Bank[]>;

  /**
   * Confirms who actually owns an account number. Typing a payout account by
   * hand is how sellers lose money — this checks the name against the bank
   * rather than trusting what was typed.
   */
  resolveAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<ResolvedAccount>;
}
