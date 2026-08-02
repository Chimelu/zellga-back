import express from "express";
import cors from "cors";
import { errorHandler } from "../../app/shared/http/http";
import { buildAuthModule } from "../../app/auth/auth.module";
import { buildProductsModule } from "../../app/products/products.module";
import { buildProfileModule } from "../../app/profile/profile.module";
import { buildStoresModule } from "../../app/stores/stores.module";
import { buildUploadsModule } from "../../app/uploads/uploads.module";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  const auth = buildAuthModule();
  const products = buildProductsModule();
  const stores = buildStoresModule();
  const profile = buildProfileModule();
  const uploads = buildUploadsModule();

  app.use("/api/auth", auth.router);
  app.use("/api/products", products.router);
  app.use("/api/stores", stores.router);
  app.use("/api/profile", profile.router);
  app.use("/api/uploads", uploads.router);

  app.use(errorHandler);

  return app;
}
