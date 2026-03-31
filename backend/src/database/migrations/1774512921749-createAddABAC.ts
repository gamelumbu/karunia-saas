import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAddABAC1774512921749 implements MigrationInterface {
    name = 'CreateAddABAC1774512921749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "master_policies" ADD "tenant_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_policies" ADD CONSTRAINT "FK_db52449e1a2bc2e23a74e89d8cd" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "master_policies" DROP CONSTRAINT "FK_db52449e1a2bc2e23a74e89d8cd"`);
        await queryRunner.query(`ALTER TABLE "master_policies" DROP COLUMN "tenant_id"`);
    }

}
