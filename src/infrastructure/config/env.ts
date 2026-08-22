import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_FOLDER: z.string().default("zellga/products"),

  /**
   * Public web app. Every link that leaves this server is built from it —
   * affiliate invites and share links, password resets, and the Paystack
   * return URL — so in production it must be the real domain. The localhost
   * default is a convenience for local work only; see the check below.
   */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /**
   * Paystack is optional at boot so the app still starts without payment
   * credentials — WhatsApp checkout does not need them. Card checkout throws a
   * clear error at call time instead, see `PaystackGateway`.
   */
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  PAYSTACK_PUBLIC_KEY: z.string().min(1).optional(),
  PAYSTACK_BASE_URL: z.string().url().default("https://api.paystack.co"),
  /**
   * Where Paystack sends the buyer after checkout. The order reference is
   * appended as a query param so the page can poll for the final status.
   */
  PAYSTACK_CALLBACK_URL: z.string().url().optional(),

  /**
   * SMTP is optional. With no SMTP_HOST the app falls back to a console
   * transport that prints the message instead of sending it, so invite and
   * password-reset flows are testable locally without mail credentials.
   */
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Zellga <no-reply@zellga.com>"),

  /** How long an emailed password-reset link stays usable. */
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
});

/**
 * Zoho names its credentials after the mailbox (ZOHO_EMAIL / ZOHO_PASSWORD) and
 * documents the sender as SMTP_FROM. They are folded onto the generic SMTP
 * fields here so nothing past this file has to know which provider is in use.
 */
const source = {
  ...process.env,
  SMTP_USER: process.env.SMTP_USER || process.env.ZOHO_EMAIL,
  SMTP_PASS: process.env.SMTP_PASS || process.env.ZOHO_PASSWORD,
  MAIL_FROM: process.env.MAIL_FROM || process.env.SMTP_FROM,
};

/** A host that only resolves on the developer's own machine. */
function isLocalHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/**
 * A production deploy that never set APP_URL used to fall back to localhost
 * and mail out invite links nobody could open. Refusing to boot turns that
 * into a deploy-time failure, which is where it is cheap to fix.
 */
const guardedSchema = envSchema.superRefine((value, ctx) => {
  if (value.NODE_ENV === "production" && isLocalHost(value.APP_URL)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["APP_URL"],
      message:
        "APP_URL must be the public web address in production — emailed invite, share and reset links are built from it",
    });
  }
});

const parsed = guardedSchema.safeParse(source);

if (!parsed.success) {
  const details = parsed.error.flatten().fieldErrors;
  console.error("Invalid environment variables:", details);
  throw new Error(
    `Invalid environment variables: ${Object.keys(details).join(", ")}`
  );
}

export const env = parsed.data;
