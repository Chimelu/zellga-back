/**
 * `raw` is anything that is not a picture or a clip — the PDF, epub or zip a
 * digital offer hands over. The provider stores it untouched rather than
 * running it through image processing.
 */
export type MediaResourceType = "image" | "video" | "raw";

export type UploadedMedia = {
  url: string;
  publicId: string;
  resourceType: MediaResourceType;
};

export interface ImageStorage {
  upload(
    buffer: Buffer,
    options?: {
      folder?: string;
      filename?: string;
      resourceType?: MediaResourceType | "auto";
    }
  ): Promise<UploadedMedia>;
  delete(publicId: string, resourceType?: MediaResourceType): Promise<void>;
}
