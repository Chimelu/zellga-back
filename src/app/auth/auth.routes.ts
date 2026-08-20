import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import {
  acceptInviteValidator,
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
} from "./validator";
import type { AuthController } from "./controller/auth.controller";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post(
    "/register",
    validateBody(registerValidator),
    asyncHandler(controller.register)
  );

  router.post(
    "/login",
    validateBody(loginValidator),
    asyncHandler(controller.login)
  );

  // Password reset. All three are unauthenticated by design — the caller is
  // locked out, and the emailed token is what stands in for the password.
  router.post(
    "/forgot-password",
    validateBody(forgotPasswordValidator),
    asyncHandler(controller.forgotPassword)
  );

  router.get(
    "/reset-password/:token",
    asyncHandler(controller.previewResetToken)
  );

  router.post(
    "/reset-password",
    validateBody(resetPasswordValidator),
    asyncHandler(controller.resetPassword)
  );

  // Unauthenticated: the recipient has no account until they accept.
  router.get("/invite/:token", asyncHandler(controller.previewInvite));

  router.post(
    "/invite/accept",
    validateBody(acceptInviteValidator),
    asyncHandler(controller.acceptInvite)
  );

  return router;
}
