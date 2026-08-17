import { z } from "zod";

const orderStatus = z.enum([
  "new",
  "contacted",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
]);

export const orderListQueryValidator = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  status: orderStatus.optional(),
  paymentStatus: z
    .enum(["unpaid", "pending", "paid", "failed", "refunded"])
    .optional(),
  channel: z.enum(["whatsapp", "platform"]).optional(),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateOrderStatusValidator = z.object({
  status: orderStatus,
});

/**
 * Sellers can only record settlement or reverse it. `pending` and `failed`
 * belong to the gateway, which owns them through the webhook.
 */
export const updatePaymentStatusValidator = z.object({
  paymentStatus: z.enum(["paid", "refunded", "unpaid"]),
  /** Defaults to the order total when the seller confirms a payment. */
  amountPaid: z.coerce.number().min(0).optional(),
});
