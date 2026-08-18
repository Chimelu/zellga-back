import { DataSource } from "typeorm";
import { env } from "../config/env";
import { UserOrmEntity } from "./entities/user.orm-entity";
import { StoreOrmEntity } from "./entities/store.orm-entity";
import { ProductOrmEntity } from "./entities/product.orm-entity";
import { OrderOrmEntity } from "./entities/order.orm-entity";
import { StoreEventOrmEntity } from "./entities/store-event.orm-entity";
import { AffiliateOrmEntity } from "./entities/affiliate.orm-entity";
import { AffiliateInviteOrmEntity } from "./entities/affiliate-invite.orm-entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: [
    UserOrmEntity,
    StoreOrmEntity,
    ProductOrmEntity,
    OrderOrmEntity,
    StoreEventOrmEntity,
    AffiliateOrmEntity,
    AffiliateInviteOrmEntity,
  ],
  /** `npm run migration:run` applies these — production never auto-syncs. */
  migrations: ["src/infrastructure/database/migrations/*.ts"],
  synchronize: env.NODE_ENV === "development",
  logging: env.NODE_ENV === "development",
});

export async function connectDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
