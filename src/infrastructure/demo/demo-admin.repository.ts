import type { CheckoutMode } from "../../core/models/store.model";
import type { OrderStatus, PaymentStatus } from "../../core/models/order.model";
import type {
  AdminAnalytics,
  AdminOrderListQuery,
  AdminOrderRow,
  AdminRepository,
  AdminUserListQuery,
  AdminUserRow,
  Paginated,
} from "../../core/repositories/admin.repository";

/**
 * Generated console data for demo admins. Nothing here reads or writes the
 * database: the dataset is built once per process from a fixed seed, and
 * status changes or deletes only edit that in-memory copy, so a demo session
 * can click everything without consequence. A restart restores the dataset.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Mulberry32 — small, fast, and the same sequence on every boot. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VENDORS: { owner: string; store: string | null; category: string | null }[] = [
  { owner: "Adaeze Okafor", store: "Ada's Closet", category: "Fashion" },
  { owner: "Tunde Bakare", store: "Bakare Gadgets", category: "Electronics" },
  { owner: "Chiamaka Nwosu", store: "Glow by Chi", category: "Beauty" },
  { owner: "Emeka Eze", store: "Eze Kicks", category: "Fashion" },
  { owner: "Funmilayo Adeyemi", store: "Funmi's Kitchen", category: "Food" },
  { owner: "Ibrahim Musa", store: "Arewa Fabrics", category: "Fashion" },
  { owner: "Ngozi Obi", store: "Naturally Ngozi", category: "Beauty" },
  { owner: "Segun Alabi", store: "PhoneHub Ikeja", category: "Electronics" },
  { owner: "Kemi Oladipo", store: "Kemi Home Decor", category: "Home" },
  { owner: "Uche Nnamdi", store: "Uche Perfumes", category: "Beauty" },
  { owner: "Halima Bello", store: "Halima Hijabs", category: "Fashion" },
  { owner: "Olumide Johnson", store: "Lagos Laptops", category: "Electronics" },
  { owner: "Blessing Etim", store: "Calabar Spices", category: "Food" },
  { owner: "Chinedu Okeke", store: "Okeke Auto Parts", category: "Automotive" },
  { owner: "Yetunde Fashola", store: "Yetty Bakes", category: "Food" },
  { owner: "Musa Abdullahi", store: "Kano Leatherworks", category: "Fashion" },
  { owner: "Ifeoma Chukwu", store: "Ify Hair Studio", category: "Beauty" },
  { owner: "Babajide Ogun", store: "Jide Furniture", category: "Home" },
  { owner: "Amaka Ibe", store: "Amaka Kids Store", category: "Kids" },
  { owner: "Victor Udoh", store: "Udoh Fitness Gear", category: "Sports" },
  { owner: "Zainab Yusuf", store: "Zee Jewelry", category: "Fashion" },
  { owner: "Kelechi Amadi", store: "Kelz Thrift", category: "Fashion" },
  { owner: "Ronke Adebayo", store: "Ronke Organics", category: "Food" },
  { owner: "Daniel Ojo", store: "Ojo Books", category: null },
  { owner: "Patience Akpan", store: "Patty Skincare", category: "Beauty" },
  { owner: "Samuel Eniola", store: "Sammy Sneakers", category: "Fashion" },
  { owner: "Grace Okon", store: "Grace Gele Hub", category: "Fashion" },
  { owner: "Abubakar Sani", store: "Sani Solar", category: "Electronics" },
  { owner: "Tolu Ajayi", store: null, category: null },
  { owner: "Chioma Uzo", store: null, category: null },
  { owner: "Femi Lawal", store: null, category: null },
  { owner: "Esther Bassey", store: null, category: null },
  { owner: "Kunle Odukoya", store: null, category: null },
  { owner: "Nkechi Agu", store: null, category: null },
];

const BUYERS = [
  "Bola Ahmed", "Chika Obi", "Dayo Martins", "Efe Omoregie", "Fatima Lawan",
  "Gbenga Ade", "Hauwa Garba", "Ike Nwachukwu", "Jumoke Salami", "Kola Peters",
  "Lami Danjuma", "Mide Akin", "Nneka Uba", "Ola Coker", "Precious Edet",
  "Rotimi Shola", "Sade Ojo", "Tobi Akande", "Uju Mba", "Wale Adeleke",
];

const PRODUCTS: Record<string, { name: string; price: number }[]> = {
  Fashion: [
    { name: "Ankara wrap dress", price: 18500 },
    { name: "Aso-oke cap", price: 7500 },
    { name: "Leather slides", price: 12000 },
    { name: "Senator kaftan", price: 32000 },
  ],
  Electronics: [
    { name: "Wireless earbuds", price: 24000 },
    { name: "20,000mAh power bank", price: 19500 },
    { name: "Refurbished iPhone 12", price: 385000 },
    { name: "Laptop stand", price: 15000 },
  ],
  Beauty: [
    { name: "Shea butter body cream", price: 6500 },
    { name: "Black soap set", price: 4800 },
    { name: "Oud perfume oil", price: 22000 },
    { name: "Braiding hair (3 packs)", price: 9000 },
  ],
  Food: [
    { name: "Small chops tray", price: 25000 },
    { name: "Pepper soup spice", price: 3500 },
    { name: "Chin chin (1kg)", price: 5500 },
    { name: "Birthday cake", price: 45000 },
  ],
  Home: [
    { name: "Throw pillow set", price: 14000 },
    { name: "Scented candle", price: 8500 },
    { name: "Accent chair", price: 120000 },
  ],
  Automotive: [
    { name: "Brake pads", price: 28000 },
    { name: "Car seat covers", price: 35000 },
  ],
  Kids: [
    { name: "School bag", price: 11000 },
    { name: "Baby romper set", price: 9500 },
  ],
  Sports: [
    { name: "Dumbbell pair (10kg)", price: 38000 },
    { name: "Yoga mat", price: 12500 },
  ],
  Other: [
    { name: "Novel bundle", price: 15000 },
    { name: "Notebook set", price: 4000 },
  ],
};

type DemoStore = NonNullable<AdminUserRow["store"]> & {
  products: number;
  visibleProducts: number;
  checkoutSplit: Record<CheckoutMode, number>;
};

type DemoUser = Omit<AdminUserRow, "store" | "productCount" | "orderCount" | "revenue"> & {
  store: DemoStore | null;
};

type Dataset = {
  users: DemoUser[];
  orders: AdminOrderRow[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hexId(rand: () => number, prefix: string): string {
  const hex = Array.from({ length: 12 }, () =>
    Math.floor(rand() * 16).toString(16)
  ).join("");
  // Valid-looking UUID so the console's links and keys behave as with real rows.
  return `${prefix}-0000-4000-8000-${hex}`;
}

function buildDataset(): Dataset {
  const rand = seeded(20261013);
  const now = Date.now();
  const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)];

  const users: DemoUser[] = VENDORS.map((vendor, index) => {
    // Spread signups over ~6 months, a little busier in recent weeks.
    const joinedDaysAgo = Math.floor(Math.pow(rand(), 0.8) * 180);
    const createdAt = new Date(now - joinedDaysAgo * DAY - rand() * DAY);
    const phone = `+23480${String(30000000 + index * 7919 + Math.floor(rand() * 5000)).slice(0, 8)}`;

    let store: DemoStore | null = null;
    if (vendor.store) {
      const products = 3 + Math.floor(rand() * 28);
      const mode = pick<CheckoutMode>(["whatsapp", "whatsapp", "platform", "both"]);
      // Most items follow the store default; a few are set differently.
      const odd = Math.min(products, Math.floor(rand() * 3));
      const checkoutSplit: Record<CheckoutMode, number> = { whatsapp: 0, platform: 0, both: 0 };
      checkoutSplit[mode] += products - odd;
      checkoutSplit[mode === "both" ? "whatsapp" : "both"] += odd;
      store = {
        id: hexId(rand, "5d0e0000"),
        name: vendor.store,
        slug: slugify(vendor.store),
        category: vendor.category,
        defaultCheckoutMode: mode,
        createdAt: new Date(Math.min(now, createdAt.getTime() + rand() * 2 * DAY)),
        products,
        visibleProducts: products - Math.floor(rand() * 3),
        checkoutSplit,
      };
    }

    return {
      id: hexId(rand, "d3a00000"),
      name: vendor.owner,
      phone,
      createdAt,
      store,
    };
  });

  const sellers = users.filter((user) => user.store);
  const counters = new Map<string, number>();
  const orders: AdminOrderRow[] = [];

  for (let i = 0; i < 220; i += 1) {
    // Busier stores get more orders; recent days get more traffic.
    const seller = sellers[Math.floor(Math.pow(rand(), 1.4) * sellers.length)];
    const store = seller.store!;
    const sinceStore = Math.max(1, (now - store.createdAt.getTime()) / DAY);
    const daysAgo = Math.pow(rand(), 1.1) * Math.min(sinceStore, 90);
    const createdAt = new Date(now - daysAgo * DAY);

    const catalogue = PRODUCTS[store.category ?? "Other"] ?? PRODUCTS.Other;
    const lineCount = 1 + Math.floor(rand() * 2.2);
    const items = Array.from({ length: lineCount }, () => {
      const product = pick(catalogue);
      return {
        productId: null,
        name: product.name,
        price: product.price,
        quantity: 1 + Math.floor(rand() * 2.5),
      };
    });

    const total = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const channel = store.defaultCheckoutMode === "both"
      ? pick<"whatsapp" | "platform">(["whatsapp", "platform"])
      : store.defaultCheckoutMode;

    // Older orders have mostly run their course; fresh ones are still open.
    const status: OrderStatus =
      daysAgo > 10
        ? pick<OrderStatus>(["completed", "completed", "completed", "completed", "cancelled"])
        : daysAgo > 3
          ? pick<OrderStatus>(["completed", "processing", "confirmed", "contacted", "cancelled"])
          : pick<OrderStatus>(["new", "new", "contacted", "confirmed", "processing"]);

    const paymentStatus: PaymentStatus =
      status === "cancelled"
        ? pick<PaymentStatus>(["unpaid", "refunded", "failed"])
        : status === "new" || status === "contacted"
          ? channel === "platform" ? "pending" : "unpaid"
          : "paid";

    const number = (counters.get(store.id) ?? 1000) + 1;
    counters.set(store.id, number);
    const buyer = pick(BUYERS);

    orders.push({
      id: hexId(rand, "0d3e0000"),
      reference: `${store.slug.slice(0, 3).toUpperCase()}-${number}`,
      buyerName: buyer,
      buyerPhone: `+23481${String(Math.floor(10000000 + rand() * 89999999))}`,
      items,
      itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
      total,
      channel,
      status,
      paymentStatus,
      note: rand() < 0.2 ? pick(["Please deliver after 5pm", "Gift wrap it", "Call before delivery"]) : null,
      createdAt,
      store: { id: store.id, name: store.name, slug: store.slug, ownerName: seller.name },
    });
  }

  return { users, orders };
}

let dataset: Dataset | null = null;
function data(): Dataset {
  dataset ??= buildDataset();
  return dataset;
}

function paginate<T>(rows: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(rows.length / pageSize)),
  };
}

function matches(search: string | undefined, ...fields: (string | null | undefined)[]) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

/** Revenue mirrors the real repository: every order except cancelled ones. */
const countsTowardRevenue = (order: AdminOrderRow) => order.status !== "cancelled";

