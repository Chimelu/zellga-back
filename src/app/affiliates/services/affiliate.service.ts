import { randomUUID } from "crypto";
import {
  Affiliate,
  AffiliateInvite,
} from "../../../core/models/affiliate.model";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../core/errors/app.error";
import type { Store } from "../../../core/models/store.model";
import type { User } from "../../../core/models/user.model";
import type {
  AffiliateEarnings,
  AffiliateInviteRepository,
  AffiliateRepository,
} from "../../../core/repositories/affiliate.repository";
import type { ProductRepository } from "../../../core/repositories/product.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type { UserRepository } from "../../../core/repositories/user.repository";
import type { Mailer } from "../../../core/services/mailer";
import { generateInviteToken, generateRefCode } from "../../../core/utils/ref-code";
import { affiliateInviteEmail } from "../../../infrastructure/email/templates/affiliate-invite";
import type {
  AffiliateDashboardDto,
  AffiliateProductDto,
  AffiliateProgramDto,
  AffiliateSalesPageDto,
  FailedInviteDto,
  InviteResultDto,
  ManagedAffiliateDto,
  ManagedInviteDto,
  MyAffiliationDto,
} from "../dto/affiliate.dto";

const INVITE_TTL_DAYS = 14;

const EMPTY_EARNINGS: AffiliateEarnings = {
  orders: 0,
  revenue: 0,
  commission: 0,
  confirmedCommission: 0,
  pendingCommission: 0,
};

export class AffiliateService {
  constructor(
    private readonly affiliates: AffiliateRepository,
    private readonly invites: AffiliateInviteRepository,
    private readonly stores: StoreRepository,
    private readonly users: UserRepository,
    private readonly products: ProductRepository,
    private readonly mailer: Mailer,
    private readonly appUrl: string
  ) {}

  private shareLink(storeSlug: string, refCode: string): string {
    return `${this.appUrl}/store/${storeSlug}?ref=${refCode}`;
  }

  private async requireOwnedStore(userId: string) {
    const store = await this.stores.findByOwnerId(userId);
    if (!store) {
      throw new ForbiddenError("Only a store owner can manage affiliates");
    }
    return store;
  }

  // ── Seller side ────────────────────────────────────────────────────────

