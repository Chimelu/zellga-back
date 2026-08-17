import { Router } from "express";
import { asyncHandler, validateBody } from "../shared/http/http";
import type { PaymentsController } from "./controller/payments.controller";
import { initializePaymentValidator } from "./validator";

/**
 * Every route here is public: buyers check out without an account. Safety
 * comes from the order reference plus provider-side verification, never from
 * what the client claims about the amount.
 */
export function createPaymentsRouter(controller: PaymentsController): Router {
  const router = Router();

  router.post(
    "/initialize",
    validateBody(initializePaymentValidator),
    asyncHandler(controller.initialize)
  );

  // Called when the buyer returns from the Paystack page.
  router.get("/verify/:reference", asyncHandler(controller.verify));

  // Lets a checkout page poll while the webhook settles.
  router.get("/orders/:orderId", asyncHandler(controller.getOrderStatus));

  // Payout account setup. Public because the data is not sensitive: the bank
  // list is public, and resolving requires already knowing the account number.
  router.get("/banks", asyncHandler(controller.listBanks));
  router.get("/resolve-account", asyncHandler(controller.resolveAccount));

  // Provider callback — authenticated by HMAC signature, not by a session.
  router.post("/webhook", asyncHandler(controller.webhook));

  return router;
}
