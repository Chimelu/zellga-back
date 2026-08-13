import { randomBytes, randomUUID } from "crypto";

/**
 * Alphabet without 0/O/1/I/L so codes survive being read aloud or copied by
 * hand, which is how affiliates tend to pass their link around.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateRefCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/** Opaque secret for invite links — not meant to be typed by a human. */
export function generateInviteToken(): string {
  return `${randomUUID().replace(/-/g, "")}${randomBytes(8).toString("hex")}`;
}
