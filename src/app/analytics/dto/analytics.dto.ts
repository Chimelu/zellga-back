import type { StoreEventType } from "../../../core/models/store-event.model";

export type RecordEventDto = {
  /** Storefront the activity happened on. */
  slug: string;
  type: StoreEventType;
  /** Required for `item_click`. */
  productId?: string;
  /** Opaque per-browser id, used only to collapse repeat views. */
  visitorId?: string;
};

export type AnalyticsQueryDto = {
  days: number;
};

export type AnalyticsPointDto = {
  date: string;
  views: number;
  clicks: number;
  orders: number;
};

export type VendorAnalyticsDto = {
  rangeDays: number;
  from: string;
  to: string;
  totals: {
    views: number;
    clicks: number;
    shares: number;
    whatsappOrders: number;
    onlineOrders: number;
    orders: number;
    revenue: number;
    /** Share of views that became an order, as a percentage. */
    conversion: number;
  };
  series: AnalyticsPointDto[];
  topProducts: { productId: string; name: string; clicks: number }[];
};
