import bcrypt from "bcryptjs";

type Query = (sql: string, params?: unknown[]) => Promise<unknown>;

/** The console's starting accounts. `info@` is the demo login. */
const DEFAULT_ADMINS = [
  { email: "admin@zellga.com", password: "Admin@123", isDemo: false },
  { email: "info@zellga.com", password: "Admin@123", isDemo: true },
];

/**
 * Inserts any default admin that does not exist yet. Existing rows are left
 * alone, so a password changed after seeding is never reset by a re-run.
 */
export async function seedDefaultAdmins(query: Query): Promise<void> {
  for (const admin of DEFAULT_ADMINS) {
    const hash = await bcrypt.hash(admin.password, 10);
    await query(
      `INSERT INTO "admins" ("email", "password_hash", "is_demo")
       VALUES ($1, $2, $3)
       ON CONFLICT ("email") DO NOTHING`,
      [admin.email, hash, admin.isDemo]
    );
  }
}
