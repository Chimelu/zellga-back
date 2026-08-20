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
import type {
  OfferDetails,
  OfferType,
} from "../../../core/models/offer.model";

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

  /**
   * What the seller is selling. Stores are not locked to one type — this is
   * chosen per offer, so one store can hold a cake and a course.
   */
  @Column({ name: "offer_type", type: "varchar", length: 20, default: "physical" })
  offerType!: OfferType;

  /** Narrower kind within the type, e.g. `course` under `digital`. */
  @Column({ type: "varchar", length: 40, nullable: true })
  subtype!: string | null;

  /**
   * Type-specific fields — ticket tiers, availability windows, billing
   * frequency. Kept as one document because the shape follows `offer_type`,
   * and a column per type would leave most of them null on every row.
   */
  @Column({ type: "jsonb", default: {} })
  details!: OfferDetails;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