function toUserRow(user: DemoUser, orders: AdminOrderRow[]): AdminUserRow {
  const own = user.store ? orders.filter((o) => o.store?.id === user.store!.id) : [];
  const store = user.store
    ? {
        id: user.store.id,
        name: user.store.name,
        slug: user.store.slug,
        category: user.store.category,
        defaultCheckoutMode: user.store.defaultCheckoutMode,
        createdAt: user.store.createdAt,
      }
    : null;
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    createdAt: user.createdAt,
    store,
    productCount: user.store?.products ?? 0,
    orderCount: own.length,
    revenue: own.filter(countsTowardRevenue).reduce((sum, o) => sum + o.total, 0),
  };
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class DemoAdminRepository implements AdminRepository {
  async listUsers(query: AdminUserListQuery): Promise<Paginated<AdminUserRow>> {
    const { users, orders } = data();
    const rows = users
      .filter((user) => matches(query.search, user.name, user.phone, user.store?.name))
      .filter((user) =>
        query.hasStore === "yes" ? user.store : query.hasStore === "no" ? !user.store : true
      )
      .map((user) => toUserRow(user, orders));

    const by: Record<AdminUserListQuery["sort"], (a: AdminUserRow, b: AdminUserRow) => number> = {
      newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      name: (a, b) => a.name.localeCompare(b.name),
      products: (a, b) => b.productCount - a.productCount || b.createdAt.getTime() - a.createdAt.getTime(),
    };
    rows.sort(by[query.sort]);
    return paginate(rows, query.page, query.pageSize);
  }

  async findUserById(id: string): Promise<AdminUserRow | null> {
    const { users, orders } = data();
    const user = users.find((u) => u.id === id);
    return user ? toUserRow(user, orders) : null;
  }

  async deleteUser(id: string): Promise<void> {
    const set = data();
    const user = set.users.find((u) => u.id === id);
    set.users = set.users.filter((u) => u.id !== id);
    if (user?.store) {
      set.orders = set.orders.filter((o) => o.store?.id !== user.store!.id);
    }
  }

  async listOrders(query: AdminOrderListQuery): Promise<Paginated<AdminOrderRow>> {
    const rows = data()
      .orders.filter((o) =>
        matches(query.search, o.reference, o.buyerName, o.buyerPhone, o.store?.name)
      )
      .filter((o) => !query.status || o.status === query.status)
      .filter((o) => !query.channel || o.channel === query.channel);

    const by: Record<AdminOrderListQuery["sort"], (a: AdminOrderRow, b: AdminOrderRow) => number> = {
      newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      highest: (a, b) => b.total - a.total,
      lowest: (a, b) => a.total - b.total,
    };
    rows.sort(by[query.sort]);
    return paginate(rows, query.page, query.pageSize);
  }

  async findOrderById(id: string): Promise<AdminOrderRow | null> {
    return data().orders.find((o) => o.id === id) ?? null;
  }

  async updateOrderStatus(
    id: string,
    status: AdminOrderRow["status"]
  ): Promise<AdminOrderRow | null> {
    const order = data().orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    return order;
  }

  async deleteOrder(id: string): Promise<void> {
    const set = data();
    set.orders = set.orders.filter((o) => o.id !== id);
  }

  async analytics(rangeDays: number): Promise<AdminAnalytics> {
    const { users, orders } = data();
    const stores = users.flatMap((u) => (u.store ? [u.store] : []));
    const now = Date.now();
    const currentFrom = now - rangeDays * DAY;
    const previousFrom = now - 2 * rangeDays * DAY;

    const window = (dates: Date[]) => ({
      current: dates.filter((d) => d.getTime() >= currentFrom).length,
      previous: dates.filter((d) => d.getTime() >= previousFrom && d.getTime() < currentFrom).length,
    });

    // Products have no dates of their own here; they arrive with their store.
    const productDates = stores.flatMap((s) =>
      Array.from({ length: s.products }, () => s.createdAt)
    );

    const days = Array.from({ length: rangeDays }, (_, i) =>
      dayKey(new Date(now - (rangeDays - 1 - i) * DAY))
    );
    const countBy = <T,>(rows: T[], date: (row: T) => Date) => {
      const map = new Map<string, T[]>();
      for (const row of rows) {
        const key = dayKey(date(row));
        map.set(key, [...(map.get(key) ?? []), row]);
      }
      return map;
    };
    const usersByDay = countBy(users, (u) => u.createdAt);
    const storesByDay = countBy(stores, (s) => s.createdAt);
    const ordersByDayMap = countBy(orders, (o) => o.createdAt);

    const categories = new Map<string, number>();
    for (const store of stores) {
      const key = store.category ?? "Uncategorised";
      categories.set(key, (categories.get(key) ?? 0) + 1);
    }

    const sellers = users.filter((u) => u.store).map((u) => toUserRow(u, orders));

    return {
      rangeDays,
      totals: {
        users: users.length,
        stores: stores.length,
        products: stores.reduce((sum, s) => sum + s.products, 0),
        visibleProducts: stores.reduce((sum, s) => sum + s.visibleProducts, 0),
        orders: orders.length,
        revenue: orders.filter(countsTowardRevenue).reduce((sum, o) => sum + o.total, 0),
      },
      trend: {
        users: window(users.map((u) => u.createdAt)),
        stores: window(stores.map((s) => s.createdAt)),
        products: window(productDates),
        orders: window(orders.map((o) => o.createdAt)),
      },
      signupsByDay: days.map((date) => ({
        date,
        users: usersByDay.get(date)?.length ?? 0,
        stores: storesByDay.get(date)?.length ?? 0,
      })),
      ordersByDay: days.map((date) => {
        const dayOrders = ordersByDayMap.get(date) ?? [];
        return {
          date,
          orders: dayOrders.length,
          revenue: dayOrders.filter(countsTowardRevenue).reduce((sum, o) => sum + o.total, 0),
        };
      }),
      topCategories: [...categories.entries()]
        .map(([category, count]) => ({ category, stores: count }))
        .sort((a, b) => b.stores - a.stores || a.category.localeCompare(b.category))
        .slice(0, 6),
      checkoutSplit: stores.reduce(
        (split, s) => ({
          whatsapp: split.whatsapp + s.checkoutSplit.whatsapp,
          platform: split.platform + s.checkoutSplit.platform,
          both: split.both + s.checkoutSplit.both,
        }),
        { whatsapp: 0, platform: 0, both: 0 }
      ),
      topStores: sellers
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, 8)
        .map((row) => ({
          id: row.store!.id,
          name: row.store!.name,
          slug: row.store!.slug,
          ownerName: row.name,
          products: row.productCount,
          orders: row.orderCount,
          revenue: row.revenue,
        })),
    };
  }
}
