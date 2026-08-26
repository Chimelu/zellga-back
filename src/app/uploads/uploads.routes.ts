import { Router } from "express";
import { asyncHandler } from "../shared/http/http";
import { createAuthMiddleware } from "../shared/middleware/auth.middleware";
import {
  digitalFileUpload,
  productMediaUpload,
} from "../shared/middleware/upload.middleware";
import type { TokenService } from "../../core/services/token.service";
import type { UploadsController } from "./controller/uploads.controller";

export function createUploadsRouter(
  controller: UploadsController,
  tokens: TokenService
): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(tokens);

  router.use(requireAuth);

  router.post(
    "/media",
    productMediaUpload.array("media", 5),
    asyncHandler(controller.upload)
  );

  // The asset a digital offer hands over. Separate from `/media` because it
  // accepts documents and archives the gallery does not, one at a time.
  router.post(
    "/file",
    digitalFileUpload.single("file"),
    asyncHandler(controller.uploadDigitalFile)
  );

  return router;
}
