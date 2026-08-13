import { z } from "zod";
import type { InviteAffiliateDto } from "../dto/affiliate.dto";

export const inviteAffiliateValidator = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(160),
}) satisfies z.ZodType<InviteAffiliateDto>;

export const affiliateStatusValidator = z.object({
  status: z.enum(["active", "suspended"]),
});

export const salesQueryValidator = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const affiliateProductsQueryValidator = z.object({
  storeId: z.string().uuid().optional(),
});
