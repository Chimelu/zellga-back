import { z } from "zod";
import type { AcceptInviteDto, RegisterDto } from "../dto/auth.dto";

export const registerValidator = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: z.string().trim().min(10, "Valid WhatsApp number required").max(20),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(160)
    .optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  storeName: z.string().trim().min(2, "Store name is required").max(120),
  category: z.string().trim().max(60).optional(),
}) satisfies z.ZodType<RegisterDto>;

export const acceptInviteValidator = z.object({
  token: z.string().trim().min(10, "Invite token is required").max(64),
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: z.string().trim().min(10, "Valid WhatsApp number required").max(20),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
}) satisfies z.ZodType<AcceptInviteDto>;
