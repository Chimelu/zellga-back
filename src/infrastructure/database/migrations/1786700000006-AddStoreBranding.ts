import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoreBranding1786700000006 implements MigrationInterface {
    name = 'AddStoreBranding1786700000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Storefront branding. Null on existing rows, which the hero already
        // renders as the gradient placeholder it used before these existed.
        await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "logo_url" text`);
        await queryRunner.query(`ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "cover_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "cover_url"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "logo_url"`);
    }

}