  async getProgram(userId: string): Promise<AffiliateProgramDto> {
    const store = await this.requireOwnedStore(userId);

    const [affiliates, invites] = await Promise.all([
      this.affiliates.listByStore(store.id),
      this.invites.listByStore(store.id),
    ]);

    const earnings = await this.affiliates.earningsFor(
      affiliates.map((affiliate) => affiliate.id)
    );

    const rows: ManagedAffiliateDto[] = [];
    for (const affiliate of affiliates) {
      const user = await this.users.findById(affiliate.userId);
      const stats = earnings.get(affiliate.id) ?? EMPTY_EARNINGS;
      rows.push({
        id: affiliate.id,
        name: user?.name ?? "Unknown",
        email: user?.email ?? null,
        phone: user?.phone ?? "",
        refCode: affiliate.refCode,
        shareLink: this.shareLink(store.slug, affiliate.refCode),
        status: affiliate.status,
        commissionPercent: affiliate.commissionPercent,
        joinedAt: affiliate.createdAt.toISOString(),
        earnings: stats,
      });
    }

    const now = new Date();
    const inviteRows: ManagedInviteDto[] = invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      status: invite.status,
      commissionPercent: invite.commissionPercent,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
      expired: invite.status === "pending" && invite.isExpired(now),
    }));

    return {
      commissionPercent: store.affiliateCommissionPercent,
      affiliates: rows,
      invites: inviteRows,
      totals: {
        activeAffiliates: rows.filter((row) => row.status === "active").length,
        pendingInvites: inviteRows.filter(
          (row) => row.status === "pending" && !row.expired
        ).length,
        commissionOwed: rows.reduce(
          (sum, row) => sum + row.earnings.confirmedCommission,
          0
        ),
        attributedRevenue: rows.reduce(
          (sum, row) => sum + row.earnings.revenue,
          0
        ),
      },
    };
  }

  /**
   * Invites a batch of addresses. Each is sent on its own, so one address that
   * is already an affiliate — or that the mail server rejects — does not stop
   * the others going out. When not a single invite made it, the first failure
   * is thrown instead, because there is no partial success to report.
   */
  async inviteMany(userId: string, emails: string[]): Promise<InviteResultDto> {
    const store = await this.requireOwnedStore(userId);
    const owner = await this.users.findById(userId);

    if (store.affiliateCommissionPercent <= 0) {
      throw new ValidationError(
        "Set a commission rate before inviting affiliates"
      );
    }

    const sent: ManagedInviteDto[] = [];
    const failed: FailedInviteDto[] = [];
    let firstError: AppError | null = null;

    for (const email of emails) {
      try {
        sent.push(await this.sendInvite(store, owner, email));
      } catch (err) {
        // Anything that is not a handled application error is a real fault —
        // let it bubble rather than reporting it as a bad email address.
        if (!(err instanceof AppError)) throw err;
        firstError = firstError ?? err;
        failed.push({ email, reason: err.message });
      }
    }

    if (sent.length === 0 && firstError) {
      throw firstError;
    }

    return { sent, failed };
  }

  /**
   * Sends (or re-sends) one invite. A pending invite for the same address is
   * reused with a fresh token and expiry rather than piling up duplicate rows.
   */
  private async sendInvite(
    store: Store,
    owner: User | null,
    email: string
  ): Promise<ManagedInviteDto> {
    const normalized = email.trim().toLowerCase();

    if (owner?.email && owner.email === normalized) {
      throw new ValidationError("You cannot invite yourself as an affiliate");
    }

    // Already selling for this store? Nothing to invite.
    const existingUser = await this.users.findByEmail(normalized);
    if (existingUser) {
      const already = await this.affiliates.findByStoreAndUser(
        store.id,
        existingUser.id
      );
      if (already) {
        throw new ConflictError(
          "That person is already an affiliate for your store",
          "ALREADY_AFFILIATE"
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    const pending = await this.invites.findPendingByStoreAndEmail(
      store.id,
      normalized
    );

    const invite = pending
      ? Object.assign(pending, {
          token: generateInviteToken(),
          commissionPercent: store.affiliateCommissionPercent,
          expiresAt,
          updatedAt: now,
        })
      : new AffiliateInvite({
          id: randomUUID(),
          storeId: store.id,
          email: normalized,
          token: generateInviteToken(),
          status: "pending",
          commissionPercent: store.affiliateCommissionPercent,
          expiresAt,
          acceptedAt: null,
          createdAt: now,
          updatedAt: now,
        });

    const saved = await this.invites.save(invite);

    // A failed send must not leave a silently-unusable invite behind.
    try {
      await this.mailer.send(
        affiliateInviteEmail({
          to: saved.email,
          storeName: store.name,
          inviterName: owner?.name ?? store.name,
          commissionPercent: saved.commissionPercent,
          acceptUrl: `${this.appUrl}/affiliate/invite/${saved.token}`,
          expiresInDays: INVITE_TTL_DAYS,
        })
      );
    } catch (err) {
      console.error("Failed to send affiliate invite email", err);
      saved.status = "revoked";
      saved.updatedAt = new Date();
      await this.invites.save(saved);
      throw new ConflictError(
        "Could not send the invite email. Check mail settings and try again.",
        "EMAIL_SEND_FAILED"
      );
    }

    return {
      id: saved.id,
      email: saved.email,
      status: saved.status,
      commissionPercent: saved.commissionPercent,
      expiresAt: saved.expiresAt.toISOString(),
      createdAt: saved.createdAt.toISOString(),
      expired: false,
    };
  }

  async revokeInvite(userId: string, inviteId: string): Promise<void> {
    const store = await this.requireOwnedStore(userId);
    const invite = await this.invites.findById(inviteId);

    if (!invite || invite.storeId !== store.id) {
      throw new NotFoundError("Invite not found");
    }
    if (invite.status === "accepted") {
      throw new ConflictError(
        "That invite was already accepted — remove the affiliate instead",
        "INVITE_USED"
      );
    }

    invite.status = "revoked";
    invite.updatedAt = new Date();
    await this.invites.save(invite);
  }

  async setAffiliateStatus(
    userId: string,
    affiliateId: string,
    status: "active" | "suspended"
  ): Promise<void> {
    const store = await this.requireOwnedStore(userId);
    const affiliate = await this.affiliates.findById(affiliateId);

    if (!affiliate || affiliate.storeId !== store.id) {
      throw new NotFoundError("Affiliate not found");
    }

    affiliate.status = status;
    affiliate.updatedAt = new Date();
    await this.affiliates.save(affiliate);
  }

  async removeAffiliate(userId: string, affiliateId: string): Promise<void> {
    const store = await this.requireOwnedStore(userId);
    const affiliate = await this.affiliates.findById(affiliateId);

    if (!affiliate || affiliate.storeId !== store.id) {
      throw new NotFoundError("Affiliate not found");
    }

    // Past orders keep their commission record; the FK is ON DELETE SET NULL.
    await this.affiliates.remove(affiliate.id);
  }

  // ── Affiliate side ─────────────────────────────────────────────────────

  async getDashboard(userId: string): Promise<AffiliateDashboardDto> {
    const affiliations = await this.affiliates.listByUser(userId);
    const earnings = await this.affiliates.earningsFor(
      affiliations.map((affiliate) => affiliate.id)
    );

    const rows: MyAffiliationDto[] = [];
    for (const affiliate of affiliations) {
      const store = await this.stores.findById(affiliate.storeId);
      if (!store) continue;
      rows.push({
        id: affiliate.id,
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        refCode: affiliate.refCode,
        shareLink: this.shareLink(store.slug, affiliate.refCode),
        status: affiliate.status,
        commissionPercent: affiliate.commissionPercent,
        joinedAt: affiliate.createdAt.toISOString(),
        earnings: earnings.get(affiliate.id) ?? EMPTY_EARNINGS,
      });
    }

    return {
      affiliations: rows,
      totals: rows.reduce(
        (acc, row) => ({
          stores: acc.stores + 1,
          orders: acc.orders + row.earnings.orders,
          revenue: acc.revenue + row.earnings.revenue,
          commission: acc.commission + row.earnings.commission,
          confirmedCommission:
            acc.confirmedCommission + row.earnings.confirmedCommission,
          pendingCommission:
            acc.pendingCommission + row.earnings.pendingCommission,
        }),
        { stores: 0, ...EMPTY_EARNINGS }
      ),
    };
  }

  /** Items the affiliate can promote, with their own ref code baked into each link. */
  async listProducts(
    userId: string,
    storeId?: string
  ): Promise<AffiliateProductDto[]> {
    const affiliations = await this.affiliates.listByUser(userId);
    const scoped = storeId
      ? affiliations.filter((affiliate) => affiliate.storeId === storeId)
      : affiliations;

    const out: AffiliateProductDto[] = [];
    for (const affiliate of scoped) {
      const store = await this.stores.findById(affiliate.storeId);
      if (!store) continue;

      const items = await this.products.findVisibleByStoreId(store.id);
      for (const product of items) {
        out.push({
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          imageUrl: product.imageUrl,
          category: product.category,
          available: product.available,
          estimatedCommission: affiliate.commissionOn(product.price),
          shareLink: `${this.appUrl}/store/${store.slug}/item/${product.id}?ref=${affiliate.refCode}`,
        });
      }
    }

    return out;
  }

  async listSales(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<AffiliateSalesPageDto> {
    const affiliations = await this.affiliates.listByUser(userId);
    const result = await this.affiliates.listSales(
      affiliations.map((affiliate) => affiliate.id),
      page,
      pageSize
    );

    return {
      ...result,
      items: result.items.map((sale) => ({
        ...sale,
        createdAt: sale.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Resolves a `ref` code to the affiliate who should be credited. Returns null
   * for unknown, suspended, or wrong-store codes so a bad link still checks out
   * normally — it just earns nobody a commission.
   */
  async resolveReferral(
    storeId: string,
    refCode: string | null | undefined
  ): Promise<Affiliate | null> {
    if (!refCode) return null;
    const affiliate = await this.affiliates.findByRefCode(refCode.trim());
    if (!affiliate) return null;
    if (affiliate.storeId !== storeId) return null;
    if (affiliate.status !== "active") return null;
    return affiliate;
  }
}

export { generateRefCode };
