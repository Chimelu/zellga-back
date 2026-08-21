import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from "typeorm";
import type { CheckoutMode } from "../../../core/models/store.model";
import { UserOrmEntity } from "./user.orm-entity";

@Entity({ name: "stores" })
export class StoreOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId!: string;

  @OneToOne(() => UserOrmEntity, (user) => user.store, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: UserOrmEntity;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 60 })
  slug!: string;

  @Column({ type: "varchar", length: 60, nullable: true })
  category!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  /** Square profile image shown over the cover on the storefront. */
  @Column({ name: "logo_url", type: "text", nullable: true })
  logoUrl!: string | null;

  /** Wide banner behind the store name on the storefront. */
  @Column({ name: "cover_url", type: "text", nullable: true })
  coverUrl!: string | null;

  @Column({
    name: "default_checkout_mode",
    type: "varchar",
    length: 20,
    default: "whatsapp",
  })
  defaultCheckoutMode!: CheckoutMode;

  /**
   * Share of each attributed order paid to the affiliate who brought it in.
   * Applies store-wide; 0 means the store is not recruiting affiliates.
   */
  @Column({
    name: "affiliate_commission_percent",
    type: "numeric",
    precision: 5,
    scale: 2,
    default: 0,
  })
  affiliateCommissionPercent!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
