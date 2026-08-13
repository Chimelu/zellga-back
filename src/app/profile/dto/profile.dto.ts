export type BusinessProfileDto = {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: "seller" | "affiliate";
  };
  store: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    description: string | null;
    link: string;
  };
  /** Where the seller is paid out. Null fields mean it has not been set up yet. */
  payout: {
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
    /** True once all three fields are present. */
    complete: boolean;
  };
  settings: {
    /** Default checkout path for new items */
    defaultCheckoutMode: "whatsapp" | "platform";
    /** Store-wide affiliate rate; 0 means affiliates are switched off. */
    affiliateCommissionPercent: number;
  };
};

export type UpdatePayoutDto = {
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
};

export type UpdateStoreDetailsDto = {
  name?: string;
  slug?: string;
  category?: string | null;
  description?: string | null;
};

export type UpdateAccountDto = {
  name?: string;
  phone?: string;
  email?: string | null;
};

export type UpdateSettingsDto = {
  defaultCheckoutMode?: "whatsapp" | "platform";
  affiliateCommissionPercent?: number;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
