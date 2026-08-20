import { TypeOrmAffiliateRepository } from "../../infrastructure/database/repositories/typeorm-affiliate.repository";
import { TypeOrmOrderRepository } from "../../infrastructure/database/repositories/typeorm-order.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { OrdersController } from "./controller/orders.controller";
import { createOrdersRouter } from "./orders.routes";
import { OrdersService } from "./services/orders.service";

export function buildOrdersModule() {
  const orders = new TypeOrmOrderRepository();
  const stores = new TypeOrmStoreRepository();
  const affiliates = new TypeOrmAffiliateRepository();
  const tokens = new JwtTokenService();

  const service = new OrdersService(orders, stores, affiliates);
  const controller = new OrdersController(service);

  return {
    router: createOrdersRouter(controller, tokens),
  };
}
