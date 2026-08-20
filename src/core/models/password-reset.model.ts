export type PasswordResetProps = {
  id: string;
  userId: string;
  /**
   * SHA-256 of the secret carried in the emailed link. The secret itself is
   * never stored, so a leaked table cannot be used to take over accounts.
   */
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PasswordReset {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: PasswordResetProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  /** A link works once, and only until it expires. */
  isUsable(now: Date = new Date()): boolean {
    return this.usedAt === null && !this.isExpired(now);
  }
}
