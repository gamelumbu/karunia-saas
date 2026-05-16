import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumnRelation1775008782983 implements MigrationInterface {
  name = 'UpdateColumnRelation1775008782983';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_roles" DROP CONSTRAINT "FK_c2d78974c6eb9fd5cfcab7144ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" DROP CONSTRAINT "FK_db52449e1a2bc2e23a74e89d8cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP CONSTRAINT "UQ_dc0d9d4208aa65d35221288eeaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP CONSTRAINT "UQ_e54f163f206939ba0a65fd6920a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP COLUMN "active_status"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."master_users_active_status_enum" AS ENUM('0', '1')`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD "active_status" "public"."master_users_active_status_enum" NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2d78974c6eb9fd5cfcab7144e" ON "master_roles" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db52449e1a2bc2e23a74e89d8c" ON "master_policies" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f7e36645ec59b595f0419c8b99" ON "master_users" ("tenant_id", "username") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f358a68c439334ed8f11bbb584" ON "master_users" ("tenant_id", "email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23ed6f04fe43066df08379fd03" ON "user_roles" ("user_id", "role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "master_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "master_permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_roles" ADD CONSTRAINT "FK_c2d78974c6eb9fd5cfcab7144ec" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" ADD CONSTRAINT "FK_db52449e1a2bc2e23a74e89d8cd" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "master_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" DROP CONSTRAINT "FK_db52449e1a2bc2e23a74e89d8cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_roles" DROP CONSTRAINT "FK_c2d78974c6eb9fd5cfcab7144ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23ed6f04fe43066df08379fd03"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f358a68c439334ed8f11bbb584"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7e36645ec59b595f0419c8b99"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db52449e1a2bc2e23a74e89d8c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c2d78974c6eb9fd5cfcab7144e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP COLUMN "active_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."master_users_active_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD "active_status" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD CONSTRAINT "UQ_e54f163f206939ba0a65fd6920a" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD CONSTRAINT "UQ_dc0d9d4208aa65d35221288eeaa" UNIQUE ("username")`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "master_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_policies" ADD CONSTRAINT "FK_db52449e1a2bc2e23a74e89d8cd" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_roles" ADD CONSTRAINT "FK_c2d78974c6eb9fd5cfcab7144ec" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "master_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "master_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
