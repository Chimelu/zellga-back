import { DataSource } from "typeorm";
import type {
  AdminAnalytics,
  AdminOrderListQuery,
  AdminOrderRow,
  AdminRepository,
  AdminUserListQuery,
  AdminUserRow,
  Paginated,
} from "../../../core/repositories/admin.repository";
import { AppDataSource } from "../data-source";

/** Postgres "relation does not exist" — the orders table has not been migrated yet. */
const UNDEFINED_TABLE = "42P01";

/**
 * The `orders` table ships with this module, so an environment that has not run
 * migrations yet should still serve the rest of the dashboard instead of 500ing.
 */
async function whenOrdersExist<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if ((err as { code?: string }).code === UNDEFINED_TABLE) return fallback;
    throw err;
  }
}

const num = (value: unknown): number => Number(value ?? 0) || 0;

const USER_SORT: Record<AdminUserListQuery["sort"], string> = {
  newest: "u.created_at DESC",
  oldest: "u.created_at ASC",
  name: "u.name ASC",
  products: "product_count DESC, u.created_at DESC",
};

const ORDER_SORT: Record<AdminOrderListQuery["sort"], string> = {
  newest: "o.created_at DESC",
  oldest: "o.created_at ASC",
  highest: "o.total DESC",
  lowest: "o.total ASC",
};

type UserRaw = {
  id: string;
  name: string;
  phone: string;
  created_at: Date;
  store_id: string | null;
  store_name: string | null;
  store_slug: string | null;
  store_category: string | null;
  store_checkout_mode: "whatsapp" | "platform" | null;
  store_created_at: Date | null;
  product_count: string;
};

type OrderRaw = {
  id: string;
  reference: string;
  buyer_name: string;
  buyer_phone: string;
  items: AdminOrderRow["items"] | null;
  total: string;
  channel: AdminOrderRow["channel"];
  status: AdminOrderRow["status"];
  note: string | null;
  created_at: Date;
  store_id: string | null;
  store_name: string | null;
  store_slug: string | null;
  owner_name: string | null;
};

function toUserRow(
  raw: UserRaw,
  orders: { count: number; revenue: number }
): AdminUserRow {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    createdAt: raw.created_at,
    store: raw.store_id
      ? {
          id: raw.store_id,
          name: raw.store_name ?? "",
          slug: raw.store_slug ?? "",
          category: raw.store_category,
          defaultCheckoutMode: raw.store_checkout_mode ?? "whatsapp",
          createdAt: raw.store_created_at ?? raw.created_at,
        }
      : null,
    productCount: num(raw.product_count),
    orderCount: orders.count,
    revenue: orders.revenue,
  };
}

function toOrderRow(raw: OrderRaw): AdminOrderRow {
  const items = Array.isArray(raw.items) ? raw.items : [];
  return {
    id: raw.id,
    reference: raw.reference,
    buyerName: raw.buyer_name,
    buyerPhone: raw.buyer_phone,
    items,
    itemCount: items.reduce((sum, item) => sum + num(item.quantity), 0),
    total: num(raw.total),
    channel: raw.channel,
    status: raw.status,
    note: raw.note,
    createdAt: raw.created_at,
    store: raw.store_id
      ? {
          id: raw.store_id,
          name: raw.store_name ?? "",
          slug: raw.store_slug ?? "",
          ownerName: raw.owner_name ?? "",
        }
      : null,
  };
}

export class TypeOrmAdminRepository implements AdminRepository {
  private readonly ds: DataSource;

  constructor(dataSource: DataSource = AppDataSource) {
    this.ds = dataSource;
  }

  private async orderTotalsByStore(
    storeIds: string[]
  ): Promise<Map<string, { count: number; revenue: number }>> {
    const totals = new Map<string, { count: number; revenue: number }>();
    if (!storeIds.length) return totals;

    const rows = await whenOrdersExist(
      () =>
        this.ds.query(
          `SELECT store_id,
                  COUNT(*)::int AS orders,
                  COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0) AS revenue
             FROM orders
            WHERE store_id = ANY($1::uuid[])
            GROUP BY store_id`,
          [storeIds]
        ) as Promise<{ store_id: string; orders: number; revenue: string }[]>,
      []
    );

    for (const row of rows) {
      totals.set(row.store_id, {
        count: num(row.orders),
        revenue: num(row.revenue),
      });
    }
    return totals;
  }

