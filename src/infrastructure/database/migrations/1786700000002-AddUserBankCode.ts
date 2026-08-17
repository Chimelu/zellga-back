import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBankCode1786700000002 implements MigrationInterface {
    name = 'AddUserBankCode1786700000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Payout transfers are keyed on the bank's code, not its display name.
        // Nullable: accounts saved before bank selection existed keep working,
        // and the seller supplies it next time they edit their payout details.
        //
        // IF NOT EXISTS because `synchronize` is on in development and may have
        // already added the column — the migration still has to be recorded so
        // production, which never syncs, applies it exactly once.
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bank_code" character varying(10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bank_code"`);
    }

}
