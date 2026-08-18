import { TypeOrmAnalyticsRepository } from "../../infrastructure/database/repositories/typeorm-analytics.repository";
import { TypeOrmProductRepository } from "../../infrastructure/database/repositories/typeorm-product.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { AnalyticsController } from "./controller/analytics.controller";
import { createAnalyticsRouter } from "./analytics.routes";
import { AnalyticsService } from "./services/analytics.service";

export function buildAnalyticsModule() {
  const analytics = new TypeOrmAnalyticsRepository();
  const stores = new TypeOrmStoreRepository();
  const products = new TypeOrmProductRepository();
  const tokens = new JwtTokenService();

  const service = new AnalyticsService(analytics, stores, products);
  const controller = new AnalyticsController(service);

  return {
    router: createAnalyticsRouter(controller, tokens),
  };
}