  private async hydrateUsers(raws: UserRaw[]): Promise<AdminUserRow[]> {
    const storeIds = raws
      .map((raw) => raw.store_id)
      .filter((id): id is string => Boolean(id));
    const totals = await this.orderTotalsByStore(storeIds);
    const empty = { count: 0, revenue: 0 };

    return raws.map((raw) =>
      toUserRow(raw, (raw.store_id && totals.get(raw.store_id)) || empty)
    );
  }

  async listUsers(query: AdminUserListQuery): Promise<Paginated<AdminUserRow>> {
    const { search, hasStore, sort, page, pageSize } = query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(u.name ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR s.name ILIKE $${params.length} OR s.slug ILIKE $${params.length})`
      );
    }
    if (hasStore === "yes") conditions.push("s.id IS NOT NULL");
    if (hasStore === "no") conditions.push("s.id IS NULL");

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [{ count }] = (await this.ds.query(
      `SELECT COUNT(*)::int AS count
         FROM users u
         LEFT JOIN stores s ON s.owner_id = u.id
         ${where}`,
      params
    )) as { count: number }[];

    const limit = params.length + 1;
    const offset = params.length + 2;

    const raws = (await this.ds.query(
      `SELECT u.id, u.name, u.phone, u.created_at,
              s.id AS store_id,
              s.name AS store_name,
              s.slug AS store_slug,
              s.category AS store_category,
              s.default_checkout_mode AS store_checkout_mode,
              s.created_at AS store_created_at,
              COALESCE(p.count, 0)::int AS product_count
         FROM users u
         LEFT JOIN stores s ON s.owner_id = u.id
         LEFT JOIN (
           SELECT store_id, COUNT(*) AS count FROM products GROUP BY store_id
         ) p ON p.store_id = s.id
         ${where}
        ORDER BY ${USER_SORT[sort]}
        LIMIT $${limit} OFFSET $${offset}`,
      [...params, pageSize, (page - 1) * pageSize]
    )) as UserRaw[];

    return {
      items: await this.hydrateUsers(raws),
      total: num(count),
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(num(count) / pageSize)),
    };
  }

  async findUserById(id: string): Promise<AdminUserRow | null> {
    const raws = (await this.ds.query(
      `SELECT u.id, u.name, u.phone, u.created_at,
              s.id AS store_id,
              s.name AS store_name,
              s.slug AS store_slug,
              s.category AS store_category,
              s.default_checkout_mode AS store_checkout_mode,
              s.created_at AS store_created_at,
              COALESCE(p.count, 0)::int AS product_count
         FROM users u
         LEFT JOIN stores s ON s.owner_id = u.id
         LEFT JOIN (
           SELECT store_id, COUNT(*) AS count FROM products GROUP BY store_id
         ) p ON p.store_id = s.id
        WHERE u.id = $1`,
      [id]
    )) as UserRaw[];

    if (!raws.length) return null;
    const [row] = await this.hydrateUsers(raws);
    return row;
  }

  async deleteUser(id: string): Promise<void> {
    await this.ds.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async listOrders(
    query: AdminOrderListQuery
  ): Promise<Paginated<AdminOrderRow>> {
    const { search, status, channel, sort, page, pageSize } = query;
    const empty: Paginated<AdminOrderRow> = {
      items: [],
      total: 0,
      page,
      pageSize,
      pageCount: 1,
    };

    return whenOrdersExist(async () => {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (search) {
        params.push(`%${search}%`);
        conditions.push(
          `(o.reference ILIKE $${params.length} OR o.buyer_name ILIKE $${params.length} OR o.buyer_phone ILIKE $${params.length} OR s.name ILIKE $${params.length})`
        );
      }
      if (status) {
        params.push(status);
        conditions.push(`o.status = $${params.length}`);
      }
      if (channel) {
        params.push(channel);
        conditions.push(`o.channel = $${params.length}`);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const [{ count }] = (await this.ds.query(
        `SELECT COUNT(*)::int AS count
           FROM orders o
           LEFT JOIN stores s ON s.id = o.store_id
           ${where}`,
        params
      )) as { count: number }[];

      const limit = params.length + 1;
      const offset = params.length + 2;

      const raws = (await this.ds.query(
        `SELECT o.id, o.reference, o.buyer_name, o.buyer_phone, o.items,
                o.total, o.channel, o.status, o.note, o.created_at,
                s.id AS store_id, s.name AS store_name, s.slug AS store_slug,
                u.name AS owner_name
           FROM orders o
           LEFT JOIN stores s ON s.id = o.store_id
           LEFT JOIN users u ON u.id = s.owner_id
           ${where}
          ORDER BY ${ORDER_SORT[sort]}
          LIMIT $${limit} OFFSET $${offset}`,
        [...params, pageSize, (page - 1) * pageSize]
      )) as OrderRaw[];

      return {
        items: raws.map(toOrderRow),
        total: num(count),
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(num(count) / pageSize)),
      };
    }, empty);
  }

  async findOrderById(id: string): Promise<AdminOrderRow | null> {
    return whenOrdersExist(async () => {
      const raws = (await this.ds.query(
        `SELECT o.id, o.reference, o.buyer_name, o.buyer_phone, o.items,
                o.total, o.channel, o.status, o.note, o.created_at,
                s.id AS store_id, s.name AS store_name, s.slug AS store_slug,
                u.name AS owner_name
           FROM orders o
           LEFT JOIN stores s ON s.id = o.store_id
           LEFT JOIN users u ON u.id = s.owner_id
          WHERE o.id = $1`,
        [id]
      )) as OrderRaw[];
      return raws.length ? toOrderRow(raws[0]) : null;
    }, null);
  }

  async updateOrderStatus(
    id: string,
    status: AdminOrderRow["status"]
  ): Promise<AdminOrderRow | null> {
    return whenOrdersExist(async () => {
      const result = (await this.ds.query(
        `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING id`,
        [id, status]
      )) as unknown[];
      const rows = Array.isArray(result[0]) ? (result[0] as unknown[]) : result;
      if (!rows.length) return null;
      return this.findOrderById(id);
    }, null);
  }

  async deleteOrder(id: string): Promise<void> {
    await whenOrdersExist(
      () => this.ds.query(`DELETE FROM orders WHERE id = $1`, [id]),
      undefined
    );
  }

  async analytics(rangeDays: number): Promise<AdminAnalytics> {
    const [totals] = (await this.ds.query(
      `SELECT (SELECT COUNT(*) FROM users)::int AS users,
              (SELECT COUNT(*) FROM stores)::int AS stores,
              (SELECT COUNT(*) FROM products)::int AS products,
              (SELECT COUNT(*) FROM products WHERE available)::int AS visible_products`
    )) as {
      users: number;
      stores: number;
      products: number;
      visible_products: number;
    }[];

    const [orderTotals] = await whenOrdersExist(
      () =>
        this.ds.query(
          `SELECT COUNT(*)::int AS orders,
                  COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0) AS revenue
             FROM orders`
        ) as Promise<{ orders: number; revenue: string }[]>,
      [{ orders: 0, revenue: "0" }]
    );

    const [trend] = (await this.ds.query(
      `SELECT
         COUNT(*) FILTER (WHERE table_name = 'users' AND created_at >= now() - ($1::int || ' days')::interval)::int AS users_current,
         COUNT(*) FILTER (WHERE table_name = 'users' AND created_at >= now() - (($1::int * 2) || ' days')::interval AND created_at < now() - ($1::int || ' days')::interval)::int AS users_previous,
         COUNT(*) FILTER (WHERE table_name = 'stores' AND created_at >= now() - ($1::int || ' days')::interval)::int AS stores_current,
         COUNT(*) FILTER (WHERE table_name = 'stores' AND created_at >= now() - (($1::int * 2) || ' days')::interval AND created_at < now() - ($1::int || ' days')::interval)::int AS stores_previous,
         COUNT(*) FILTER (WHERE table_name = 'products' AND created_at >= now() - ($1::int || ' days')::interval)::int AS products_current,
         COUNT(*) FILTER (WHERE table_name = 'products' AND created_at >= now() - (($1::int * 2) || ' days')::interval AND created_at < now() - ($1::int || ' days')::interval)::int AS products_previous
       FROM (
         SELECT 'users' AS table_name, created_at FROM users
         UNION ALL SELECT 'stores', created_at FROM stores
         UNION ALL SELECT 'products', created_at FROM products
       ) rows`,
      [rangeDays]
    )) as Record<string, number>[];

    const [orderTrend] = await whenOrdersExist(
      () =>
        this.ds.query(
          `SELECT
             COUNT(*) FILTER (WHERE created_at >= now() - ($1::int || ' days')::interval)::int AS current,
             COUNT(*) FILTER (WHERE created_at >= now() - (($1::int * 2) || ' days')::interval AND created_at < now() - ($1::int || ' days')::interval)::int AS previous
           FROM orders`,
          [rangeDays]
        ) as Promise<{ current: number; previous: number }[]>,
      [{ current: 0, previous: 0 }]
    );

    const signupsByDay = (await this.ds.query(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
              COUNT(DISTINCT u.id)::int AS users,
              COUNT(DISTINCT s.id)::int AS stores
         FROM generate_series(
                (now()::date - ($1::int - 1)),
                now()::date,
                '1 day'::interval
              ) AS d(day)
         LEFT JOIN users u ON u.created_at >= d.day AND u.created_at < d.day + INTERVAL '1 day'
         LEFT JOIN stores s ON s.created_at >= d.day AND s.created_at < d.day + INTERVAL '1 day'
        GROUP BY d.day
        ORDER BY d.day`,
      [rangeDays]
    )) as { date: string; users: number; stores: number }[];

    const ordersByDay = await whenOrdersExist(
      () =>
        this.ds.query(
          `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
                  COUNT(o.id)::int AS orders,
                  COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'cancelled'), 0) AS revenue
             FROM generate_series(
                    (now()::date - ($1::int - 1)),
                    now()::date,
                    '1 day'::interval
                  ) AS d(day)
             LEFT JOIN orders o ON o.created_at >= d.day AND o.created_at < d.day + INTERVAL '1 day'
            GROUP BY d.day
            ORDER BY d.day`,
          [rangeDays]
        ) as Promise<{ date: string; orders: number; revenue: string }[]>,
      signupsByDay.map((row) => ({ date: row.date, orders: 0, revenue: "0" }))
    );

    const topCategories = (await this.ds.query(
      `SELECT COALESCE(NULLIF(TRIM(category), ''), 'Uncategorised') AS category,
              COUNT(*)::int AS stores
         FROM stores
        GROUP BY 1
        ORDER BY stores DESC, category ASC
        LIMIT 6`
    )) as { category: string; stores: number }[];

    const [checkoutSplit] = (await this.ds.query(
      `SELECT COUNT(*) FILTER (WHERE checkout_mode = 'whatsapp')::int AS whatsapp,
              COUNT(*) FILTER (WHERE checkout_mode = 'platform')::int AS platform
         FROM products`
    )) as { whatsapp: number; platform: number }[];

    const topStoreRows = (await this.ds.query(
      `SELECT s.id, s.name, s.slug, u.name AS owner_name,
              COALESCE(p.count, 0)::int AS products
         FROM stores s
         LEFT JOIN users u ON u.id = s.owner_id
         LEFT JOIN (
           SELECT store_id, COUNT(*) AS count FROM products GROUP BY store_id
         ) p ON p.store_id = s.id
        ORDER BY products DESC, s.created_at DESC
        LIMIT 8`
    )) as {
      id: string;
      name: string;
      slug: string;
      owner_name: string | null;
      products: number;
    }[];

    const storeTotals = await this.orderTotalsByStore(
      topStoreRows.map((row) => row.id)
    );

    return {
      rangeDays,
      totals: {
        users: num(totals?.users),
        stores: num(totals?.stores),
        products: num(totals?.products),
        visibleProducts: num(totals?.visible_products),
        orders: num(orderTotals?.orders),
        revenue: num(orderTotals?.revenue),
      },
      trend: {
        users: {
          current: num(trend?.users_current),
          previous: num(trend?.users_previous),
        },
        stores: {
          current: num(trend?.stores_current),
          previous: num(trend?.stores_previous),
        },
        products: {
          current: num(trend?.products_current),
          previous: num(trend?.products_previous),
        },
        orders: {
          current: num(orderTrend?.current),
          previous: num(orderTrend?.previous),
        },
      },
      signupsByDay: signupsByDay.map((row) => ({
        date: row.date,
        users: num(row.users),
        stores: num(row.stores),
      })),
      ordersByDay: ordersByDay.map((row) => ({
        date: row.date,
        orders: num(row.orders),
        revenue: num(row.revenue),
      })),
      topCategories,
      checkoutSplit: {
        whatsapp: num(checkoutSplit?.whatsapp),
        platform: num(checkoutSplit?.platform),
      },
      topStores: topStoreRows.map((row) => {
        const totals = storeTotals.get(row.id) ?? { count: 0, revenue: 0 };
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          ownerName: row.owner_name ?? "",
          products: num(row.products),
          orders: totals.count,
          revenue: totals.revenue,
        };
      }),
    };
  }
}
