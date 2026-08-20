/**
 * What a seller is selling. A store is never locked to one of these — the type
 * is chosen per offer, so the same store can hold a cake, a course and a
 * coaching session side by side.
 */
export type OfferType =
  | "physical"
  | "digital"
  | "event"
  | "coaching"
  | "membership"
  | "service";

export const OFFER_TYPES: OfferType[] = [
  "physical",
  "digital",
  "event",
  "coaching",
  "membership",
  "service",
];

/** Days are stored as numbers so a week can be sorted without a lookup. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** One "Monday 9:00–17:00" row on a coaching or service availability grid. */
export type AvailabilityWindow = {
  day: Weekday;
  /** 24-hour `HH:MM`. */
  start: string;
  end: string;
};

export type DigitalDelivery =
  | "automatic"
  | "download"
  | "email"
  | "account";

export type DigitalLesson = {
  title: string;
  videoUrl: string | null;
  resourceUrl: string | null;
};

export type DigitalModule = {
  title: string;
  lessons: DigitalLesson[];
};

/**
 * A course is not one file, so it carries modules; everything else carries a
 * single asset. Both shapes live here rather than in separate columns because
 * only one is ever populated.
 */
export type DigitalDetails = {
  delivery: DigitalDelivery;
  fileUrl: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  videoUrl: string | null;
  modules: DigitalModule[];
};

export type TicketTier = {
  name: string;
  price: number;
  /** null = unlimited. */
  quantity: number | null;
  /** ISO dates bounding when this tier can be bought. */
  salesStart: string | null;
  salesEnd: string | null;
  benefits: string[];
};

export type EventDetails = {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  startTime: string;
  endTime: string | null;
  locationType: "physical" | "online";
  venue: string | null;
  address: string | null;
  city: string | null;
  meetingUrl: string | null;
  capacity: number | null;
  ticketTiers: TicketTier[];
  /** Which attendee fields the seller wants collected at checkout. */
  attendeeFields: ("name" | "email" | "phone")[];
};

export type CoachingFormat = "one_on_one" | "group" | "program";

export type CoachingDetails = {
  format: CoachingFormat;
  durationMinutes: number | null;
  meetingMode: "video" | "phone" | "in_person" | "whatsapp" | "other";
  availability: AvailabilityWindow[];
  /** Gap left between two bookings, in minutes. */
  bufferMinutes: number;
};

export type BillingFrequency = "monthly" | "yearly" | "one_time";

export type MembershipDetails = {
  billingFrequency: BillingFrequency;
  benefits: string[];
  access: ("community" | "content" | "events" | "resources" | "direct" | "other")[];
  durationType: "ongoing" | "fixed";
  /** Only meaningful when `durationType` is "fixed". */
  durationDays: number | null;
};

/**
 * Services price three different ways — a flat fee, a floor, or nothing at all
 * until the seller has seen the job.
 */
export type ServicePricingType = "fixed" | "from" | "quote";

export type ServiceDetails = {
  pricingType: ServicePricingType;
  deliveryMode:
    | "in_person"
    | "online"
    | "customer_location"
    | "seller_location"
    | "remote"
    | "other";
  serviceAreas: string[];
  requiresBooking: boolean;
  durationMinutes: number | null;
  availability: AvailabilityWindow[];
};

/** Physical goods need nothing beyond the common fields. */
export type PhysicalDetails = Record<string, never>;

export type OfferDetails =
  | PhysicalDetails
  | DigitalDetails
  | EventDetails
  | CoachingDetails
  | MembershipDetails
  | ServiceDetails;

/**
 * Digital, ticket and membership sales are paid for on the platform: access
 * has to be granted the moment money lands, which a WhatsApp handoff cannot
 * promise. Physical goods, coaching and services still default to WhatsApp,
 * where the seller and buyer agree the details first.
 */
export function defaultCheckoutModeFor(
  type: OfferType
): "whatsapp" | "platform" {
  return type === "digital" || type === "event" || type === "membership"
    ? "platform"
    : "whatsapp";
}

/**
 * The headline price a listing shows. Events price through their tiers and
 * quote-only services have no price at all, so both fall back to 0 and the
 * storefront reads `details` for what to display.
 */
export function listingPriceFor(
  type: OfferType,
  price: number,
  details: OfferDetails
): number {
  if (type === "event") {
    const tiers = (details as EventDetails).ticketTiers ?? [];
    const prices = tiers.map((tier) => tier.price).filter((p) => p > 0);
    return prices.length ? Math.min(...prices) : price;
  }
  if (type === "service" && (details as ServiceDetails).pricingType === "quote") {
    return 0;
  }
  return price;
}
