import { z } from "zod";

const search = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value ? value : undefined));

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);

export const userListQueryValidator = z.object({
  search,
  hasStore: z.enum(["yes", "no"]).optional(),
  sort: z.enum(["newest", "oldest", "name", "products"]).default("newest"),
  page,
  pageSize,
});

export const orderListQueryValidator = z.object({
  search,
  status: z.enum(["pending", "paid", "fulfilled", "cancelled"]).optional(),
  channel: z.enum(["whatsapp", "platform"]).optional(),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
  page,
  pageSize,
});

export const analyticsQueryValidator = z.object({
  days: z.coerce.number().int().min(7).max(180).default(30),
});

export const updateOrderStatusValidator = z.object({
  status: z.enum(["pending", "paid", "fulfilled", "cancelled"]),
});
