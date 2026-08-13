import { TypeOrmUserRepository } from "../../infrastructure/database/repositories/typeorm-user.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import {
  TypeOrmAffiliateInviteRepository,
  TypeOrmAffiliateRepository,
} from "../../infrastructure/database/repositories/typeorm-affiliate.repository";
import { BcryptPasswordHasher } from "../../infrastructure/security/bcrypt-password.hasher";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { AuthController } from "./controller/auth.controller";
import { createAuthRouter } from "./auth.routes";
import { AuthService } from "./services/auth.service";

/** Wires auth controller → service → core ports / infrastructure. */
export function buildAuthModule() {
  const users = new TypeOrmUserRepository();
  const stores = new TypeOrmStoreRepository();
  const invites = new TypeOrmAffiliateInviteRepository();
  const affiliates = new TypeOrmAffiliateRepository();
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService();

  const authService = new AuthService(
    users,
    stores,
    hasher,
    tokens,
    invites,
    affiliates
  );
  const controller = new AuthController(authService);

  return {
    router: createAuthRouter(controller),
  };
}
