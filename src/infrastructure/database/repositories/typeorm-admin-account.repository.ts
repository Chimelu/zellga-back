import type {
  AdminAccount,
  AdminAccountRepository,
} from "../../../core/repositories/admin-account.repository";
import { AppDataSource } from "../data-source";
import { AdminOrmEntity } from "../entities/admin.orm-entity";

function toAccount(row: AdminOrmEntity): AdminAccount {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    isDemo: row.isDemo,
  };
}

export class TypeOrmAdminAccountRepository implements AdminAccountRepository {
  private get repo() {
    return AppDataSource.getRepository(AdminOrmEntity);
  }

  async findByEmail(email: string): Promise<AdminAccount | null> {
    const row = await this.repo.findOne({ where: { email: email.toLowerCase() } });
    return row ? toAccount(row) : null;
  }

  async findById(id: string): Promise<AdminAccount | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toAccount(row) : null;
  }
}
