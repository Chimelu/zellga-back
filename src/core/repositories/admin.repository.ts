import type { CheckoutMode } from "../models/store.model";
import type { OrderStatus, PaymentStatus } from "../models/order.model";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
  store: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    defaultCheckoutMode: CheckoutMode;
    createdAt: Date;
  } | null;
  productCount: number;
  orderCount: number;
  revenue: number;
};

export type AdminUserListQuery = {
  search?: string;
  hasStore?: "yes" | "no";
  sort: "newest" | "oldest" | "name" | "products";
  page: number;
  pageSize: number;
};

export type AdminOrderRow = {
  id: string;
  reference: string;
  buyerName: string;
  buyerPhone: string;
  items: { productId: string | null; name: string; price: number; quantity: number }[];
  itemCount: number;
  total: number;
  channel: "whatsapp" | "platform";
  status: OrderStatus;
  /** What the money did, tracked apart from the fulfilment `status`. */
  paymentStatus: PaymentStatus;
  note: string | null;
  createdAt: Date;
  store: { id: string; name: string; slug: string; ownerName: string } | null;
};

export type AdminOrderListQuery = {
  search?: string;
  status?: OrderStatus;
  channel?: "whatsapp" | "platform";
  sort: "newest" | "oldest" | "highest" | "lowest";
  page: number;
  pageSize: number;
};

export type AdminAnalytics = {
  rangeDays: number;
  totals: {
    users: number;
    stores: number;
    products: number;
    visibleProducts: number;
    orders: number;
    revenue: number;
  };
  trend: {
    users: { current: number; previous: number };
    stores: { current: number; previous: number };
    products: { current: number; previous: number };
    orders: { current: number; previous: number };
  };
  signupsByDay: { date: string; users: number; stores: number }[];
  ordersByDay: { date: string; orders: number; revenue: number }[];
  topCategories: { category: string; stores: number }[];
  /** Products by how they can be ordered; `both` is its own bucket so the
   *  three always add up to the catalogue. */
  checkoutSplit: { whatsapp: number; platform: number; both: number };
  topStores: {
    id: string;
    name: string;
    slug: string;
    ownerName: string;
    products: number;
    orders: number;
    revenue: number;
  }[];
};

export interface AdminRepository {
  listUsers(query: AdminUserListQuery): Promise<Paginated<AdminUserRow>>;
  findUserById(id: string): Promise<AdminUserRow | null>;
  deleteUser(id: string): Promise<void>;
  listOrders(query: AdminOrderListQuery): Promise<Paginated<AdminOrderRow>>;
  findOrderById(id: string): Promise<AdminOrderRow | null>;
  updateOrderStatus(
    id: string,
    status: AdminOrderRow["status"]
  ): Promise<AdminOrderRow | null>;
  deleteOrder(id: string): Promise<void>;
  analytics(rangeDays: number): Promise<AdminAnalytics>;
}
