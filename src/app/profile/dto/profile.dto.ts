import type { CheckoutMode } from "../../../core/models/store.model";

export type StoreProfileDto = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  /** Square profile image shown over the cover on the storefront. */
  logoUrl: string | null;
  /** Wide banner behind the store name on the storefront. */
  coverUrl: string | null;
  link: string;
};

export type ProfileSettingsDto = {
  /** Default checkout path for new items */
  defaultCheckoutMode: CheckoutMode;
  /** Store-wide affiliate rate; 0 means affiliates are switched off. */
  affiliateCommissionPercent: number;
};

export type BusinessProfileDto = {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: "seller" | "affiliate";
  };
  /**
   * Null for an affiliate: they sell for other people's stores and own none.
   * The payout block below is still theirs, which is why they read this route.
   */
  store: StoreProfileDto | null;
  /** Where the seller is paid out. Null fields mean it has not been set up yet. */
  payout: {
    bankName: string | null;
    /** Paystack bank code, needed to actually send a transfer. */
    bankCode: string | null;
    accountNumber: string | null;
    accountName: string | null;
    /** True once all three fields are present. */
    complete: boolean;
  };
  /** Null whenever `store` is — these settings belong to a store. */
  settings: ProfileSettingsDto | null;
};

export type UpdatePayoutDto = {
  bankName?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
};

export type UpdateStoreDetailsDto = {
  name?: string;
  slug?: string;
  category?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
};

export type UpdateAccountDto = {
  name?: string;
  phone?: string;
  email?: string | null;
};

export type UpdateSettingsDto = {
  defaultCheckoutMode?: CheckoutMode;
  affiliateCommissionPercent?: number;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
