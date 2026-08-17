import { z } from "zod";

export const updateStoreDetailsValidator = z.object({
  name: z.string().trim().min(2, "Store name is required").max(120).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  category: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export const updateAccountValidator = z.object({
  name: z.string().trim().min(2, "Name is required").max(120).optional(),
  phone: z.string().trim().min(10, "Valid WhatsApp number required").max(20).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(160)
    .nullable()
    .optional(),
});

/** Nigerian NUBAN account numbers are exactly 10 digits. */
export const updatePayoutValidator = z.object({
  bankName: z.string().trim().max(120).nullable().optional(),
  bankCode: z.string().trim().max(10).nullable().optional(),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Account number must be 10 digits")
    .nullable()
    .optional(),
  accountName: z.string().trim().max(120).nullable().optional(),
});

export const updateSettingsValidator = z.object({
  defaultCheckoutMode: z.enum(["whatsapp", "platform"]).optional(),
  affiliateCommissionPercent: z
    .number()
    .min(0, "Commission cannot be negative")
    .max(100, "Commission cannot exceed 100%")
    .optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(72),
  confirmPassword: z.string().min(1, "Confirm your new password"),
});

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changePasswordValidator = changePasswordSchema
  .refine(
    (data: ChangePasswordInput) => data.newPassword === data.confirmPassword,
    {
      message: "Passwords don’t match",
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data: ChangePasswordInput) => data.newPassword !== data.currentPassword,
    {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }
  );
