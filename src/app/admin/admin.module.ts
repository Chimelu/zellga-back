import { TypeOrmAdminRepository } from "../../infrastructure/database/repositories/typeorm-admin.repository";
import { TypeOrmAdminAccountRepository } from "../../infrastructure/database/repositories/typeorm-admin-account.repository";
import { DemoAdminRepository } from "../../infrastructure/demo/demo-admin.repository";
import { BcryptPasswordHasher } from "../../infrastructure/security/bcrypt-password.hasher";
import { JwtAdminTokenService } from "../../infrastructure/security/jwt-admin-token.service";
import { createAdminAuthMiddleware } from "../shared/middleware/admin-auth.middleware";
import { AdminController } from "./controller/admin.controller";
import { createAdminRouter } from "./admin.routes";
import { AdminService } from "./services/admin.service";
import { AdminAuthService } from "./services/admin-auth.service";

export function buildAdminModule() {
  const tokens = new JwtAdminTokenService();
  const liveService = new AdminService(new TypeOrmAdminRepository());
  const demoService = new AdminService(new DemoAdminRepository());
  const authService = new AdminAuthService(
    new TypeOrmAdminAccountRepository(),
    new BcryptPasswordHasher(),
    tokens
  );
  const controller = new AdminController(liveService, demoService, authService);

  return {
    router: createAdminRouter(controller, createAdminAuthMiddleware(tokens)),
  };
}
