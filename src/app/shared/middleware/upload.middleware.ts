import multer from "multer";
import { ValidationError } from "../../../core/errors/app.error";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const productMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 2 },
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      cb(new ValidationError("Only images or videos are allowed"));
      return;
    }
    cb(null, true);
  },
});

export function assertMediaSize(file: Express.Multer.File): void {
  const isVideo = file.mimetype.startsWith("video/");
  if (!isVideo && file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError("Images must be 5MB or less");
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new ValidationError("Videos must be 50MB or less");
  }
}

/** @deprecated use productMediaUpload */
export const productImageUpload = productMediaUpload;
