import { z } from "zod";
import type { LoginDto } from "../dto/auth.dto";

/**
 * Accepts either `identifier` (phone or email) or the original `phone` field,
 * so a backend deploy does not break clients that have not shipped yet.
 */
export const loginValidator = z
  .object({
    identifier: z.string().trim().max(160).optional(),
    phone: z.string().trim().max(160).optional(),
    password: z.string().min(1, "Password is required").max(72),
  })
  .transform((input, ctx) => {
    const identifier = input.identifier?.trim() || input.phone?.trim() || "";
    if (identifier.length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "Enter your WhatsApp number or email",
        path: ["identifier"],
      });
      return z.NEVER;
    }
    return { identifier, password: input.password };
  }) satisfies z.ZodType<LoginDto>;
