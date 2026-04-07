import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableSaaS1775526212210 implements MigrationInterface {
    name = 'CreateTableSaaS1775526212210'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "master_roles" ADD "tenant_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_c2d78974c6eb9fd5cfcab7144e" ON "master_roles" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "master_roles" ADD CONSTRAINT "FK_c2d78974c6eb9fd5cfcab7144ec" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "master_roles" DROP CONSTRAINT "FK_c2d78974c6eb9fd5cfcab7144ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c2d78974c6eb9fd5cfcab7144e"`);
        await queryRunner.query(`ALTER TABLE "master_roles" DROP COLUMN "tenant_id"`);
    }

}
