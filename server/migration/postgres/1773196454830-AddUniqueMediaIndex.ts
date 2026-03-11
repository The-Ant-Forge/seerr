import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueMediaIndex1773196454830 implements MigrationInterface {
  name = 'AddUniqueMediaIndex1773196454830';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove any duplicate Media rows (keep the lowest id for each tmdbId+mediaType pair)
    await queryRunner.query(`
      DELETE FROM media
      WHERE id NOT IN (
        SELECT MIN(id) FROM media GROUP BY "tmdbId", "mediaType"
      )
    `);

    // Drop the existing non-unique composite index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_f8233358694d1677a67899b90a"`
    );

    // Create a unique composite index to prevent future duplicates
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_media_tmdbId_mediaType_unique"
       ON "media" ("tmdbId", "mediaType")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_media_tmdbId_mediaType_unique"`
    );

    // Restore the original non-unique index
    await queryRunner.query(
      `CREATE INDEX "IDX_f8233358694d1677a67899b90a"
       ON "media" ("tmdbId", "mediaType")`
    );
  }
}
