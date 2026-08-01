import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import type {
  ImageStorage,
  UploadedMedia,
} from "../../core/services/image-storage";
import { env } from "../config/env";
import { AppError } from "../../core/errors/app.error";

export class CloudinaryImageStorage implements ImageStorage {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  upload(
    buffer: Buffer,
    options?: {
      folder?: string;
      filename?: string;
      resourceType?: "image" | "video" | "auto";
    }
  ): Promise<UploadedMedia> {
    const resourceType = options?.resourceType ?? "auto";

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options?.folder ?? env.CLOUDINARY_FOLDER,
          public_id: options?.filename,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new AppError(
                error?.message ?? "Media upload failed",
                502,
                "UPLOAD_FAILED"
              )
            );
            return;
          }
          const type =
            result.resource_type === "video" ? "video" : "image";
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: type,
          });
        }
      );

      Readable.from(buffer).pipe(stream);
    });
  }

  async delete(
    publicId: string,
    resourceType: "image" | "video" = "image"
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch {
      // best-effort cleanup
    }
  }
}
