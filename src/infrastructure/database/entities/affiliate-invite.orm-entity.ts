import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { StoreOrmEntity } from "./store.orm-entity";

/**
 * A pending email invitation to become an affiliate for a store. Rows are kept
 * after acceptance so the seller can see who they invited and when.
 */
@Entity({ name: "affiliate_invites" })
export class AffiliateInviteOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "store_id", type: "uuid" })
  storeId!: string;

  @ManyToOne(() => StoreOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: StoreOrmEntity;

  @Index()
  @Column({ type: "varchar", length: 160 })
  email!: string;

  /** Random secret carried in the invite link; the row is looked up by it. */
  @Index({ unique: true })
  @Column({ type: "varchar", length: 64 })
  token!: string;

  @Index()
  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: "pending" | "accepted" | "revoked";

  /** Rate offered at invite time, copied onto the affiliate on acceptance. */
  @Column({
    name: "commission_percent",
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionPercent!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "accepted_at", type: "timestamptz", nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
