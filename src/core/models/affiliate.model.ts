export type AffiliateStatus = "active" | "suspended";

export type AffiliateProps = {
  id: string;
  storeId: string;
  userId: string;
  refCode: string;
  status: AffiliateStatus;
  commissionPercent: number;
  createdAt: Date;
  updatedAt: Date;
};

export class Affiliate {
  readonly id: string;
  readonly storeId: string;
  readonly userId: string;
  refCode: string;
  status: AffiliateStatus;
  commissionPercent: number;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: AffiliateProps) {
    this.id = props.id;
    this.storeId = props.storeId;
    this.userId = props.userId;
    this.refCode = props.refCode;
    this.status = props.status;
    this.commissionPercent = props.commissionPercent;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** Commission owed on an order of `total`, rounded to whole kobo. */
  commissionOn(total: number): number {
    if (this.status !== "active" || this.commissionPercent <= 0) return 0;
    return Math.round(total * this.commissionPercent) / 100;
  }
}

export type AffiliateInviteStatus = "pending" | "accepted" | "revoked";

export type AffiliateInviteProps = {
  id: string;
  storeId: string;
  email: string;
  token: string;
  status: AffiliateInviteStatus;
  commissionPercent: number;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class AffiliateInvite {
  readonly id: string;
  readonly storeId: string;
  email: string;
  token: string;
  status: AffiliateInviteStatus;
  commissionPercent: number;
  expiresAt: Date;
  acceptedAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: AffiliateInviteProps) {
    this.id = props.id;
    this.storeId = props.storeId;
    this.email = props.email;
    this.token = props.token;
    this.status = props.status;
    this.commissionPercent = props.commissionPercent;
    this.expiresAt = props.expiresAt;
    this.acceptedAt = props.acceptedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }

  /** Only a pending, unexpired invite can be accepted. */
  isAcceptable(now: Date = new Date()): boolean {
    return this.status === "pending" && !this.isExpired(now);
  }
}
