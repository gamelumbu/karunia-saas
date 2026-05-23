import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategoryAndRelated1775602000000
  implements MigrationInterface
{
  name = 'AddProductCategoryAndRelated1775602000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commerce_products" ADD "category" character varying(40) NOT NULL DEFAULT 'product'`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_products" ADD "related_product_ids" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commerce_products_tenant_category" ON "commerce_products" ("tenant_id", "category")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_commerce_products_tenant_category"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_products" DROP COLUMN "related_product_ids"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_products" DROP COLUMN "category"`,
    );
  }
}
