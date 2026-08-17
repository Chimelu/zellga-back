import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderWorkflow1786700000001 implements MigrationInterface {
    name = 'AddOrderWorkflow1786700000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── Per-store order numbers ──────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "orders" ADD "order_number" integer NOT NULL DEFAULT 0`);

        // Backfill by age so each store's earliest order becomes 1001.
        await queryRunner.query(`
            UPDATE "orders" AS o
               SET "order_number" = numbered.seq
              FROM (
                    SELECT "id",
                           1000 + ROW_NUMBER() OVER (
                               PARTITION BY "store_id" ORDER BY "created_at", "id"
                           ) AS seq
                      FROM "orders"
                   ) AS numbered
             WHERE o."id" = numbered."id"
        `);
        await queryRunner.query(`UPDATE "orders" SET "reference" = 'ZLG-' || "order_number"`);

        // References are unique per store now — two stores each have a #1001.
        await queryRunner.query(`DROP INDEX "public"."IDX_14ea6251b9edf64025257e7475"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_orders_store_reference" ON "orders" ("store_id", "reference") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_orders_store_number" ON "orders" ("store_id", "order_number") `);

        // ── Fulfilment workflow ──────────────────────────────────────────
        // Fulfilment and payment are separate axes now, so the old 'paid'
        // status maps to 'confirmed' — the money side was already backfilled
        // into payment_status by AddOrderPayments.
        await queryRunner.query(`UPDATE "orders" SET "status" = 'new' WHERE "status" = 'pending'`);
        await queryRunner.query(`UPDATE "orders" SET "status" = 'confirmed' WHERE "status" = 'paid'`);
        await queryRunner.query(`UPDATE "orders" SET "status" = 'completed' WHERE "status" = 'fulfilled'`);
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'new'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`UPDATE "orders" SET "status" = 'fulfilled' WHERE "status" = 'completed'`);
        await queryRunner.query(`UPDATE "orders" SET "status" = 'paid' WHERE "status" = 'confirmed'`);
        // 'contacted' and 'processing' have no pre-workflow equivalent; they
        // collapse back to 'pending' along with 'new'.
        await queryRunner.query(`UPDATE "orders" SET "status" = 'pending' WHERE "status" IN ('new', 'contacted', 'processing')`);

        await queryRunner.query(`DROP INDEX "public"."IDX_orders_store_number"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_store_reference"`);

        // Restore globally-unique references built from the order id.
        await queryRunner.query(`UPDATE "orders" SET "reference" = 'ZG-' || UPPER(SUBSTRING(REPLACE("id"::text, '-', ''), 1, 6))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_14ea6251b9edf64025257e7475" ON "orders" ("reference") `);

        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "order_number"`);
    }

}
