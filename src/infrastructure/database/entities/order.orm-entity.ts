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
import type { OrderStatus, PaymentStatus } from "../../../core/models/order.model";

export type OrderItem = {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
};

@Entity({ name: "orders" })
// Both identifiers are unique within a store, not across the platform.
@Index("IDX_orders_store_reference", ["storeId", "reference"], { unique: true })
@Index("IDX_orders_store_number", ["storeId", "orderNumber"], { unique: true })
export class OrderOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Per-store counter starting at 1001. Sellers count their own orders, so
   * two stores each have a #1001 — uniqueness is per store, not global.
   */
  @Column({ name: "order_number", type: "integer", default: 0 })
  orderNumber!: number;

  /** Human-readable code shown to buyers and sellers, e.g. `ZLG-1024`. */
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

  /** Required for card checkout — Paystack sends the receipt here. */
  @Column({ name: "buyer_email", type: "varchar", length: 160, nullable: true })
  buyerEmail!: string | null;

  @Column({ type: "jsonb", default: [] })
  items!: OrderItem[];

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  total!: string;

  @Column({ type: "varchar", length: 20, default: "whatsapp" })
  channel!: "whatsapp" | "platform";

  @Index()
  @Column({ type: "varchar", length: 20, default: "new" })
  status!: OrderStatus;

  @Column({ type: "text", nullable: true })
  note!: string | null;

  /**
   * Affiliate credited with this order, resolved from the `ref` code on the
   * store link the buyer arrived through. Null for direct orders.
   */
  @Index()
  @Column({ name: "affiliate_id", type: "uuid", nullable: true })
  affiliateId!: string | null;

  /**
   * Commission owed on this order, frozen at creation time from the rate then
   * in force. Recomputing later would silently restate what was earned.
   */
  @Column({
    name: "commission_amount",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  commissionAmount!: string;

  /**
   * What the money did, tracked apart from `status` (where the seller is with
   * the order). WhatsApp orders stay `unpaid` — they settle off-platform.
   */
  @Index()
  @Column({
    name: "payment_status",
    type: "varchar",
    length: 20,
    default: "unpaid",
  })
  paymentStatus!: PaymentStatus;

  @Column({
    name: "payment_provider",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  paymentProvider!: string | null;

  /**
   * Reference handed to the provider. Unique because a provider looks a
   * transaction up by it; null until a payment is actually started.
   */
  @Index({ unique: true })
  @Column({
    name: "payment_reference",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  paymentReference!: string | null;

  /** How it was paid — card, bank transfer, USSD — as the provider reports it. */
  @Column({
    name: "payment_channel",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  paymentChannel!: string | null;

  /**
   * What the provider actually collected. Kept separate from `total` so a
   * short or tampered payment is visible rather than silently accepted.
   */
  @Column({
    name: "amount_paid",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
  })
  amountPaid!: string;

  @Column({ name: "paid_at", type: "timestamptz", nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
