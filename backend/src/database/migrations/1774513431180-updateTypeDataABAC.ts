import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTypeDataABAC1774513431180 implements MigrationInterface {
    name = 'UpdateTypeDataABAC1774513431180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "master_permissions" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "master_policies" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "master_policies" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_policies" DROP COLUMN "resource"`);
        await queryRunner.query(`ALTER TABLE "master_policies" ADD "resource" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_policies" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "master_policies" ADD "action" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_permissions" DROP COLUMN "resource"`);
        await queryRunner.query(`ALTER TABLE "master_permissions" ADD "resource" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_permissions" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "master_permissions" ADD "action" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_roles" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "master_roles" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_roles" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "master_roles" ADD "description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "master_roles" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "master_roles" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "master_roles" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "master_roles" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_permissions" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "master_permissions" ADD "action" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_permissions" DROP COLUMN "resource"`);
        await queryRunner.query(`ALTER TABLE "master_permissions" ADD "resource" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_policies" DROP COLUMN "action"`);
        await queryRunner.query(`ALTER TABLE "master_policies" ADD "action" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_policies" DROP COLUMN "resource"`);
        await queryRunner.query(`ALTER TABLE "master_policies" ADD "resource" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "master_policies" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "master_policies" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "master_permissions" DROP COLUMN "description"`);
    }

}
