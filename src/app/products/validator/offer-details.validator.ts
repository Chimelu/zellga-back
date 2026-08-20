import { z } from "zod";

/** 24-hour `HH:MM`, the shape every time input on the seller side produces. */
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 14:30");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-08-30");

const availabilitySchema = z
  .array(
    z
      .object({
        day: z.number().int().min(0).max(6),
        start: timeSchema,
        end: timeSchema,
      })
      .refine((w) => w.end > w.start, {
        message: "The end time must be after the start time",
        path: ["end"],
      })
  )
  .max(21)
  .default([]);

export const physicalDetailsSchema = z.object({}).strict().default({});

export const digitalDetailsSchema = z.object({
  delivery: z
    .enum(["automatic", "download", "email", "account"])
    .default("automatic"),
  fileUrl: z.string().url().nullable().default(null),
  fileName: z.string().max(255).nullable().default(null),
  fileSizeBytes: z.number().int().nonnegative().nullable().default(null),
  videoUrl: z.string().url().nullable().default(null),
  /** Only a course populates this; everything else ships a single asset. */
  modules: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(160),
        lessons: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(160),
              videoUrl: z.string().url().nullable().default(null),
              resourceUrl: z.string().url().nullable().default(null),
            })
          )
          .max(100)
          .default([]),
      })
    )
    .max(50)
    .default([]),
});

export const eventDetailsSchema = z
  .object({
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema.nullable().default(null),
    locationType: z.enum(["physical", "online"]),
    venue: z.string().trim().max(160).nullable().default(null),
    address: z.string().trim().max(255).nullable().default(null),
    city: z.string().trim().max(80).nullable().default(null),
    meetingUrl: z.string().url().nullable().default(null),
    capacity: z.number().int().positive().max(1_000_000).nullable().default(null),
    ticketTiers: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Name this ticket").max(80),
          price: z.number().nonnegative().max(99_999_999),
          /** null = unlimited. */
          quantity: z.number().int().positive().max(1_000_000).nullable().default(null),
          salesStart: dateSchema.nullable().default(null),
          salesEnd: dateSchema.nullable().default(null),
          benefits: z.array(z.string().trim().max(160)).max(20).default([]),
        })
      )
      .min(1, "Add at least one ticket type")
      .max(20),
    attendeeFields: z
      .array(z.enum(["name", "email", "phone"]))
      .max(3)
      .default(["name", "email"]),
  })
  // A venue nobody can find, or an online event with no link, is not sellable.
  .refine(
    (e) => e.locationType !== "physical" || Boolean(e.venue || e.address),
    { message: "Add the venue or address", path: ["venue"] }
  )
  .refine((e) => e.locationType !== "online" || Boolean(e.meetingUrl), {
    message: "Add the link attendees will join on",
    path: ["meetingUrl"],
  });

export const coachingDetailsSchema = z.object({
  format: z.enum(["one_on_one", "group", "program"]),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .nullable()
    .default(null),
  meetingMode: z.enum(["video", "phone", "in_person", "whatsapp", "other"]),
  availability: availabilitySchema,
  bufferMinutes: z.number().int().min(0).max(240).default(0),
});

export const membershipDetailsSchema = z
  .object({
    billingFrequency: z.enum(["monthly", "yearly", "one_time"]),
    benefits: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
    access: z
      .array(
        z.enum([
          "community",
          "content",
          "events",
          "resources",
          "direct",
          "other",
        ])
      )
      .max(6)
      .default([]),
    durationType: z.enum(["ongoing", "fixed"]).default("ongoing"),
    durationDays: z.number().int().positive().max(3650).nullable().default(null),
  })
  .refine((m) => m.durationType !== "fixed" || m.durationDays !== null, {
    message: "Say how long the membership lasts",
    path: ["durationDays"],
  });

export const serviceDetailsSchema = z.object({
  pricingType: z.enum(["fixed", "from", "quote"]),
  deliveryMode: z.enum([
    "in_person",
    "online",
    "customer_location",
    "seller_location",
    "remote",
    "other",
  ]),
  serviceAreas: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  requiresBooking: z.boolean().default(false),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .nullable()
    .default(null),
  availability: availabilitySchema,
});

/** Picks the schema that matches the offer type being saved. */
export function detailsSchemaFor(offerType: string) {
  switch (offerType) {
    case "digital":
      return digitalDetailsSchema;
    case "event":
      return eventDetailsSchema;
    case "coaching":
      return coachingDetailsSchema;
    case "membership":
      return membershipDetailsSchema;
    case "service":
      return serviceDetailsSchema;
    default:
      return physicalDetailsSchema;
  }
}
