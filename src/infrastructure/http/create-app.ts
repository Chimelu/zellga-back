import express from "express";
import cors from "cors";
import { errorHandler } from "../../app/shared/http/http";
import { buildAdminModule } from "../../app/admin/admin.module";
import { buildAffiliatesModule } from "../../app/affiliates/affiliates.module";
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
  const affiliates = buildAffiliatesModule();
  // Checkout resolves ref codes through the same service the dashboard uses.
  const stores = buildStoresModule(affiliates.service);
  const profile = buildProfileModule();
  const uploads = buildUploadsModule();
  const admin = buildAdminModule();

  app.use("/api/auth", auth.router);
  app.use("/api/products", products.router);
  app.use("/api/stores", stores.router);
  app.use("/api/profile", profile.router);
  app.use("/api/uploads", uploads.router);
  app.use("/api/admin", admin.router);
  app.use("/api/affiliates", affiliates.router);

  app.use(errorHandler);

  return app;
}
