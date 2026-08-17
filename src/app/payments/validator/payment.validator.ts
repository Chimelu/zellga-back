import { z } from "zod";

export const initializePaymentValidator = z.object({
  orderId: z.string().uuid("Unknown order"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").optional(),
});

export const resolveAccountValidator = z.object({
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Nigerian account numbers are 10 digits"),
  bankCode: z.string().trim().min(1, "Choose a bank").max(10),
});
