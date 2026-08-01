import "reflect-metadata";
import type { IncomingMessage, ServerResponse } from "http";
import { connectDatabase } from "../dist/infrastructure/database/data-source";
import { createApp } from "../dist/infrastructure/http/create-app";

const app = createApp();

let ready: Promise<unknown> | null = null;

function ensureReady() {
  if (!ready) {
    ready = connectDatabase();
  }
  return ready;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  await ensureReady();
  return app(req as never, res as never);
}
