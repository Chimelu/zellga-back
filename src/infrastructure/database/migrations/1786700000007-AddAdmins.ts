import { MigrationInterface, QueryRunner } from "typeorm";
import { seedDefaultAdmins } from "../seeds/default-admins";

export class AddAdmins1786700000007 implements MigrationInterface {
    name = 'AddAdmins1786700000007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "admins" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(160) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "is_demo" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_admins_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_admins_email" ON "admins" ("email") `);

        await seedDefaultAdmins((sql, params) => queryRunner.query(sql, params));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_admins_email"`);
        await queryRunner.query(`DROP TABLE "admins"`);
    }

}
