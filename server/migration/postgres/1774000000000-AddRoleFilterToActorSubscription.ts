import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleFilterToActorSubscription1774000000000 implements MigrationInterface {
  name = 'AddRoleFilterToActorSubscription1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actor_subscription" ADD "roleFilter" varchar NOT NULL DEFAULT 'any'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actor_subscription" DROP COLUMN "roleFilter"`
    );
  }
}
