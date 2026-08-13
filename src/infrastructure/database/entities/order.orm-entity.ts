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

export type OrderItem = {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
};

@Entity({ name: "orders" })
export class OrderOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Short human-readable code shown to buyers and admins. */
  @Index({ unique: true })
  @Column({ type: "varchar", length: 16 })
  reference!: string;

  @Index()
  @Column({ name: "store_id", type: "uuid" })
  storeId!: string;

  @ManyToOne(() => StoreOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "store_id" })
  store!: StoreOrmEntity;

  @Column({ name: "buyer_name", type: "varchar", length: 120 })
  buyerName!: string;

  @Column({ name: "buyer_phone", type: "varchar", length: 20 })
  buyerPhone!: string;

  @Column({ type: "jsonb", default: [] })
  items!: OrderItem[];

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  total!: string;

  @Column({ type: "varchar", length: 20, default: "whatsapp" })
  channel!: "whatsapp" | "platform";

  @Index()
  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: "pending" | "paid" | "fulfilled" | "cancelled";

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
