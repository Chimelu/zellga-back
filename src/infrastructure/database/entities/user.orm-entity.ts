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

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @OneToOne(() => StoreOrmEntity, (store) => store.owner)
  store?: StoreOrmEntity;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
