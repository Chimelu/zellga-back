import { z } from "zod";

const priceSchema = z.coerce
  .number()
  .positive("Price must be greater than 0")
  .max(99_999_999);

const mediaItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  type: z.enum(["image", "video"]),
});

export const createProductValidator = z.object({
  name: z.string().trim().min(1, "Item name is required").max(160),
  price: priceSchema,
  description: z.string().max(5000).optional(),
  category: z.string().trim().max(60).optional(),
  checkoutMode: z.enum(["whatsapp", "platform"]).optional(),
  available: z.boolean().optional(),
  media: z.array(mediaItemSchema).max(2).optional(),
});

export const updateProductValidator = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  price: priceSchema.optional(),
  description: z.string().max(5000).nullable().optional(),
  category: z.string().trim().max(60).nullable().optional(),
  checkoutMode: z.enum(["whatsapp", "platform"]).optional(),
  media: z.array(mediaItemSchema).max(2).optional(),
});

export const setVisibilityValidator = z.object({
  available: z.boolean(),
});
