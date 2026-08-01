import { z } from "zod";
import type { RegisterDto } from "../dto/auth.dto";

export const registerValidator = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: z.string().trim().min(10, "Valid WhatsApp number required").max(20),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  storeName: z.string().trim().min(2, "Store name is required").max(120),
  category: z.string().trim().max(60).optional(),
}) satisfies z.ZodType<RegisterDto>;
