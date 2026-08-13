import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { createAuthMiddleware } from "../shared/middleware/auth.middleware";
import type { TokenService } from "../../core/services/token.service";
import type { AffiliateController } from "./controller/affiliate.controller";
import { affiliateStatusValidator, inviteAffiliateValidator } from "./validator";

export function createAffiliatesRouter(
  controller: AffiliateController,
  tokens: TokenService
): Router {
  const router = Router();
  router.use(createAuthMiddleware(tokens));

  // Store owner managing their own affiliate programme.
  router.get("/program", asyncHandler(controller.getProgram));
  router.post(
    "/invites",
    validateBody(inviteAffiliateValidator),
    asyncHandler(controller.invite)
  );
  router.delete("/invites/:inviteId", asyncHandler(controller.revokeInvite));
  router.patch(
    "/:affiliateId/status",
    validateBody(affiliateStatusValidator),
    asyncHandler(controller.setStatus)
  );
  router.delete("/:affiliateId", asyncHandler(controller.remove));

  // The signed-in user acting as an affiliate.
  router.get("/me", asyncHandler(controller.getDashboard));
  router.get("/me/products", asyncHandler(controller.listProducts));
  router.get("/me/sales", asyncHandler(controller.listSales));

  return router;
}
