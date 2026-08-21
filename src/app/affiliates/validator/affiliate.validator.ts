import { z } from "zod";
import type { InviteAffiliateDto } from "../dto/affiliate.dto";

const inviteEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(160);

const MAX_INVITES_PER_BATCH = 20;

/**
 * Accepts a single `email` or a list of `emails`, and normalises both to a
 * de-duplicated list so the service only ever handles one shape.
 */
export const inviteAffiliateValidator = z
  .object({
    email: inviteEmail.optional(),
    emails: z.array(inviteEmail).max(MAX_INVITES_PER_BATCH).optional(),
  })
  .transform((input) => ({
    emails: Array.from(
      new Set([...(input.emails ?? []), ...(input.email ? [input.email] : [])])
    ),
  }))
  .refine((input) => input.emails.length > 0, {
    message: "Enter at least one email address",
    path: ["emails"],
  })
  .refine((input) => input.emails.length <= MAX_INVITES_PER_BATCH, {
    message: `You can invite up to ${MAX_INVITES_PER_BATCH} people at a time`,
    path: ["emails"],
  }) satisfies z.ZodType<InviteAffiliateDto, unknown>;

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
