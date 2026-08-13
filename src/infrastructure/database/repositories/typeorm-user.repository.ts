import { Repository } from "typeorm";
import { User } from "../../../core/models/user.model";
import type { UserRepository } from "../../../core/repositories/user.repository";
import { AppDataSource } from "../data-source";
import { UserOrmEntity } from "../entities/user.orm-entity";

function toDomain(row: UserOrmEntity): User {
  return new User({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    role: row.role,
    passwordHash: row.passwordHash,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(user: User): UserOrmEntity {
  const row = new UserOrmEntity();
  row.id = user.id;
  row.name = user.name;
  row.phone = user.phone;
  row.email = user.email;
  row.role = user.role;
  row.passwordHash = user.passwordHash;
  row.bankName = user.bankName;
  row.bankAccountNumber = user.bankAccountNumber;
  row.bankAccountName = user.bankAccountName;
  row.createdAt = user.createdAt;
  row.updatedAt = user.updatedAt;
  return row;
}

export class TypeOrmUserRepository implements UserRepository {
  private readonly repo: Repository<UserOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserOrmEntity);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { phone } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async save(user: User): Promise<User> {
    const saved = await this.repo.save(toOrm(user));
    return toDomain(saved);
  }
}
