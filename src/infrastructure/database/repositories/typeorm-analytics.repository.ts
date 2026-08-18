import { Repository } from "typeorm";
import type { StoreEvent, StoreEventType } from "../../../core/models/store-event.model";
import type {
  AnalyticsPoint,
  AnalyticsRepository,
  AnalyticsTotals,
  TopProduct,
} from "../../../core/repositories/analytics.repository";
import { AppDataSource } from "../data-source";
import { StoreEventOrmEntity } from "../entities/store-event.orm-entity";

export class TypeOrmAnalyticsRepository implements AnalyticsRepository {
  private readonly events: Repository<StoreEventOrmEntity>;

  constructor() {
    this.events = AppDataSource.getRepository(StoreEventOrmEntity);
  }

  async record(event: StoreEvent): Promise<void> {
    const row = new StoreEventOrmEntity();
    row.id = event.id;
    row.storeId = event.storeId;
    row.productId = event.productId;
    row.type = event.type;
    row.visitorId = event.visitorId;
    row.createdAt = event.createdAt;
    await this.events.save(row);
  }

  async wasRecentlySeen(
    storeId: string,
    type: StoreEventType,
    visitorId: string,
    productId: string | null,
    withinMinutes: number
  ): Promise<boolean> {
    const qb = this.events
      .createQueryBuilder("e")
      .where("e.store_id = :storeId", { storeId })
      .andWhere("e.type = :type", { type })
      .andWhere("e.visitor_id = :visitorId", { visitorId })
      .andWhere(`e.created_at > now() - (:mins || ' minutes')::interval`, {
        mins: String(withinMinutes),
      });

    // A click on product A must not suppress a click on product B.
    if (productId) {
      qb.andWhere("e.product_id = :productId", { productId });
    } else {
      qb.andWhere("e.product_id IS NULL");
    }

    return (await qb.getCount()) > 0;
  }

  async totals(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<AnalyticsTotals> {
    const eventRow = await this.events
      .createQueryBuilder("e")
      .select(
        "COUNT(*) FILTER (WHERE e.type = 'store_view')::int",
        "views"
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE e.type = 'item_click')::int",
        "clicks"
      )
      .addSelect("COUNT(*) FILTER (WHERE e.type = 'share')::int", "shares")
      .where("e.store_id = :storeId", { storeId })
      .andWhere("e.created_at >= :from AND e.created_at < :to", { from, to })
      .getRawOne<{ views: number; clicks: number; shares: number }>();

    // Orders live in their own table; counted by when they were placed.
    const orderRow = await AppDataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE channel = 'whatsapp')::int AS "whatsappOrders",
         COUNT(*) FILTER (WHERE channel = 'platform')::int AS "onlineOrders",
         COUNT(*)::int AS "orders",
         COALESCE(SUM(amount_paid) FILTER (WHERE payment_status = 'paid'), 0) AS "revenue"
       FROM orders
      WHERE store_id = $1
        AND created_at >= $2
        AND created_at < $3
        AND status <> 'cancelled'`,
      [storeId, from, to]
    );

    const o = orderRow[0] ?? {};

    return {
      views: Number(eventRow?.views ?? 0),
      clicks: Number(eventRow?.clicks ?? 0),
      shares: Number(eventRow?.shares ?? 0),
      whatsappOrders: Number(o.whatsappOrders ?? 0),
      onlineOrders: Number(o.onlineOrders ?? 0),
      orders: Number(o.orders ?? 0),
      revenue: Number(o.revenue ?? 0),
    };
  }

  /**
   * `generate_series` supplies every day in the window, so quiet days come back
   * as zeroes instead of gaps — the chart needs a continuous axis.
   */
  async series(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<AnalyticsPoint[]> {
    const rows = await AppDataSource.query(
      `WITH days AS (
         SELECT generate_series($2::date, ($3::timestamptz - interval '1 day')::date, interval '1 day')::date AS day
       ),
       ev AS (
         SELECT created_at::date AS day,
                COUNT(*) FILTER (WHERE type = 'store_view')::int AS views,
                COUNT(*) FILTER (WHERE type = 'item_click')::int AS clicks
           FROM store_events
          WHERE store_id = $1 AND created_at >= $2 AND created_at < $3
          GROUP BY 1
       ),
       ord AS (
         SELECT created_at::date AS day, COUNT(*)::int AS orders
           FROM orders
          WHERE store_id = $1 AND created_at >= $2 AND created_at < $3
            AND status <> 'cancelled'
          GROUP BY 1
       )
       SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
              COALESCE(ev.views, 0) AS views,
              COALESCE(ev.clicks, 0) AS clicks,
              COALESCE(ord.orders, 0) AS orders
         FROM days
         LEFT JOIN ev ON ev.day = days.day
         LEFT JOIN ord ON ord.day = days.day
        ORDER BY days.day`,
      [storeId, from, to]
    );

    return rows.map(
      (row: {
        date: string;
        views: number | string;
        clicks: number | string;
        orders: number | string;
      }) => ({
        date: row.date,
        views: Number(row.views ?? 0),
        clicks: Number(row.clicks ?? 0),
        orders: Number(row.orders ?? 0),
      })
    );
  }

  async topProducts(
    storeId: string,
    from: Date,
    to: Date,
    limit: number
  ): Promise<TopProduct[]> {
    const rows = await AppDataSource.query(
      `SELECT e.product_id AS "productId",
              COALESCE(p.name, 'Removed item') AS name,
              COUNT(*)::int AS clicks
         FROM store_events e
         LEFT JOIN products p ON p.id = e.product_id
        WHERE e.store_id = $1
          AND e.type = 'item_click'
          AND e.product_id IS NOT NULL
          AND e.created_at >= $2
          AND e.created_at < $3
        GROUP BY e.product_id, p.name
        ORDER BY clicks DESC
        LIMIT $4`,
      [storeId, from, to, limit]
    );

    return rows.map((row: { productId: string; name: string; clicks: number }) => ({
      productId: row.productId,
      name: row.name,
      clicks: Number(row.clicks ?? 0),
    }));
  }
}
