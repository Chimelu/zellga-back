import { z } from "zod";
import type { ForgotPasswordDto, ResetPasswordDto } from "../dto/auth.dto";

export const forgotPasswordValidator = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(160),
}) satisfies z.ZodType<ForgotPasswordDto>;

export const resetPasswordValidator = z.object({
  token: z.string().trim().min(10, "Reset token is required").max(128),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
}) satisfies z.ZodType<ResetPasswordDto>;
