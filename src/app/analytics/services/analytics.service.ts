import { randomUUID } from "crypto";
import { ForbiddenError, NotFoundError } from "../../../core/errors/app.error";
import {
  StoreEvent,
  VIEW_DEDUPE_MINUTES,
} from "../../../core/models/store-event.model";
import type { AnalyticsRepository } from "../../../core/repositories/analytics.repository";
import type { ProductRepository } from "../../../core/repositories/product.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type {
  RecordEventDto,
  VendorAnalyticsDto,
} from "../dto/analytics.dto";

const TOP_PRODUCTS_LIMIT = 5;

export class AnalyticsService {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly stores: StoreRepository,
    private readonly products: ProductRepository
  ) {}

  /**
   * Records anonymous storefront activity. Never throws for a bad event: a
   * failed beacon must not break the page a buyer is reading, so unknown
   * stores and stale product ids are simply not counted.
   */
  async recordEvent(input: RecordEventDto): Promise<{ recorded: boolean }> {
    const store = await this.stores.findBySlug(input.slug.trim());
    if (!store) return { recorded: false };

    let productId: string | null = null;
    if (input.type === "item_click") {
      if (!input.productId) return { recorded: false };
      const product = await this.products.findById(input.productId);
      // Guards against a click being attributed to someone else's store.
      if (!product || product.storeId !== store.id) return { recorded: false };
      productId = product.id;
    }

    const visitorId = input.visitorId?.trim() || null;

    // One person refreshing is one view, not many. Shares are always counted —
    // sharing twice is a real second share.
    if (visitorId && input.type !== "share") {
      const seen = await this.analytics.wasRecentlySeen(
        store.id,
        input.type,
        visitorId,
        productId,
        VIEW_DEDUPE_MINUTES
      );
      if (seen) return { recorded: false };
    }

    await this.analytics.record(
      new StoreEvent({
        id: randomUUID(),
        storeId: store.id,
        productId,
        type: input.type,
        visitorId,
        createdAt: new Date(),
      })
    );

    return { recorded: true };
  }

  /**
   * The window runs to the end of today so today's activity is included, and
   * covers exactly `days` whole day-buckets. Boundaries are UTC, which can
   * shift an event near midnight into the neighbouring day for WAT sellers.
   */
  private windowFor(days: number): { from: Date; to: Date } {
    const now = new Date();
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { from, to };
  }

  async getVendorAnalytics(
    userId: string,
    days: number
  ): Promise<VendorAnalyticsDto> {
    const store = await this.stores.findByOwnerId(userId);
    if (!store) {
      throw new ForbiddenError("Only a store owner can view analytics");
    }

    const { from, to } = this.windowFor(days);

    const [totals, series, topProducts] = await Promise.all([
      this.analytics.totals(store.id, from, to),
      this.analytics.series(store.id, from, to),
      this.analytics.topProducts(store.id, from, to, TOP_PRODUCTS_LIMIT),
    ]);

    // Guarded: a store with orders but no recorded views would divide by zero.
    const conversion =
      totals.views > 0
        ? Math.round((totals.orders / totals.views) * 1000) / 10
        : 0;

    return {
      rangeDays: days,
      from: from.toISOString(),
      to: to.toISOString(),
      totals: { ...totals, conversion },
      series,
      topProducts,
    };
  }

  /** Public storefront lookup used to resolve a slug before tracking. */
  async requireStore(slug: string) {
    const store = await this.stores.findBySlug(slug);
    if (!store) throw new NotFoundError("Store not found");
    return store;
  }
}
