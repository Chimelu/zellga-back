import { TypeOrmProductRepository } from "../../infrastructure/database/repositories/typeorm-product.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { TypeOrmUserRepository } from "../../infrastructure/database/repositories/typeorm-user.repository";
import { StoresController } from "./controller/stores.controller";
import { createStoresRouter } from "./stores.routes";
import { StoresService } from "./services/stores.service";

export function buildStoresModule() {
  const stores = new TypeOrmStoreRepository();
  const products = new TypeOrmProductRepository();
  const users = new TypeOrmUserRepository();
  const service = new StoresService(stores, products, users);
  const controller = new StoresController(service);

  return {
    router: createStoresRouter(controller),
  };
}
