import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertProductImageUrlsToTable1775605000000 implements MigrationInterface {
  name = 'ConvertProductImageUrlsToTable1775605000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "commerce_product_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "url" character varying(500) NOT NULL, "filename" character varying(255), "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_commerce_product_images" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_commerce_product_images_product_sort" ON "commerce_product_images" ("product_id", "sort_order")`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_commerce_product_images_product') THEN ALTER TABLE "commerce_product_images" ADD CONSTRAINT "FK_commerce_product_images_product" FOREIGN KEY ("product_id") REFERENCES "commerce_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
    );
    await queryRunner.query(
      `INSERT INTO "commerce_product_images" ("product_id", "url", "filename", "sort_order") SELECT "id", "image_url", regexp_replace("image_url", '^.*/', ''), 0 FROM "commerce_products" product WHERE "image_url" IS NOT NULL AND "image_url" <> '' AND NOT EXISTS (SELECT 1 FROM "commerce_product_images" image WHERE image."product_id" = product."id" AND image."url" = product."image_url")`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commerce_products' AND column_name = 'image_urls') THEN INSERT INTO "commerce_product_images" ("product_id", "url", "filename", "sort_order") SELECT product."id", image_url.value, regexp_replace(image_url.value, '^.*/', ''), image_url.ordinality - 1 FROM "commerce_products" product CROSS JOIN LATERAL jsonb_array_elements_text(product."image_urls") WITH ORDINALITY AS image_url(value, ordinality) WHERE image_url.value <> '' AND NOT EXISTS (SELECT 1 FROM "commerce_product_images" image WHERE image."product_id" = product."id" AND image."url" = image_url.value); ALTER TABLE "commerce_products" DROP COLUMN "image_urls"; END IF; END $$`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commerce_products" ADD COLUMN IF NOT EXISTS "image_urls" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `UPDATE "commerce_products" product SET "image_urls" = COALESCE((SELECT jsonb_agg(image."url" ORDER BY image."sort_order") FROM "commerce_product_images" image WHERE image."product_id" = product."id"), '[]'::jsonb)`,
    );
  }
}
