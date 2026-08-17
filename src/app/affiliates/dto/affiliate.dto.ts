import type {
  OrderStatus,
  PaymentStatus,
} from "../../../core/models/order.model";

export type AffiliateEarningsDto = {
  orders: number;
  revenue: number;
  commission: number;
  confirmedCommission: number;
  pendingCommission: number;
};

/** One affiliate as the store owner sees them. */
export type ManagedAffiliateDto = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  refCode: string;
  shareLink: string;
  status: "active" | "suspended";
  commissionPercent: number;
  joinedAt: string;
  earnings: AffiliateEarningsDto;
};

export type ManagedInviteDto = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  commissionPercent: number;
  expiresAt: string;
  createdAt: string;
  /** True when pending but past its expiry, so the UI can offer a resend. */
  expired: boolean;
};

export type AffiliateProgramDto = {
  commissionPercent: number;
  affiliates: ManagedAffiliateDto[];
  invites: ManagedInviteDto[];
  totals: {
    activeAffiliates: number;
    pendingInvites: number;
    /** Commission owed across every affiliate of this store. */
    commissionOwed: number;
    attributedRevenue: number;
  };
};

export type InviteAffiliateDto = {
  email: string;
};

/** One store a user sells for, as the affiliate sees it. */
export type MyAffiliationDto = {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  refCode: string;
  shareLink: string;
  status: "active" | "suspended";
  commissionPercent: number;
  joinedAt: string;
  earnings: AffiliateEarningsDto;
};

export type AffiliateDashboardDto = {
  affiliations: MyAffiliationDto[];
  totals: AffiliateEarningsDto & { stores: number };
};

export type AffiliateProductDto = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  available: boolean;
  /** What the affiliate earns if this item sells at list price. */
  estimatedCommission: number;
  /** Deep link to the item carrying the affiliate's ref code. */
  shareLink: string;
};

export type AffiliateSaleDto = {
  orderId: string;
  reference: string;
  buyerName: string;
  itemCount: number;
  total: number;
  commission: number;
  status: OrderStatus;
  /** Commission is only really owed once this reads `paid`. */
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type AffiliateSalesPageDto = {
  items: AffiliateSaleDto[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};
