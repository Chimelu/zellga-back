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

  /** Public web app, used to build links inside outgoing email. */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /**
   * SMTP is optional. With no SMTP_HOST the app falls back to a console
   * transport that prints the message instead of sending it, so invite flows
   * are testable locally without mail credentials.
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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.flatten().fieldErrors;
  console.error("Invalid environment variables:", details);
  throw new Error(
    `Invalid environment variables: ${Object.keys(details).join(", ")}`
  );
}

export const env = parsed.data;
