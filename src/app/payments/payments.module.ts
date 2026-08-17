import { TypeOrmOrderRepository } from "../../infrastructure/database/repositories/typeorm-order.repository";
import { PaystackGateway } from "../../infrastructure/payments/paystack.gateway";
import { env } from "../../infrastructure/config/env";
import { PaymentsController } from "./controller/payments.controller";
import { createPaymentsRouter } from "./payments.routes";
import { PaymentsService } from "./services/payments.service";

export function buildPaymentsModule() {
  const orders = new TypeOrmOrderRepository();
  const gateway = new PaystackGateway();

  // Paystack appends `?reference=…&trxref=…` to this URL, so the page can
  // verify the transaction itself. It is configured, never client-supplied —
  // taking it from the request would make this an open redirect.
  const callbackUrl =
    env.PAYSTACK_CALLBACK_URL ?? `${env.APP_URL}/checkout/callback`;

  const service = new PaymentsService(orders, gateway, callbackUrl);
  const controller = new PaymentsController(service);

  return {
    router: createPaymentsRouter(controller),
  };
}
