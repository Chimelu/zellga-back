import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { loginValidator, registerValidator } from "./validator";
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

  return router;
}
