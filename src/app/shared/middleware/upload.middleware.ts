import multer from "multer";
import { ValidationError } from "../../../core/errors/app.error";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const productMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 5 },
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

/**
 * The asset a digital offer hands over — an ebook, a zip of templates, an
 * audio file. Deliberately a separate uploader from the product gallery: this
 * one takes documents and archives the gallery would reject, and it takes them
 * one at a time.
 */
export const MAX_DIGITAL_FILE_BYTES = 100 * 1024 * 1024;

/**
 * What a seller may sell as a download. An allowlist rather than "anything but
 * executables": the file is served back to buyers from our own domain, and a
 * denylist would need updating every time a new dangerous type appears.
 */
const DIGITAL_FILE_TYPES = [
  "application/pdf",
  "application/epub+zip",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/rtf",
  "text/plain",
  "text/csv",
];

function isAllowedDigitalFile(mimetype: string): boolean {
  return (
    DIGITAL_FILE_TYPES.includes(mimetype) ||
    mimetype.startsWith("image/") ||
    mimetype.startsWith("audio/") ||
    mimetype.startsWith("video/")
  );
}

export const digitalFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DIGITAL_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedDigitalFile(file.mimetype)) {
      cb(
        new ValidationError(
          "That file type isn't supported. Try a PDF, document, archive, image, audio or video file."
        )
      );
      return;
    }
    cb(null, true);
  },
});
