import type {
  Affiliate,
  AffiliateInvite,
} from "../models/affiliate.model";

/** Aggregated earnings for one affiliate, computed from attributed orders. */
export type AffiliateEarnings = {
  orders: number;
  /** Gross value of attributed orders. */
  revenue: number;
  /** Commission across all attributed orders, regardless of status. */
  commission: number;
  /** Commission on orders that reached `paid` or `fulfilled`. */
  confirmedCommission: number;
  /** Commission still on `pending` orders. */
  pendingCommission: number;
};

export type AffiliateSale = {
  orderId: string;
  reference: string;
  buyerName: string;
  itemCount: number;
  total: number;
  commission: number;
  status: "pending" | "paid" | "fulfilled" | "cancelled";
  createdAt: Date;
};

export type AffiliateSalesPage = {
  items: AffiliateSale[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export interface AffiliateRepository {
  findById(id: string): Promise<Affiliate | null>;
  findByRefCode(refCode: string): Promise<Affiliate | null>;
  findByStoreAndUser(
    storeId: string,
    userId: string
  ): Promise<Affiliate | null>;
  /** Every affiliate selling for a store, for the seller's management list. */
  listByStore(storeId: string): Promise<Affiliate[]>;
  /** Every store a user is an affiliate for, for their own dashboard. */
  listByUser(userId: string): Promise<Affiliate[]>;
  refCodeExists(refCode: string): Promise<boolean>;
  save(affiliate: Affiliate): Promise<Affiliate>;
  remove(id: string): Promise<void>;

  earningsFor(affiliateIds: string[]): Promise<Map<string, AffiliateEarnings>>;
  listSales(
    affiliateIds: string[],
    page: number,
    pageSize: number
  ): Promise<AffiliateSalesPage>;
}

export interface AffiliateInviteRepository {
  findByToken(token: string): Promise<AffiliateInvite | null>;
  findPendingByStoreAndEmail(
    storeId: string,
    email: string
  ): Promise<AffiliateInvite | null>;
  findById(id: string): Promise<AffiliateInvite | null>;
  listByStore(storeId: string): Promise<AffiliateInvite[]>;
  save(invite: AffiliateInvite): Promise<AffiliateInvite>;
}
