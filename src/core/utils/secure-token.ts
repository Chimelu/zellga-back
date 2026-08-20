import { createHash, randomBytes } from "crypto";

/** Opaque secret for emailed links — 48 hex chars of CSPRNG output. */
export function generateSecureToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

/** Stable digest used to store and look up a token without keeping the secret. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
