import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleFilterToActorSubscription1774000000000 implements MigrationInterface {
  name = 'AddRoleFilterToActorSubscription1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actor_subscription" ADD "roleFilter" varchar NOT NULL DEFAULT ('any')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite doesn't support DROP COLUMN before 3.35.0, so recreate the table
    await queryRunner.query(
      `CREATE TABLE "temporary_actor_subscription" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "personId" integer NOT NULL,
        "personName" varchar NOT NULL,
        "profilePath" varchar,
        "mediaFilter" varchar NOT NULL DEFAULT ('all'),
        "creditType" varchar NOT NULL DEFAULT ('cast'),
        "minImdbRating" float NOT NULL DEFAULT (0),
        "action" varchar NOT NULL DEFAULT ('request'),
        "knownCreditIds" text NOT NULL DEFAULT ('[]'),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        "lastSyncedAt" datetime,
        "subscribedById" integer,
        CONSTRAINT "UNIQUE_ACTOR_SUB" UNIQUE ("personId", "subscribedById"),
        CONSTRAINT "FK_actor_sub_user" FOREIGN KEY ("subscribedById") REFERENCES "user" ("id") ON DELETE CASCADE
      )`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_actor_subscription" SELECT "id", "personId", "personName", "profilePath", "mediaFilter", "creditType", "minImdbRating", "action", "knownCreditIds", "createdAt", "updatedAt", "lastSyncedAt", "subscribedById" FROM "actor_subscription"`
    );
    await queryRunner.query(`DROP TABLE "actor_subscription"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_actor_subscription" RENAME TO "actor_subscription"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actor_sub_personId" ON "actor_subscription" ("personId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_actor_sub_subscribedById" ON "actor_subscription" ("subscribedById")`
    );
  }
}
