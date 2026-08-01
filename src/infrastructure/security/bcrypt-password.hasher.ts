import bcrypt from "bcryptjs";
import type { PasswordHasher } from "../../core/services/password-hasher";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds = 10;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
