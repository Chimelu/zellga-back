import { UnauthorizedError } from "../../../core/errors/app.error";
import type { AdminAccountRepository } from "../../../core/repositories/admin-account.repository";
import type { PasswordHasher } from "../../../core/services/password-hasher";
import type { AdminTokenService } from "../../../core/services/token.service";
import type { AdminLoginDto } from "../dto/admin.dto";

export type AdminSession = {
  token: string;
  admin: { id: string; email: string; demo: boolean };
};

export class AdminAuthService {
  constructor(
    private readonly accounts: AdminAccountRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: AdminTokenService
  ) {}

  async login(dto: AdminLoginDto): Promise<AdminSession> {
    const account = await this.accounts.findByEmail(dto.email);
    // Same message either way, so the form cannot be used to probe emails.
    const valid =
      account && (await this.hasher.compare(dto.password, account.passwordHash));
    if (!account || !valid) {
      throw new UnauthorizedError("Incorrect email or password");
    }

    const admin = { id: account.id, email: account.email, demo: account.isDemo };
    const token = this.tokens.sign({
      sub: admin.id,
      email: admin.email,
      demo: admin.demo,
    });
    return { token, admin };
  }

  async me(id: string): Promise<AdminSession["admin"]> {
    const account = await this.accounts.findById(id);
    if (!account) throw new UnauthorizedError("Admin account no longer exists");
    return { id: account.id, email: account.email, demo: account.isDemo };
  }
}
