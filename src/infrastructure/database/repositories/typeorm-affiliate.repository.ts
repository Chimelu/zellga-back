import { In, Repository } from "typeorm";
import {
  Affiliate,
  AffiliateInvite,
} from "../../../core/models/affiliate.model";
import type {
  AffiliateEarnings,
  AffiliateInviteRepository,
  AffiliateRepository,
  AffiliateSalesPage,
} from "../../../core/repositories/affiliate.repository";
import { AppDataSource } from "../data-source";
import { AffiliateOrmEntity } from "../entities/affiliate.orm-entity";
import { AffiliateInviteOrmEntity } from "../entities/affiliate-invite.orm-entity";
import { OrderOrmEntity } from "../entities/order.orm-entity";

function toDomain(row: AffiliateOrmEntity): Affiliate {
  return new Affiliate({
    id: row.id,
    storeId: row.storeId,
    userId: row.userId,
    refCode: row.refCode,
    status: row.status,
    commissionPercent: Number(row.commissionPercent ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(affiliate: Affiliate): AffiliateOrmEntity {
  const row = new AffiliateOrmEntity();
  row.id = affiliate.id;
  row.storeId = affiliate.storeId;
  row.userId = affiliate.userId;
  row.refCode = affiliate.refCode;
  row.status = affiliate.status;
  row.commissionPercent = affiliate.commissionPercent.toFixed(2);
  row.createdAt = affiliate.createdAt;
  row.updatedAt = affiliate.updatedAt;
  return row;
}

const EMPTY_EARNINGS: AffiliateEarnings = {
  orders: 0,
  revenue: 0,
  commission: 0,
  confirmedCommission: 0,
  pendingCommission: 0,
};

export class TypeOrmAffiliateRepository implements AffiliateRepository {
  private readonly repo: Repository<AffiliateOrmEntity>;
  private readonly orders: Repository<OrderOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(AffiliateOrmEntity);
    this.orders = AppDataSource.getRepository(OrderOrmEntity);
  }

  async findById(id: string): Promise<Affiliate | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByRefCode(refCode: string): Promise<Affiliate | null> {
    const row = await this.repo.findOne({ where: { refCode } });
    return row ? toDomain(row) : null;
  }

  async findByStoreAndUser(
    storeId: string,
    userId: string
  ): Promise<Affiliate | null> {
    const row = await this.repo.findOne({ where: { storeId, userId } });
    return row ? toDomain(row) : null;
  }

  async listByStore(storeId: string): Promise<Affiliate[]> {
    const rows = await this.repo.find({
      where: { storeId },
      order: { createdAt: "DESC" },
    });
    return rows.map(toDomain);
  }

  async listByUser(userId: string): Promise<Affiliate[]> {
    const rows = await this.repo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    return rows.map(toDomain);
  }

  async refCodeExists(refCode: string): Promise<boolean> {
    return (await this.repo.countBy({ refCode })) > 0;
  }

  async save(affiliate: Affiliate): Promise<Affiliate> {
    const saved = await this.repo.save(toOrm(affiliate));
    return toDomain(saved);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  /**
   * Cancelled orders are excluded everywhere: they earn nothing. "Confirmed"
   * means the order reached paid or fulfilled; anything still pending is
   * reported separately so an affiliate can tell banked from expected.
   */
  async earningsFor(
    affiliateIds: string[]
  ): Promise<Map<string, AffiliateEarnings>> {
    const result = new Map<string, AffiliateEarnings>();
    if (affiliateIds.length === 0) return result;

    for (const id of affiliateIds) {
      result.set(id, { ...EMPTY_EARNINGS });
    }

    const rows = await this.orders
      .createQueryBuilder("o")
      .select("o.affiliate_id", "affiliateId")
      .addSelect("COUNT(*)::int", "orders")
      .addSelect("COALESCE(SUM(o.total), 0)", "revenue")
      .addSelect("COALESCE(SUM(o.commission_amount), 0)", "commission")
      .addSelect(
        "COALESCE(SUM(CASE WHEN o.status IN ('paid','fulfilled') THEN o.commission_amount ELSE 0 END), 0)",
        "confirmedCommission"
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN o.status = 'pending' THEN o.commission_amount ELSE 0 END), 0)",
        "pendingCommission"
      )
      .where("o.affiliate_id IN (:...affiliateIds)", { affiliateIds })
      .andWhere("o.status <> 'cancelled'")
      .groupBy("o.affiliate_id")
      .getRawMany<{
        affiliateId: string;
        orders: number;
        revenue: string;
        commission: string;
        confirmedCommission: string;
        pendingCommission: string;
      }>();

    for (const row of rows) {
      result.set(row.affiliateId, {
        orders: Number(row.orders ?? 0),
        revenue: Number(row.revenue ?? 0),
        commission: Number(row.commission ?? 0),
        confirmedCommission: Number(row.confirmedCommission ?? 0),
        pendingCommission: Number(row.pendingCommission ?? 0),
      });
    }

    return result;
  }

  async listSales(
    affiliateIds: string[],
    page: number,
    pageSize: number
  ): Promise<AffiliateSalesPage> {
    if (affiliateIds.length === 0) {
      return { items: [], total: 0, page, pageSize, pageCount: 0 };
    }

    const [rows, total] = await this.orders.findAndCount({
      where: { affiliateId: In(affiliateIds) },
      order: { createdAt: "DESC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: rows.map((row) => ({
        orderId: row.id,
        reference: row.reference,
        buyerName: row.buyerName,
        itemCount: Array.isArray(row.items)
          ? row.items.reduce((sum, item) => sum + item.quantity, 0)
          : 0,
        total: Number(row.total ?? 0),
        commission: Number(row.commissionAmount ?? 0),
        status: row.status,
        createdAt: row.createdAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}

function inviteToDomain(row: AffiliateInviteOrmEntity): AffiliateInvite {
  return new AffiliateInvite({
    id: row.id,
    storeId: row.storeId,
    email: row.email,
    token: row.token,
    status: row.status,
    commissionPercent: Number(row.commissionPercent ?? 0),
    expiresAt: row.expiresAt,
    acceptedAt: row.acceptedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function inviteToOrm(invite: AffiliateInvite): AffiliateInviteOrmEntity {
  const row = new AffiliateInviteOrmEntity();
  row.id = invite.id;
  row.storeId = invite.storeId;
  row.email = invite.email;
  row.token = invite.token;
  row.status = invite.status;
  row.commissionPercent = invite.commissionPercent.toFixed(2);
  row.expiresAt = invite.expiresAt;
  row.acceptedAt = invite.acceptedAt;
  row.createdAt = invite.createdAt;
  row.updatedAt = invite.updatedAt;
  return row;
}

export class TypeOrmAffiliateInviteRepository
  implements AffiliateInviteRepository
{
  private readonly repo: Repository<AffiliateInviteOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(AffiliateInviteOrmEntity);
  }

  async findByToken(token: string): Promise<AffiliateInvite | null> {
    const row = await this.repo.findOne({ where: { token } });
    return row ? inviteToDomain(row) : null;
  }

  async findPendingByStoreAndEmail(
    storeId: string,
    email: string
  ): Promise<AffiliateInvite | null> {
    const row = await this.repo.findOne({
      where: { storeId, email: email.trim().toLowerCase(), status: "pending" },
    });
    return row ? inviteToDomain(row) : null;
  }

  async findById(id: string): Promise<AffiliateInvite | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? inviteToDomain(row) : null;
  }

  async listByStore(storeId: string): Promise<AffiliateInvite[]> {
    const rows = await this.repo.find({
      where: { storeId },
      order: { createdAt: "DESC" },
    });
    return rows.map(inviteToDomain);
  }

  async save(invite: AffiliateInvite): Promise<AffiliateInvite> {
    const saved = await this.repo.save(inviteToOrm(invite));
    return inviteToDomain(saved);
  }
}
