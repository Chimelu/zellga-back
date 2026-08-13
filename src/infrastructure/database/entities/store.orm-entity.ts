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

  @Column({
    name: "default_checkout_mode",
    type: "varchar",
    length: 20,
    default: "whatsapp",
  })
  defaultCheckoutMode!: "whatsapp" | "platform";

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
