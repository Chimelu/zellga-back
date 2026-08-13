import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAffiliates1786600000000 implements MigrationInterface {
    name = 'AddAffiliates1786600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users gain an optional email (affiliates log in with it), a role, and
        // payout details. Existing rows keep phone-only login: email stays NULL
        // and role defaults to 'seller'.
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(160)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(20) NOT NULL DEFAULT 'seller'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bank_name" character varying(120)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bank_account_number" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bank_account_name" character varying(120)`);
        // Partial unique index so many sellers can share a NULL email.
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email_unique" ON "users" ("email") WHERE "email" IS NOT NULL`);

        await queryRunner.query(`ALTER TABLE "stores" ADD "affiliate_commission_percent" numeric(5,2) NOT NULL DEFAULT '0'`);

        await queryRunner.query(`ALTER TABLE "orders" ADD "affiliate_id" uuid`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "commission_amount" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_affiliate_id" ON "orders" ("affiliate_id") `);

        await queryRunner.query(`CREATE TABLE "affiliates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "store_id" uuid NOT NULL, "user_id" uuid NOT NULL, "ref_code" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'active', "commission_percent" numeric(5,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_affiliate_store_user" UNIQUE ("store_id", "user_id"), CONSTRAINT "PK_affiliates_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_affiliates_ref_code" ON "affiliates" ("ref_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_affiliates_store_id" ON "affiliates" ("store_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_affiliates_user_id" ON "affiliates" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_affiliates_status" ON "affiliates" ("status") `);

        await queryRunner.query(`CREATE TABLE "affiliate_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "store_id" uuid NOT NULL, "email" character varying(160) NOT NULL, "token" character varying(64) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "commission_percent" numeric(5,2) NOT NULL DEFAULT '0', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_affiliate_invites_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_affiliate_invites_token" ON "affiliate_invites" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_affiliate_invites_store_id" ON "affiliate_invites" ("store_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_affiliate_invites_email" ON "affiliate_invites" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_affiliate_invites_status" ON "affiliate_invites" ("status") `);

        await queryRunner.query(`ALTER TABLE "affiliates" ADD CONSTRAINT "FK_affiliates_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "affiliates" ADD CONSTRAINT "FK_affiliates_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "affiliate_invites" ADD CONSTRAINT "FK_affiliate_invites_store_id" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // Orders keep their affiliate reference as SET NULL: deleting an
        // affiliate must not delete the store's order history.
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_affiliate_id" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_affiliate_id"`);
        await queryRunner.query(`ALTER TABLE "affiliate_invites" DROP CONSTRAINT "FK_affiliate_invites_store_id"`);
        await queryRunner.query(`ALTER TABLE "affiliates" DROP CONSTRAINT "FK_affiliates_user_id"`);
        await queryRunner.query(`ALTER TABLE "affiliates" DROP CONSTRAINT "FK_affiliates_store_id"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_affiliate_invites_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_affiliate_invites_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_affiliate_invites_store_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_affiliate_invites_token"`);
        await queryRunner.query(`DROP TABLE "affiliate_invites"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_affiliates_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_affiliates_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_affiliates_store_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_affiliates_ref_code"`);
        await queryRunner.query(`DROP TABLE "affiliates"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_orders_affiliate_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "commission_amount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "affiliate_id"`);

        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "affiliate_commission_percent"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_users_email_unique"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bank_account_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bank_account_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bank_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    }

}
