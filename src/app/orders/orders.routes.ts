import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import { createAuthMiddleware } from "../shared/middleware/auth.middleware";
import type { TokenService } from "../../core/services/token.service";
import type { OrdersController } from "./controller/orders.controller";
import {
  updateOrderStatusValidator,
  updatePaymentStatusValidator,
} from "./validator";

export function createOrdersRouter(
  controller: OrdersController,
  tokens: TokenService
): Router {
  const router = Router();

  router.use(createAuthMiddleware(tokens));

  // Declared before `/:id` so "summary" is not read as an order id.
  router.get("/summary", asyncHandler(controller.summary));
  router.get("/", asyncHandler(controller.list));
  router.get("/:id", asyncHandler(controller.getOne));

  router.patch(
    "/:id/status",
    validateBody(updateOrderStatusValidator),
    asyncHandler(controller.updateStatus)
  );

  // Confirming money that arrived off-platform (WhatsApp transfer, cash).
  router.patch(
    "/:id/payment",
    validateBody(updatePaymentStatusValidator),
    asyncHandler(controller.updatePaymentStatus)
  );

  return router;
}
