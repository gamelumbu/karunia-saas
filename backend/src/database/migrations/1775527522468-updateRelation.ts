import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRelation1775527522468 implements MigrationInterface {
    name = 'UpdateRelation1775527522468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_e9c72e8d29784031c96f5c6af8" ON "membership" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ccc7d9df9ca83f3a0cbc468608" ON "membership" ("tenant_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ccc7d9df9ca83f3a0cbc468608"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9c72e8d29784031c96f5c6af8"`);
    }

}
