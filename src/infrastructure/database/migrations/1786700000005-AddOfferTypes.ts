import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOfferTypes1786700000005 implements MigrationInterface {
    name = 'AddOfferTypes1786700000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Existing rows are all physical goods — that is what the catalogue
        // could express before this, so the default backfills them correctly.
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_type" character varying(20) NOT NULL DEFAULT 'physical'`);
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subtype" character varying(40)`);
        // One document rather than a column per type: the shape follows
        // offer_type, so separate columns would be null on almost every row.
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "details" jsonb NOT NULL DEFAULT '{}'::jsonb`);

        // The storefront and dashboard both filter a store's catalogue by type.
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_store_offer_type" ON "products" ("store_id", "offer_type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_products_store_offer_type"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "details"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "subtype"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "offer_type"`);
    }

}
