export type AdminAccount = {
  id: string;
  email: string;
  passwordHash: string;
  isDemo: boolean;
};

export interface AdminAccountRepository {
  findByEmail(email: string): Promise<AdminAccount | null>;
  findById(id: string): Promise<AdminAccount | null>;
}
