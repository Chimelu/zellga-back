import { Repository } from "typeorm";
import {
  ORDER_NUMBER_START,
  Order,
  buildOrderReference,
} from "../../../core/models/order.model";
import type {
  OrderDraft,
  OrderListPage,
  OrderListQuery,
  OrderRepository,
  OrderSummary,
} from "../../../core/repositories/order.repository";
import { AppDataSource } from "../data-source";
import { OrderOrmEntity } from "../entities/order.orm-entity";

function toDomain(row: OrderOrmEntity): Order {
  return new Order({
    id: row.id,
    orderNumber: Number(row.orderNumber ?? 0),
    reference: row.reference,
    storeId: row.storeId,
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    buyerEmail: row.buyerEmail ?? null,
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total ?? 0),
    channel: row.channel,
    status: row.status,
    note: row.note,
    affiliateId: row.affiliateId,
    commissionAmount: Number(row.commissionAmount ?? 0),
    paymentStatus: row.paymentStatus ?? "unpaid",
    paymentProvider: row.paymentProvider ?? null,
    paymentReference: row.paymentReference ?? null,
    paymentChannel: row.paymentChannel ?? null,
    amountPaid: Number(row.amountPaid ?? 0),
    paidAt: row.paidAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(order: Order): OrderOrmEntity {
  const row = new OrderOrmEntity();
  row.id = order.id;
  row.orderNumber = order.orderNumber;
  row.reference = order.reference;
  row.storeId = order.storeId;
  row.buyerName = order.buyerName;
  row.buyerPhone = order.buyerPhone;
  row.buyerEmail = order.buyerEmail;
  row.items = order.items;
  row.total = order.total.toFixed(2);
  row.channel = order.channel;
  row.status = order.status;
  row.note = order.note;
  row.affiliateId = order.affiliateId;
  row.commissionAmount = order.commissionAmount.toFixed(2);
  row.paymentStatus = order.paymentStatus;
  row.paymentProvider = order.paymentProvider;
  row.paymentReference = order.paymentReference;
  row.paymentChannel = order.paymentChannel;
  row.amountPaid = order.amountPaid.toFixed(2);
  row.paidAt = order.paidAt;
  row.createdAt = order.createdAt;
  row.updatedAt = order.updatedAt;
  return row;
}

const SORT_COLUMNS: Record<
  OrderListQuery["sort"],
  { column: string; direction: "ASC" | "DESC" }
> = {
  newest: { column: "o.created_at", direction: "DESC" },
  oldest: { column: "o.created_at", direction: "ASC" },
  highest: { column: "o.total", direction: "DESC" },
  lowest: { column: "o.total", direction: "ASC" },
};

export class TypeOrmOrderRepository implements OrderRepository {
  private readonly repo: Repository<OrderOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(OrderOrmEntity);
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByStoreAndReference(
    storeId: string,
    reference: string
  ): Promise<Order | null> {
    const row = await this.repo.findOne({ where: { storeId, reference } });
    return row ? toDomain(row) : null;
  }

  async findByPaymentReference(
    paymentReference: string
  ): Promise<Order | null> {
    const row = await this.repo.findOne({ where: { paymentReference } });
    return row ? toDomain(row) : null;
  }

  /**
   * Allocates the store's next order number and inserts in one transaction.
   * The advisory lock is keyed on the store, so two buyers checking out at the
   * same second queue behind each other instead of racing for the same number
   * — and buyers of *other* stores are never blocked.
   */
  async create(draft: OrderDraft): Promise<Order> {
    return this.repo.manager.transaction(async (manager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        draft.storeId,
      ]);

      const [{ next }] = (await manager.query(
        `SELECT COALESCE(MAX(order_number), $2) + 1 AS next
           FROM orders
          WHERE store_id = $1`,
        [draft.storeId, ORDER_NUMBER_START]
      )) as [{ next: number | string }];

      const orderNumber = Number(next);
      const order = new Order({
        ...draft,
        orderNumber,
        reference: buildOrderReference(orderNumber),
      });

      const saved = await manager.save(OrderOrmEntity, toOrm(order));
      return toDomain(saved);
    });
  }

  async listByStore(
    storeId: string,
    query: OrderListQuery
  ): Promise<OrderListPage> {
    const qb = this.repo
      .createQueryBuilder("o")
      .where("o.store_id = :storeId", { storeId });

    if (query.status) {
      qb.andWhere("o.status = :status", { status: query.status });
    }
    if (query.paymentStatus) {
      qb.andWhere("o.payment_status = :paymentStatus", {
        paymentStatus: query.paymentStatus,
      });
    }
    if (query.channel) {
      qb.andWhere("o.channel = :channel", { channel: query.channel });
    }
    if (query.search) {
      // Buyers quote their reference; sellers search by the name or number.
      qb.andWhere(
        "(o.reference ILIKE :search OR o.buyer_name ILIKE :search OR o.buyer_phone ILIKE :search)",
        { search: `%${query.search}%` }
      );
    }

    const sort = SORT_COLUMNS[query.sort] ?? SORT_COLUMNS.newest;
    qb.orderBy(sort.column, sort.direction)
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map(toDomain),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async summaryByStore(storeId: string): Promise<OrderSummary> {
    const row = await this.repo
      .createQueryBuilder("o")
      .select("COUNT(*)::int", "orders")
      .addSelect(
        "COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelled'), 0)",
        "revenue"
      )
      .addSelect(
        "COALESCE(SUM(o.amount_paid) FILTER (WHERE o.payment_status = 'paid'), 0)",
        "paidRevenue"
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE o.payment_status = 'pending')::int",
        "pendingPayments"
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE o.status NOT IN ('completed', 'cancelled'))::int",
        "open"
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE o.channel = 'whatsapp')::int",
        "whatsappOrders"
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE o.channel = 'platform')::int",
        "platformOrders"
      )
      .where("o.store_id = :storeId", { storeId })
      .getRawOne<{
        orders: number;
        revenue: string;
        paidRevenue: string;
        pendingPayments: number;
        open: number;
        whatsappOrders: number;
        platformOrders: number;
      }>();

    return {
      orders: Number(row?.orders ?? 0),
      revenue: Number(row?.revenue ?? 0),
      paidRevenue: Number(row?.paidRevenue ?? 0),
      pendingPayments: Number(row?.pendingPayments ?? 0),
      open: Number(row?.open ?? 0),
      whatsappOrders: Number(row?.whatsappOrders ?? 0),
      platformOrders: Number(row?.platformOrders ?? 0),
    };
  }

  async save(order: Order): Promise<Order> {
    const saved = await this.repo.save(toOrm(order));
    return toDomain(saved);
  }
}
