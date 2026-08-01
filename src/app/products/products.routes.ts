import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { createAuthMiddleware } from "../shared/middleware/auth.middleware";
import type { TokenService } from "../../core/services/token.service";
import type { ProductsController } from "./controller/products.controller";
import {
  createProductValidator,
  setVisibilityValidator,
  updateProductValidator,
} from "./validator";

export function createProductsRouter(
  controller: ProductsController,
  tokens: TokenService
): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware(tokens);

  router.use(requireAuth);

  router.get("/", asyncHandler(controller.list));
  router.get("/:id", asyncHandler(controller.getOne));

  router.post(
    "/",
    validateBody(createProductValidator),
    asyncHandler(controller.create)
  );

  router.patch(
    "/:id",
    validateBody(updateProductValidator),
    asyncHandler(controller.update)
  );

  router.patch(
    "/:id/visibility",
    validateBody(setVisibilityValidator),
    asyncHandler(controller.setVisibility)
  );

  router.delete("/:id", asyncHandler(controller.remove));

  return router;
}
