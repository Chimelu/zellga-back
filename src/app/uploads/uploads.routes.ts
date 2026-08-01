import { Router } from "express";
import { asyncHandler } from "../shared/http/http";
import { createAuthMiddleware } from "../shared/middleware/auth.middleware";
import { productMediaUpload } from "../shared/middleware/upload.middleware";
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
    productMediaUpload.array("media", 2),
    asyncHandler(controller.upload)
  );

  return router;
}
