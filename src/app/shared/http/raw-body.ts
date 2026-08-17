import type { Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      /** Unparsed body, kept only where a signature is computed over it. */
      rawBody?: Buffer;
    }
  }
}

/**
 * `express.json` verify hook. Payment webhooks are signed over the exact bytes
 * sent, and re-serializing the parsed object does not reliably reproduce them
 * (key order, whitespace, unicode escapes), so the original buffer is stashed.
 */
export function captureRawBody(
  req: Request,
  _res: Response,
  buf: Buffer
): void {
  if (buf?.length) {
    req.rawBody = buf;
  }
}
