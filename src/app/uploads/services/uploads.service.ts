import type { ImageStorage } from "../../../core/services/image-storage";
import { assertMediaSize } from "../../shared/middleware/upload.middleware";
import { ValidationError } from "../../../core/errors/app.error";
import type { UploadedMediaDto } from "../dto/upload.dto";

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
      type: uploaded.resourceType,
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
