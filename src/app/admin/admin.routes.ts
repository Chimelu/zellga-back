import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { updateOrderStatusValidator } from "./validator";
import type { AdminController } from "./controller/admin.controller";

/**
 * Admin console API. Auth is intentionally not wired up yet — an admin guard
 * goes in front of this router once the admin identity model lands.
 */
export function createAdminRouter(controller: AdminController): Router {
  const router = Router();

  router.get("/users", asyncHandler(controller.listUsers));
  router.get("/users/:id", asyncHandler(controller.getUser));
  router.delete("/users/:id", asyncHandler(controller.deleteUser));

  router.get("/orders", asyncHandler(controller.listOrders));
  router.get("/orders/:id", asyncHandler(controller.getOrder));
  router.patch(
    "/orders/:id/status",
    validateBody(updateOrderStatusValidator),
    asyncHandler(controller.updateOrderStatus)
  );
  router.delete("/orders/:id", asyncHandler(controller.deleteOrder));

  router.get("/analytics", asyncHandler(controller.analytics));

  return router;
}
