import { TypeOrmUserRepository } from "../../infrastructure/database/repositories/typeorm-user.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { BcryptPasswordHasher } from "../../infrastructure/security/bcrypt-password.hasher";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { AuthController } from "./controller/auth.controller";
import { createAuthRouter } from "./auth.routes";
import { AuthService } from "./services/auth.service";

/** Wires auth controller → service → core ports / infrastructure. */
export function buildAuthModule() {
  const users = new TypeOrmUserRepository();
  const stores = new TypeOrmStoreRepository();
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService();

  const authService = new AuthService(users, stores, hasher, tokens);
  const controller = new AuthController(authService);

  return {
    router: createAuthRouter(controller),
  };
}
