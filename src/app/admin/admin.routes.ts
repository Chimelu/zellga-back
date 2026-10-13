import { RequestHandler, Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { adminLoginValidator, updateOrderStatusValidator } from "./validator";
import type { AdminController } from "./controller/admin.controller";

/**
 * Admin console API. Everything but login sits behind the admin guard, and the
 * controller routes demo admins to generated data instead of the database.
 */
export function createAdminRouter(
  controller: AdminController,
  requireAdmin: RequestHandler
): Router {
  const router = Router();

  router.post(
    "/auth/login",
    validateBody(adminLoginValidator),
    asyncHandler(controller.login)
  );

  router.use(requireAdmin);

  router.get("/auth/me", asyncHandler(controller.me));

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
