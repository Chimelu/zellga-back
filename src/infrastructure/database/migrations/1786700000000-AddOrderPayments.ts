import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderPayments1786700000000 implements MigrationInterface {
    name = 'AddOrderPayments1786700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Card checkout needs a receipt address; WhatsApp orders leave it NULL.
        await queryRunner.query(`ALTER TABLE "orders" ADD "buyer_email" character varying(160)`);

        // Payment state is tracked apart from "status" so fulfilment and money
        // can move independently (a paid order can still be cancelled).
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_status" character varying(20) NOT NULL DEFAULT 'unpaid'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_provider" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_reference" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_channel" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "amount_paid" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "paid_at" TIMESTAMP WITH TIME ZONE`);

        // Partial unique index: every unpaid order has a NULL reference, and
        // NULLs must not collide with each other.
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_orders_payment_reference" ON "orders" ("payment_reference") WHERE "payment_reference" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_payment_status" ON "orders" ("payment_status") `);

        // Orders that already reached paid/fulfilled predate this column, so
        // backfill them rather than reporting settled money as unpaid.
        await queryRunner.query(`UPDATE "orders" SET "payment_status" = 'paid', "amount_paid" = "total", "paid_at" = "updated_at" WHERE "status" IN ('paid', 'fulfilled')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_payment_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_orders_payment_reference"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "paid_at"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "amount_paid"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_channel"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_reference"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_provider"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "payment_status"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "buyer_email"`);
    }

}
