import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { createAuthMiddleware } from "../shared/middleware/auth.middleware";
import type { TokenService } from "../../core/services/token.service";
import type { ProfileController } from "./controller/profile.controller";
import {
  changePasswordValidator,
  updateAccountValidator,
  updatePayoutValidator,
  updateSettingsValidator,
  updateStoreDetailsValidator,
} from "./validator";

export function createProfileRouter(
  controller: ProfileController,
  tokens: TokenService
): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(tokens);

  router.use(requireAuth);

  router.get("/", asyncHandler(controller.get));

  router.patch(
    "/store",
    validateBody(updateStoreDetailsValidator),
    asyncHandler(controller.updateStore)
  );

  router.patch(
    "/account",
    validateBody(updateAccountValidator),
    asyncHandler(controller.updateAccount)
  );

  router.patch(
    "/payout",
    validateBody(updatePayoutValidator),
    asyncHandler(controller.updatePayout)
  );

  router.patch(
    "/settings",
    validateBody(updateSettingsValidator),
    asyncHandler(controller.updateSettings)
  );

  router.patch(
    "/password",
    validateBody(changePasswordValidator),
    asyncHandler(controller.changePassword)
  );

  return router;
}
