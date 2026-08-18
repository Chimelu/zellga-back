import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { StoreOrmEntity } from "./store.orm-entity";
import { ProductOrmEntity } from "./product.orm-entity";
import type { StoreEventType } from "../../../core/models/store-event.model";

@Entity({ name: "store_events" })
// Every analytics query filters by store and a date window, so they lead the
// index. The second one serves the per-type counts within that window.
@Index("IDX_store_events_store_created", ["storeId", "createdAt"])
@Index("IDX_store_events_store_type_created", ["storeId", "type", "createdAt"])
export class StoreEventOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "store_id", type: "uuid" })
  storeId!: string;

  @ManyToOne(() => StoreOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: StoreOrmEntity;

  /** Set for `item_click`. SET NULL so deleting a product keeps its history. */
  @Index()
  @Column({ name: "product_id", type: "uuid", nullable: true })
  productId!: string | null;

  @ManyToOne(() => ProductOrmEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "product_id" })
  product!: ProductOrmEntity | null;

  @Column({ type: "varchar", length: 20 })
  type!: StoreEventType;

  /** Opaque per-browser id used only to collapse repeat views. */
  @Column({ name: "visitor_id", type: "varchar", length: 64, nullable: true })
  visitorId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
