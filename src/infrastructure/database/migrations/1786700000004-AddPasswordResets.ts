import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResets1786700000004 implements MigrationInterface {
    name = 'AddPasswordResets1786700000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Only the SHA-256 of the emailed secret is stored, so a dump of this
        // table cannot be turned into working reset links.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "password_resets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "token_hash" character varying(64) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "used_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_password_resets_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_password_resets_token_hash" ON "password_resets" ("token_hash") `);
        // Covers both "burn the user's outstanding links" and the request throttle.
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_password_resets_user_created" ON "password_resets" ("user_id", "created_at") `);

        await queryRunner.query(`ALTER TABLE "password_resets" ADD CONSTRAINT "FK_password_resets_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_resets" DROP CONSTRAINT "FK_password_resets_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_password_resets_user_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_password_resets_token_hash"`);
        await queryRunner.query(`DROP TABLE "password_resets"`);
    }

}
