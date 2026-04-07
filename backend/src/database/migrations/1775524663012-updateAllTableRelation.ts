import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAllTableRelation1775524663012 implements MigrationInterface {
    name = 'UpdateAllTableRelation1775524663012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "master_users" DROP CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7e36645ec59b595f0419c8b99"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f358a68c439334ed8f11bbb584"`);
        await queryRunner.query(`CREATE TABLE "membership" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "role_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_83c1afebef3059472e7c37e8de8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "master_users" DROP COLUMN "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "membership" ADD CONSTRAINT "FK_e9c72e8d29784031c96f5c6af8d" FOREIGN KEY ("user_id") REFERENCES "master_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membership" ADD CONSTRAINT "FK_ccc7d9df9ca83f3a0cbc4686086" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "membership" ADD CONSTRAINT "FK_4e57152f7d33b9804afb088fc5b" FOREIGN KEY ("role_id") REFERENCES "master_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "membership" DROP CONSTRAINT "FK_4e57152f7d33b9804afb088fc5b"`);
        await queryRunner.query(`ALTER TABLE "membership" DROP CONSTRAINT "FK_ccc7d9df9ca83f3a0cbc4686086"`);
        await queryRunner.query(`ALTER TABLE "membership" DROP CONSTRAINT "FK_e9c72e8d29784031c96f5c6af8d"`);
        await queryRunner.query(`ALTER TABLE "master_users" ADD "tenant_id" uuid NOT NULL`);
        await queryRunner.query(`DROP TABLE "membership"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f358a68c439334ed8f11bbb584" ON "master_users" ("email", "tenant_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f7e36645ec59b595f0419c8b99" ON "master_users" ("username", "tenant_id") `);
        await queryRunner.query(`ALTER TABLE "master_users" ADD CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
