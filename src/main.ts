import "reflect-metadata";
import { env } from "./infrastructure/config/env";
import { connectDatabase } from "./infrastructure/database/data-source";
import { createApp } from "./infrastructure/http/create-app";

async function bootstrap() {
  await connectDatabase();
  console.log("Database connected");

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Zellga API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
