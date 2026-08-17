import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
} from "typeorm";
import { StoreOrmEntity } from "./store.orm-entity";

@Entity({ name: "users" })
export class UserOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 20 })
  phone!: string;

  /**
   * Sellers sign up with a phone number only, so this stays null for them.
   * Affiliates arrive through an emailed invite and log in with this instead.
   */
  @Index({ unique: true, where: "email IS NOT NULL" })
  @Column({ type: "varchar", length: 160, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 20, default: "seller" })
  role!: "seller" | "affiliate";

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  /** Payout destination. Sellers are paid out here; affiliates are paid commission. */
  @Column({ name: "bank_name", type: "varchar", length: 120, nullable: true })
  bankName!: string | null;

  /** Paystack bank code, stored alongside the name so payouts can be made. */
  @Column({ name: "bank_code", type: "varchar", length: 10, nullable: true })
  bankCode!: string | null;

  @Column({
    name: "bank_account_number",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  bankAccountNumber!: string | null;

  @Column({
    name: "bank_account_name",
    type: "varchar",
    length: 120,
    nullable: true,
  })
  bankAccountName!: string | null;

  @OneToOne(() => StoreOrmEntity, (store) => store.owner)
  store?: StoreOrmEntity;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
