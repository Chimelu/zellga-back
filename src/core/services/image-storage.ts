export type UploadedMedia = {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
};

export interface ImageStorage {
  upload(
    buffer: Buffer,
    options?: {
      folder?: string;
      filename?: string;
      resourceType?: "image" | "video" | "auto";
    }
  ): Promise<UploadedMedia>;
  delete(publicId: string, resourceType?: "image" | "video"): Promise<void>;
}
