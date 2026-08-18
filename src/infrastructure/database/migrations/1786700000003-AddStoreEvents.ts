import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStoreEvents1786700000003 implements MigrationInterface {
    name = 'AddStoreEvents1786700000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Raw events rather than counters: a counter can only answer "how many
        // in total", while the dashboard asks for arbitrary date windows.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "store_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "store_id" uuid NOT NULL,
                "product_id" uuid,
                "type" character varying(20) NOT NULL,
                "visitor_id" character varying(64),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_store_events_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_store_events_store_created" ON "store_events" ("store_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_store_events_store_type_created" ON "store_events" ("store_id", "type", "created_at") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_store_events_product_id" ON "store_events" ("product_id") `);

        // Deleting a store removes its analytics; deleting a product keeps the
        // click history but forgets which product it pointed at.
        await queryRunner.query(`ALTER TABLE "store_events" ADD CONSTRAINT "FK_store_events_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_events" ADD CONSTRAINT "FK_store_events_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "store_events" DROP CONSTRAINT "FK_store_events_product_id"`);
        await queryRunner.query(`ALTER TABLE "store_events" DROP CONSTRAINT "FK_store_events_store_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_store_events_product_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_store_events_store_type_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_store_events_store_created"`);
        await queryRunner.query(`DROP TABLE "store_events"`);
    }

}
