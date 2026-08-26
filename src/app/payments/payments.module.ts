import { TypeOrmOrderRepository } from "../../infrastructure/database/repositories/typeorm-order.repository";
import { TypeOrmProductRepository } from "../../infrastructure/database/repositories/typeorm-product.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { TypeOrmUserRepository } from "../../infrastructure/database/repositories/typeorm-user.repository";
import { createMailer } from "../../infrastructure/email/nodemailer.mailer";
import { PaystackGateway } from "../../infrastructure/payments/paystack.gateway";
import { env } from "../../infrastructure/config/env";
import { PaymentsController } from "./controller/payments.controller";
import { createPaymentsRouter } from "./payments.routes";
import { PaymentsService } from "./services/payments.service";

export function buildPaymentsModule() {
  const orders = new TypeOrmOrderRepository();
  // Needed to hand a paid buyer their digital files — see `digitalAccessFor`.
  const products = new TypeOrmProductRepository();
  // The store and its owner supply the seller's name and email for the
  // "you got paid" notice.
  const stores = new TypeOrmStoreRepository();
  const users = new TypeOrmUserRepository();
  const mailer = createMailer();
  const gateway = new PaystackGateway();

  // Paystack appends `?reference=…&trxref=…` to this URL, so the page can
  // verify the transaction itself. It is configured, never client-supplied —
  // taking it from the request would make this an open redirect.
  const callbackUrl =
    env.PAYSTACK_CALLBACK_URL ?? `${env.APP_URL}/checkout/callback`;

  const service = new PaymentsService(
    orders,
    products,
    stores,
    users,
    mailer,
    gateway,
    callbackUrl,
    env.APP_URL
  );
  const controller = new PaymentsController(service);

  return {
    router: createPaymentsRouter(controller),
  };
}
