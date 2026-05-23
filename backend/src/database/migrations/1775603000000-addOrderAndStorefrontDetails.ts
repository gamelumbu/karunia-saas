import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderAndStorefrontDetails1775603000000
  implements MigrationInterface
{
  name = 'AddOrderAndStorefrontDetails1775603000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" ADD "shipping_province" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" ADD "shipping_city" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" ADD "shipping_district" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" ADD "shipping_postal_code" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" ADD "shipping_method" character varying(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" ADD "payment_method" character varying(80)`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_tenants" ADD "storefront_logo_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_tenants" ADD "storefront_banner_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_tenants" ADD "storefront_tagline" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "master_tenants" DROP COLUMN "storefront_tagline"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_tenants" DROP COLUMN "storefront_banner_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_tenants" DROP COLUMN "storefront_logo_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" DROP COLUMN "payment_method"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" DROP COLUMN "shipping_method"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" DROP COLUMN "shipping_postal_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" DROP COLUMN "shipping_district"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" DROP COLUMN "shipping_city"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commerce_orders" DROP COLUMN "shipping_province"`,
    );
  }
}
