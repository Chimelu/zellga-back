import { z } from "zod";

export const recordEventValidator = z.object({
  slug: z.string().trim().min(1).max(60),
  type: z.enum(["store_view", "item_click", "share"]),
  productId: z.string().uuid().optional(),
  visitorId: z.string().trim().min(8).max(64).optional(),
});

export const analyticsQueryValidator = z.object({
  // Matches the 7 / 30 / 90 day toggles on the dashboard.
  days: z.coerce.number().int().min(1).max(365).default(7),
});
