import type { PasswordReset } from "../models/password-reset.model";

export interface PasswordResetRepository {
  /** Lookup is by hash — the raw token only ever exists in the email. */
  findByTokenHash(tokenHash: string): Promise<PasswordReset | null>;
  save(reset: PasswordReset): Promise<PasswordReset>;
  /**
   * Burns every outstanding link for a user. Called both when a new one is
   * issued and after a successful reset, so only the newest link is ever live.
   */
  invalidateAllForUser(userId: string, at: Date): Promise<void>;
  /** Backs the per-account throttle on how often a link can be requested. */
  countCreatedSince(userId: string, since: Date): Promise<number>;
}
