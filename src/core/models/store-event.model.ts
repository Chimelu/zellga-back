/**
 * Anonymous storefront activity. Recorded per event rather than as running
 * counters so any date range can be reported after the fact — a counter can
 * only ever answer "how many in total".
 */
export type StoreEventType = "store_view" | "item_click" | "share";

export const STORE_EVENT_TYPES: StoreEventType[] = [
  "store_view",
  "item_click",
  "share",
];

export type StoreEventProps = {
  id: string;
  storeId: string;
  /** Set for `item_click`; null for store-wide events. */
  productId: string | null;
  type: StoreEventType;
  /**
   * Opaque per-browser id. Not an account and not personal data — it exists
   * only so one person refreshing a page is not counted as many viewers.
   */
  visitorId: string | null;
  createdAt: Date;
};

export class StoreEvent {
  readonly id: string;
  readonly storeId: string;
  readonly productId: string | null;
  readonly type: StoreEventType;
  readonly visitorId: string | null;
  readonly createdAt: Date;

  constructor(props: StoreEventProps) {
    this.id = props.id;
    this.storeId = props.storeId;
    this.productId = props.productId;
    this.type = props.type;
    this.visitorId = props.visitorId;
    this.createdAt = props.createdAt;
  }
}

/**
 * How long the same visitor's repeat view of a store counts as the same visit.
 * Without this, a refresh or a React re-mount inflates the view count.
 */
export const VIEW_DEDUPE_MINUTES = 30;
