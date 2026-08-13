import { z } from "zod";

export const createOrderValidator = z.object({
  buyerName: z.string().trim().min(2, "Your name is required").max(120),
  buyerPhone: z
    .string()
    .trim()
    .min(10, "Valid WhatsApp number required")
    .max(20),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Unknown item"),
        quantity: z.coerce.number().int().min(1).max(999),
      })
    )
    .min(1, "Add at least one item"),
  note: z.string().trim().max(500).optional(),
  ref: z.string().trim().max(20).optional(),
});
