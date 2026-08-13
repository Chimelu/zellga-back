import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrders1786478767622 implements MigrationInterface {
    name = 'AddOrders1786478767622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reference" character varying(16) NOT NULL, "store_id" uuid NOT NULL, "buyer_name" character varying(120) NOT NULL, "buyer_phone" character varying(20) NOT NULL, "items" jsonb NOT NULL DEFAULT '[]', "total" numeric(12,2) NOT NULL DEFAULT '0', "channel" character varying(20) NOT NULL DEFAULT 'whatsapp', "status" character varying(20) NOT NULL DEFAULT 'pending', "note" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_14ea6251b9edf64025257e7475" ON "orders" ("reference") `);
        await queryRunner.query(`CREATE INDEX "IDX_b7a7bb813431fc7cd73cced000" ON "orders" ("store_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") `);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_b7a7bb813431fc7cd73cced0001" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_b7a7bb813431fc7cd73cced0001"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b7a7bb813431fc7cd73cced000"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_14ea6251b9edf64025257e7475"`);
        await queryRunner.query(`DROP TABLE "orders"`);
    }

}
