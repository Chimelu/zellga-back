import "reflect-metadata";
import { connectDatabase } from "../infrastructure/database/data-source";
import { seedDefaultAdmins } from "../infrastructure/database/seeds/default-admins";

/**
 * `npm run seed:admins` — creates the default console accounts. Development
 * builds the `admins` table through `synchronize`, so this is the local
 * counterpart of the seeding step inside the AddAdmins migration.
 */
async function main() {
  const ds = await connectDatabase();
  await seedDefaultAdmins((sql, params) => ds.query(sql, params));
  console.log("Default admins seeded");
  await ds.destroy();
}

main().catch((err) => {
  console.error("Failed to seed admins:", err);
  process.exit(1);
});
