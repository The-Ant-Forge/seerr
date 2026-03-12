import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActorSubscriptions1773275799528 implements MigrationInterface {
  name = 'AddActorSubscriptions1773275799528';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "actor_subscription" (
        "id" SERIAL PRIMARY KEY,
        "personId" integer NOT NULL,
        "personName" varchar NOT NULL,
        "profilePath" varchar,
        "mediaFilter" varchar NOT NULL DEFAULT 'all',
        "creditType" varchar NOT NULL DEFAULT 'cast',
        "minVoteCount" integer NOT NULL DEFAULT 0,
        "action" varchar NOT NULL DEFAULT 'request',
        "knownCreditIds" text NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastSyncedAt" TIMESTAMP,
        "subscribedById" integer,
        CONSTRAINT "UNIQUE_ACTOR_SUB" UNIQUE ("personId", "subscribedById"),
        CONSTRAINT "FK_actor_sub_user" FOREIGN KEY ("subscribedById") REFERENCES "user" ("id") ON DELETE CASCADE
      )`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actor_sub_personId" ON "actor_subscription" ("personId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actor_sub_subscribedById" ON "actor_subscription" ("subscribedById")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_actor_sub_subscribedById"`);
    await queryRunner.query(`DROP INDEX "IDX_actor_sub_personId"`);
    await queryRunner.query(`DROP TABLE "actor_subscription"`);
  }
}
