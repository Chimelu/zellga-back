import type { ImageStorage } from "../../../core/services/image-storage";
import {
  MAX_DIGITAL_FILE_BYTES,
  assertMediaSize,
} from "../../shared/middleware/upload.middleware";
import { ValidationError } from "../../../core/errors/app.error";
import type { UploadedFileDto, UploadedMediaDto } from "../dto/upload.dto";

/**
 * Multer hands back whatever the browser sent, which on some clients is a full
 * path. Only the last segment is a name, and it is shown to buyers.
 */
function cleanFileName(original: string): string {
  const base = original.split(/[\\/]/).pop() ?? "";
  return base.trim().slice(0, 255) || "download";
}

export class UploadsService {
  constructor(private readonly images: ImageStorage) {}

  async uploadOne(
    file: Express.Multer.File,
    folder?: string
  ): Promise<UploadedMediaDto> {
    if (!file) {
      throw new ValidationError("No file provided");
    }
    assertMediaSize(file);

    const resourceType = file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    const uploaded = await this.images.upload(file.buffer, {
      folder: folder ?? "zellga/uploads",
      resourceType,
    });

    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      // The gallery only ever holds pictures and clips, so a `raw` result
      // here would mean the wrong uploader ran.
      type: uploaded.resourceType === "video" ? "video" : "image",
    };
  }

  /**
   * The asset behind a digital offer. Sent to the provider as `raw` unless it
   * is a picture or a clip, so a PDF comes back byte-for-byte rather than
   * having been through image processing.
   *
   * The original filename rides back with the result: it is what the buyer
   * sees on the download button, and the provider's own public id is a slug
   * that says nothing.
   */
  async uploadDigitalFile(file: Express.Multer.File): Promise<UploadedFileDto> {
    if (!file) {
      throw new ValidationError("No file provided");
    }
    if (file.size > MAX_DIGITAL_FILE_BYTES) {
      throw new ValidationError("Files must be 100MB or less");
    }

    const resourceType = file.mimetype.startsWith("image/")
      ? "image"
      : file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/")
        ? "video"
        : "raw";

    const uploaded = await this.images.upload(file.buffer, {
      folder: "zellga/digital",
      resourceType,
    });

    return {
      url: uploaded.url,
      publicId: uploaded.publicId,
      fileName: cleanFileName(file.originalname),
      sizeBytes: file.size,
    };
  }

  async uploadMany(
    files: Express.Multer.File[],
    folder?: string
  ): Promise<UploadedMediaDto[]> {
    if (!files.length) {
      throw new ValidationError("No files provided");
    }
    if (files.length > 2) {
      throw new ValidationError("You can upload a maximum of 2 files");
    }

    const results: UploadedMediaDto[] = [];
    for (const file of files) {
      results.push(await this.uploadOne(file, folder));
    }
    return results;
  }
}
