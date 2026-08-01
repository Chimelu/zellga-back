import { TypeOrmUserRepository } from "../../infrastructure/database/repositories/typeorm-user.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { TypeOrmProductRepository } from "../../infrastructure/database/repositories/typeorm-product.repository";
import { BcryptPasswordHasher } from "../../infrastructure/security/bcrypt-password.hasher";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { ProfileController } from "./controller/profile.controller";
import { createProfileRouter } from "./profile.routes";
import { ProfileService } from "./services/profile.service";

export function buildProfileModule() {
  const users = new TypeOrmUserRepository();
  const stores = new TypeOrmStoreRepository();
  const products = new TypeOrmProductRepository();
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService();

  const service = new ProfileService(users, stores, products, hasher);
  const controller = new ProfileController(service);

  return {
    router: createProfileRouter(controller, tokens),
  };
}
