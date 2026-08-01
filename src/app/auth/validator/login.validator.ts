import { z } from "zod";
import type { LoginDto } from "../dto/auth.dto";

export const loginValidator = z.object({
  phone: z.string().trim().min(10, "Valid WhatsApp number required").max(20),
  password: z.string().min(1, "Password is required").max(72),
}) satisfies z.ZodType<LoginDto>;
