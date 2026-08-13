import { TypeOrmAdminRepository } from "../../infrastructure/database/repositories/typeorm-admin.repository";
import { AdminController } from "./controller/admin.controller";
import { createAdminRouter } from "./admin.routes";
import { AdminService } from "./services/admin.service";

export function buildAdminModule() {
  const admin = new TypeOrmAdminRepository();
  const service = new AdminService(admin);
  const controller = new AdminController(service);

  return {
    router: createAdminRouter(controller),
  };
}
