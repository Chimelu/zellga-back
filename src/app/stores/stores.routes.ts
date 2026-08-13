import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import type { StoresController } from "./controller/stores.controller";
import { createOrderValidator } from "./validator";

export function createStoresRouter(controller: StoresController): Router {
  const router = Router();

  router.get("/:slug", asyncHandler(controller.getBySlug));

  // Public checkout — buyers are not signed in.
  router.post(
    "/:slug/orders",
    validateBody(createOrderValidator),
    asyncHandler(controller.createOrder)
  );

  return router;
}
