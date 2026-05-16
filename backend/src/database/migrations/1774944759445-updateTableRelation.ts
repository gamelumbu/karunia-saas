import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTableRelation1774944759445 implements MigrationInterface {
  name = 'UpdateTableRelation1774944759445';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ALTER COLUMN "tenant_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "master_users" DROP CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ALTER COLUMN "tenant_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "master_users" ADD CONSTRAINT "FK_d90262dbcc2fad97f3b3daddd47" FOREIGN KEY ("tenant_id") REFERENCES "master_tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
