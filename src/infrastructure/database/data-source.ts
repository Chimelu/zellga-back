import { DataSource } from "typeorm";
import { env } from "../config/env";
import { UserOrmEntity } from "./entities/user.orm-entity";
import { StoreOrmEntity } from "./entities/store.orm-entity";
import { ProductOrmEntity } from "./entities/product.orm-entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: [UserOrmEntity, StoreOrmEntity, ProductOrmEntity],
  synchronize: env.NODE_ENV === "development",
  logging: env.NODE_ENV === "development",
});

export async function connectDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
