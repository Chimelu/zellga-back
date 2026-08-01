import "reflect-metadata";
import type { VercelRequest, VercelResponse } from "@vercel/node";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureReady();
  return app(req, res);
}
