import type { AllSettings } from '@server/lib/settings';
import logger from '@server/logger';
import fs from 'fs/promises';
import path from 'path';

const migrationsDir = path.join(__dirname, 'migrations');

export const runMigrations = async (
  settings: AllSettings,
  SETTINGS_PATH: string
): Promise<AllSettings> => {
  let migrated = settings;

  try {
    // we read old backup and create a backup of currents settings
    const BACKUP_PATH = SETTINGS_PATH.replace('.json', '.old.json');
    let oldBackup: string | null = null;
    try {
      oldBackup = await fs.readFile(BACKUP_PATH, 'utf-8');
    } catch {
      /* empty */
    }
    const backupTmp = BACKUP_PATH + '.tmp';
    await fs.writeFile(backupTmp, JSON.stringify(settings, undefined, ' '));
    await fs.rename(backupTmp, BACKUP_PATH);

    const migrations = (await fs.readdir(migrationsDir)).filter(
      (file) => file.endsWith('.js') || file.endsWith('.ts')
    );

    const settingsBefore = JSON.stringify(migrated);

    for (const migration of migrations) {
      try {
        logger.debug(`Checking migration '${migration}'...`, {
          label: 'Settings Migrator',
        });
        const { default: migrationFn } = await import(
          path.join(migrationsDir, migration)
        );
        const newSettings = await migrationFn(structuredClone(migrated));
        if (JSON.stringify(migrated) !== JSON.stringify(newSettings)) {
          logger.debug(`Migration '${migration}' has been applied.`, {
            label: 'Settings Migrator',
          });
        }
        migrated = newSettings;
      } catch (e) {
        // we stop Seerr if the migration failed
        logger.error(
          `Error while running migration '${migration}': ${e.message}\n${e.stack}`,
          {
            label: 'Settings Migrator',
          }
        );
        logger.error(
          'A common cause for this error is a permission issue with your configuration folder, a network issue or a corrupted database.',
          {
            label: 'Settings Migrator',
          }
        );
        process.exit();
      }
    }

    const settingsAfter = JSON.stringify(migrated);

    if (settingsBefore !== settingsAfter) {
      // a migration occured
      // we check that the new config will be saved
      const settingsTmp = SETTINGS_PATH + '.tmp';
      await fs.writeFile(settingsTmp, JSON.stringify(migrated, undefined, ' '));
      await fs.rename(settingsTmp, SETTINGS_PATH);
    } else if (oldBackup) {
      // no migration occured
      // we save the old backup (to avoid settings.json and settings.old.json being the same)
      const restoreTmp = BACKUP_PATH + '.tmp';
      await fs.writeFile(restoreTmp, oldBackup.toString());
      await fs.rename(restoreTmp, BACKUP_PATH);
    }
  } catch (e) {
    // we stop Seerr if the migration failed
    logger.error(
      `Something went wrong while running settings migrations: ${e.message}`,
      {
        label: 'Settings Migrator',
      }
    );
    logger.error(
      'A common cause for this issue is a permission error of your configuration folder.',
      {
        label: 'Settings Migrator',
      }
    );
    process.exit();
  }

  return migrated;
};
