import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import {
  acceptInviteValidator,
  loginValidator,
  registerValidator,
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

  // Unauthenticated: the recipient has no account until they accept.
  router.get("/invite/:token", asyncHandler(controller.previewInvite));

  router.post(
    "/invite/accept",
    validateBody(acceptInviteValidator),
    asyncHandler(controller.acceptInvite)
  );

  return router;
}
