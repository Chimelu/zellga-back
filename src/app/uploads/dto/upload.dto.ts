import { z } from "zod";

export const mediaItemSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  type: z.enum(["image", "video"]),
});

export type UploadedMediaDto = z.infer<typeof mediaItemSchema>;

/** A digital offer's asset, as handed back to the seller's form. */
export type UploadedFileDto = {
  url: string;
  publicId: string;
  /** The seller's own filename — what the buyer sees on the download button. */
  fileName: string;
  sizeBytes: number;
};
