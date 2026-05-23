import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommerceTables1775600000000 implements MigrationInterface {
  name = 'CreateCommerceTables1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "commerce_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "sku" character varying(100), "price" numeric(14,2) NOT NULL DEFAULT '0', "stock" integer NOT NULL DEFAULT '0', "image_url" character varying(500), "active_status" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_commerce_products_tenant_slug" UNIQUE ("tenant_id", "slug"), CONSTRAINT "PK_commerce_products" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commerce_products_tenant" ON "commerce_products" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "commerce_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "order_number" character varying(40) NOT NULL, "customer_name" character varying(255) NOT NULL, "customer_email" character varying(255) NOT NULL, "customer_phone" character varying(40), "shipping_address" text NOT NULL, "total_amount" numeric(14,2) NOT NULL DEFAULT '0', "status" character varying(40) NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_commerce_orders_number" UNIQUE ("order_number"), CONSTRAINT "PK_commerce_orders" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commerce_orders_tenant" ON "commerce_orders" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "commerce_order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "product_name" character varying(255) NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(14,2) NOT NULL, "subtotal" numeric(14,2) NOT NULL, CONSTRAINT "PK_commerce_order_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_products" ADD CONSTRAINT "FK_commerce_products_tenant" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" ADD CONSTRAINT "FK_commerce_orders_tenant" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_order_items" ADD CONSTRAINT "FK_commerce_order_items_order" FOREIGN KEY ("order_id") REFERENCES "commerce_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_order_items" ADD CONSTRAINT "FK_commerce_order_items_product" FOREIGN KEY ("product_id") REFERENCES "commerce_products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commerce_order_items" DROP CONSTRAINT "FK_commerce_order_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_order_items" DROP CONSTRAINT "FK_commerce_order_items_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" DROP CONSTRAINT "FK_commerce_orders_tenant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_products" DROP CONSTRAINT "FK_commerce_products_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "commerce_order_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_commerce_orders_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "commerce_orders"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_commerce_products_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "commerce_products"`);
  }
}
