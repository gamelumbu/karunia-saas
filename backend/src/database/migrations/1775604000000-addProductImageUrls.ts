import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductImageUrls1775604000000 implements MigrationInterface {
  name = 'AddProductImageUrls1775604000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "commerce_product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "url" character varying(500) NOT NULL, "filename" character varying(255), "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_product_images" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commerce_product_images_product_sort" ON "commerce_product_images" ("product_id", "sort_order")`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_product_images" ADD CONSTRAINT "FK_commerce_product_images_product" FOREIGN KEY ("product_id") REFERENCES "commerce_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "commerce_product_images" ("product_id", "url", "filename", "sort_order") SELECT "id", "image_url", regexp_replace("image_url", '^.*/', ''), 0 FROM "commerce_products" WHERE "image_url" IS NOT NULL AND "image_url" <> ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commerce_product_images" DROP CONSTRAINT "FK_commerce_product_images_product"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_commerce_product_images_product_sort"`,
    );
    await queryRunner.query(`DROP TABLE "commerce_product_images"`);
  }
}
