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

@Entity({ name: "products" })
export class ProductOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "store_id", type: "uuid" })
  storeId!: string;

  @ManyToOne(() => StoreOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: StoreOrmEntity;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  price!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "image_url", type: "text", nullable: true })
  imageUrl!: string | null;

  @Column({ name: "image_public_id", type: "varchar", length: 255, nullable: true })
  imagePublicId!: string | null;

  @Column({ type: "jsonb", default: [] })
  media!: { url: string; publicId: string; type: "image" | "video" }[];

  /** false = hidden from public storefront */
  @Column({ type: "boolean", default: true })
  available!: boolean;

  @Column({ type: "varchar", length: 60, nullable: true })
  category!: string | null;

  @Column({ name: "checkout_mode", type: "varchar", length: 20, default: "whatsapp" })
  checkoutMode!: "whatsapp" | "platform";

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
