import { TypeOrmProductRepository } from "../../infrastructure/database/repositories/typeorm-product.repository";
import { TypeOrmStoreRepository } from "../../infrastructure/database/repositories/typeorm-store.repository";
import { CloudinaryImageStorage } from "../../infrastructure/storage/cloudinary-image.storage";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";
import { ProductsController } from "./controller/products.controller";
import { createProductsRouter } from "./products.routes";
import { ProductsService } from "./services/products.service";

export function buildProductsModule() {
  const products = new TypeOrmProductRepository();
  const stores = new TypeOrmStoreRepository();
  const images = new CloudinaryImageStorage();
  const tokens = new JwtTokenService();

  const service = new ProductsService(products, stores, images);
  const controller = new ProductsController(service);

  return {
    router: createProductsRouter(controller, tokens),
  };
}
