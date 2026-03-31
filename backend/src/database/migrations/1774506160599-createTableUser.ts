import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableUser1774506160599 implements MigrationInterface {
    name = 'CreateTableUser1774506160599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "master_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "active_status" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_dc0d9d4208aa65d35221288eeaa" UNIQUE ("username"), CONSTRAINT "UQ_e54f163f206939ba0a65fd6920a" UNIQUE ("email"), CONSTRAINT "PK_433af2c3a4b1d44f0e7e86ae994" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "master_users"`);
    }

}
