import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { createAuthMiddleware } from "../shared/middleware/auth.middleware";
import type { TokenService } from "../../core/services/token.service";
import type { AnalyticsController } from "./controller/analytics.controller";
import { recordEventValidator } from "./validator";

export function createAnalyticsRouter(
  controller: AnalyticsController,
  tokens: TokenService
): Router {
  const router = Router();

  // Public: buyers are not signed in, so tracking cannot require a session.
  // Auth is attached per-route rather than with `router.use` for that reason.
  router.post(
    "/events",
    validateBody(recordEventValidator),
    asyncHandler(controller.recordEvent)
  );

  // Seller-only: scoped to the caller's own store inside the service.
  router.get(
    "/",
    createAuthMiddleware(tokens),
    asyncHandler(controller.getVendorAnalytics)
  );

  return router;
}
