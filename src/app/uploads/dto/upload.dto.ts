import { z } from "zod";

export const mediaItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  type: z.enum(["image", "video"]),
});

export type UploadedMediaDto = z.infer<typeof mediaItemSchema>;
