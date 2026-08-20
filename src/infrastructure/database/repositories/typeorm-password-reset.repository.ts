import { IsNull, MoreThanOrEqual, Repository } from "typeorm";
import { PasswordReset } from "../../../core/models/password-reset.model";
import type { PasswordResetRepository } from "../../../core/repositories/password-reset.repository";
import { AppDataSource } from "../data-source";
import { PasswordResetOrmEntity } from "../entities/password-reset.orm-entity";

function toDomain(row: PasswordResetOrmEntity): PasswordReset {
  return new PasswordReset({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(reset: PasswordReset): PasswordResetOrmEntity {
  const row = new PasswordResetOrmEntity();
  row.id = reset.id;
  row.userId = reset.userId;
  row.tokenHash = reset.tokenHash;
  row.expiresAt = reset.expiresAt;
  row.usedAt = reset.usedAt;
  row.createdAt = reset.createdAt;
  row.updatedAt = reset.updatedAt;
  return row;
}

export class TypeOrmPasswordResetRepository implements PasswordResetRepository {
  private readonly repo: Repository<PasswordResetOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(PasswordResetOrmEntity);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordReset | null> {
    const row = await this.repo.findOne({ where: { tokenHash } });
    return row ? toDomain(row) : null;
  }

  async save(reset: PasswordReset): Promise<PasswordReset> {
    const saved = await this.repo.save(toOrm(reset));
    return toDomain(saved);
  }

  async invalidateAllForUser(userId: string, at: Date): Promise<void> {
    await this.repo.update({ userId, usedAt: IsNull() }, { usedAt: at });
  }

  async countCreatedSince(userId: string, since: Date): Promise<number> {
    return this.repo.count({
      where: { userId, createdAt: MoreThanOrEqual(since) },
    });
  }
}
