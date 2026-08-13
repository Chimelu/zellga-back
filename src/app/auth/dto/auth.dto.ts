export type RegisterDto = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  storeName: string;
  category?: string;
};

export type LoginDto = {
  /** A WhatsApp number or an email address — sellers use one, affiliates the other. */
  identifier: string;
  password: string;
};

/** Details shown on the invite landing page before the recipient commits. */
export type InvitePreviewDto = {
  storeName: string;
  storeSlug: string;
  inviterName: string;
  email: string;
  commissionPercent: number;
  expiresAt: string;
  /** False when the invite was revoked, already used, or has expired. */
  acceptable: boolean;
  /** Set when an account already exists for the invited address. */
  hasAccount: boolean;
};

export type AcceptInviteDto = {
  token: string;
  name: string;
  phone: string;
  password: string;
};

export type AuthUserDto = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "seller" | "affiliate";
};

export type AuthStoreDto = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
};

export type AuthResponseDto = {
  token: string;
  user: AuthUserDto;
  store: AuthStoreDto | null;
};
