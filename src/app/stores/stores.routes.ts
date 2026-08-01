import { Router } from "express";
import { asyncHandler } from "../shared/http/http";
import type { StoresController } from "./controller/stores.controller";

export function createStoresRouter(controller: StoresController): Router {
  const router = Router();

  router.get("/:slug", asyncHandler(controller.getBySlug));

  return router;
}
