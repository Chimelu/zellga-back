import { z } from "zod";
import { OFFER_TYPES } from "../../../core/models/offer.model";
import { detailsSchemaFor } from "./offer-details.validator";

/**
 * Events price through their ticket tiers and quote-only services have no
 * price at all, so 0 is allowed and the storefront reads `details` for what to
 * show. Everything else is still refused at 0 by `requiresPrice` below.
 */
const priceSchema = z.coerce.number().min(0).max(99_999_999);

const mediaItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  type: z.enum(["image", "video"]),
});

const offerTypeSchema = z.enum(
  OFFER_TYPES as [string, ...string[]]
);

/** Types whose headline price lives somewhere other than the price field. */
function pricedByDetails(offerType: string, details: unknown): boolean {
  if (offerType === "event") return true;
  return (
    offerType === "service" &&
    (details as { pricingType?: string } | null)?.pricingType === "quote"
  );
}

const baseFields = {
  name: z.string().trim().min(1, "Item name is required").max(160),
  description: z.string().max(5000).optional(),
  category: z.string().trim().max(60).optional(),
  checkoutMode: z.enum(["whatsapp", "platform"]).optional(),
  available: z.boolean().optional(),
  media: z.array(mediaItemSchema).max(5).optional(),
  offerType: offerTypeSchema.optional(),
  subtype: z.string().trim().max(40).optional(),
};

/**
 * `details` is validated against the schema for the offer type in the same
 * payload, which a plain object schema cannot express — hence the two-pass
 * parse in `superRefine`.
 */
function withDetails<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value, ctx) => {
    const input = value as {
      offerType?: string;
      details?: unknown;
      price?: number;
    };
    const offerType = input.offerType ?? "physical";

    const parsed = detailsSchemaFor(offerType).safeParse(input.details ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: ["details", ...issue.path],
        });
      }
      return;
    }

    (input as { details?: unknown }).details = parsed.data;

    if (
      input.price !== undefined &&
      input.price <= 0 &&
      !pricedByDetails(offerType, parsed.data)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Price must be greater than 0",
        path: ["price"],
      });
    }
  });
}

export const createProductValidator = withDetails(
  z.object({
    ...baseFields,
    price: priceSchema,
    details: z.unknown().optional(),
  })
);

export const updateProductValidator = withDetails(
  z.object({
    ...baseFields,
    name: baseFields.name.optional(),
    price: priceSchema.optional(),
    description: z.string().max(5000).nullable().optional(),
    category: z.string().trim().max(60).nullable().optional(),
    details: z.unknown().optional(),
  })
);

export const setVisibilityValidator = z.object({
  available: z.boolean(),
});
