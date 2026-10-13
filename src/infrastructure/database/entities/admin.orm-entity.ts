import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * Admin console operator. Kept apart from `users` so console accounts never
 * show up in the seller list the console itself manages.
 */
@Entity({ name: "admins" })
export class AdminOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 160 })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  /**
   * Demo operators are served generated data by every admin route and never
   * touch real users or orders — safe to hand out for walkthroughs.
   */
  @Column({ name: "is_demo", type: "boolean", default: false })
  isDemo!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
