import type { StoreEvent, StoreEventType } from "../models/store-event.model";

/** One day's activity, used to draw the chart. */
export type AnalyticsPoint = {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  views: number;
  clicks: number;
  orders: number;
};

export type AnalyticsTotals = {
  views: number;
  clicks: number;
  shares: number;
  whatsappOrders: number;
  onlineOrders: number;
  orders: number;
  /** Money actually collected in the window, card and manual alike. */
  revenue: number;
};

export type TopProduct = {
  productId: string;
  name: string;
  clicks: number;
};

export interface AnalyticsRepository {
  record(event: StoreEvent): Promise<void>;

  /**
   * True when this visitor already registered the same event for this store
   * inside the dedupe window, so a refresh does not count twice.
   */
  wasRecentlySeen(
    storeId: string,
    type: StoreEventType,
    visitorId: string,
    productId: string | null,
    withinMinutes: number
  ): Promise<boolean>;

  totals(storeId: string, from: Date, to: Date): Promise<AnalyticsTotals>;

  /** One row per day across the whole window, including days with no activity. */
  series(storeId: string, from: Date, to: Date): Promise<AnalyticsPoint[]>;

  topProducts(
    storeId: string,
    from: Date,
    to: Date,
    limit: number
  ): Promise<TopProduct[]>;
}
