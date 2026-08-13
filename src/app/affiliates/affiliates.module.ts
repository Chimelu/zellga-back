import {
  TypeOrmAffiliateInviteRepository,
  TypeOrmAffiliateRepository,
} from "../../infrastructure/database/repositories/typeorm-affiliate.repository";
import { TypeOrmProductRepository } from "../../infrastructure/database/repositories/typeorm-product.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { TypeOrmUserRepository } from "../../infrastructure/database/repositories/typeorm-user.repository";
import { createMailer } from "../../infrastructure/email/nodemailer.mailer";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { env } from "../../infrastructure/config/env";
import { AffiliateController } from "./controller/affiliate.controller";
import { createAffiliatesRouter } from "./affiliates.routes";
import { AffiliateService } from "./services/affiliate.service";

export function buildAffiliatesModule() {
  const affiliates = new TypeOrmAffiliateRepository();
  const invites = new TypeOrmAffiliateInviteRepository();
  const stores = new TypeOrmStoreRepository();
  const users = new TypeOrmUserRepository();
  const products = new TypeOrmProductRepository();
  const mailer = createMailer();
  const tokens = new JwtTokenService();

  const service = new AffiliateService(
    affiliates,
    invites,
    stores,
    users,
    products,
    mailer,
    env.APP_URL
  );
  const controller = new AffiliateController(service);

  return {
    router: createAffiliatesRouter(controller, tokens),
    service,
  };
}
