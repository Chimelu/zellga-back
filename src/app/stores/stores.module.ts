import { TypeOrmProductRepository } from "../../infrastructure/database/repositories/typeorm-product.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { TypeOrmUserRepository } from "../../infrastructure/database/repositories/typeorm-user.repository";
import { TypeOrmOrderRepository } from "../../infrastructure/database/repositories/typeorm-order.repository";
import { StoresController } from "./controller/stores.controller";
import { createStoresRouter } from "./stores.routes";
import { StoresService } from "./services/stores.service";
import type { AffiliateService } from "../affiliates/services/affiliate.service";

/**
 * Takes the affiliate service from the caller rather than building its own, so
 * checkout attribution and the affiliate dashboard share one implementation.
 */
export function buildStoresModule(affiliates: AffiliateService) {
  const stores = new TypeOrmStoreRepository();
  const products = new TypeOrmProductRepository();
  const users = new TypeOrmUserRepository();
  const orders = new TypeOrmOrderRepository();
  const service = new StoresService(stores, products, users, orders, affiliates);
  const controller = new StoresController(service);

  return {
    router: createStoresRouter(controller),
  };
}
