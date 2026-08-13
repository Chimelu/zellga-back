import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { StoreOrmEntity } from "./store.orm-entity";
import { UserOrmEntity } from "./user.orm-entity";

/**
 * An accepted affiliate relationship: one user selling for one store.
 * A user may affiliate for several stores, but only once per store.
 */
@Entity({ name: "affiliates" })
@Unique("uq_affiliate_store_user", ["storeId", "userId"])
export class AffiliateOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "store_id", type: "uuid" })
  storeId!: string;

  @ManyToOne(() => StoreOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: StoreOrmEntity;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserOrmEntity;

  /**
   * Public code appended to share links as `?ref=`. Unique across all stores
   * so a single lookup resolves both the affiliate and the store.
   */
  @Index({ unique: true })
  @Column({ name: "ref_code", type: "varchar", length: 20 })
  refCode!: string;

  /** Suspended affiliates keep their history but stop earning on new orders. */
  @Index()
  @Column({ type: "varchar", length: 20, default: "active" })
  status!: "active" | "suspended";

  /**
   * Rate captured when the affiliate joined. Kept per-affiliate so changing the
   * store rate never rewrites what past affiliates were promised.
   */
  @Column({
    name: "commission_percent",
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionPercent!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
