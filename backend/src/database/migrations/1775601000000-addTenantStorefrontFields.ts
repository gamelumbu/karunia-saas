import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantStorefrontFields1775601000000
  implements MigrationInterface
{
  name = 'AddTenantStorefrontFields1775601000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "master_tenants" ADD "storefront_template" character varying(40) NOT NULL DEFAULT 'market'`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_tenants" ADD "storefront_accent_color" character varying(20) NOT NULL DEFAULT '#0891b2'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_master_tenants_domain_unique" ON "master_tenants" ("domain") WHERE "domain" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_master_tenants_domain_unique"`);
    await queryRunner.query(
      `ALTER TABLE "master_tenants" DROP COLUMN "storefront_accent_color"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_tenants" DROP COLUMN "storefront_template"`,
    );
  }
}
