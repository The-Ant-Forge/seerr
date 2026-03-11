import dataSource, { isPgsql } from '@server/datasource';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { appDataPath } from '@server/utils/appDataVolume';
import { getAppVersion } from '@server/utils/appVersion';
import AdmZip from 'adm-zip';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

export interface BackupManifest {
  version: string;
  timestamp: string;
  dbType: 'sqlite' | 'postgres';
  files: string[];
}

const ALLOWED_FILES = new Set([
  'manifest.json',
  'settings.json',
  'settings.old.json',
  'db/db.sqlite3',
]);

const MAX_DECOMPRESSED_SIZE = 1024 * 1024 * 1024; // 1 GB

/**
 * Create a backup ZIP containing settings and (for SQLite) the database.
 */
export async function createBackupZip(): Promise<Buffer> {
  const configPath = appDataPath();
  const zip = new AdmZip();
  const files: string[] = [];

  // Settings
  const settingsPath = path.join(configPath, 'settings.json');
  zip.addLocalFile(settingsPath);
  files.push('settings.json');

  const settingsOldPath = path.join(configPath, 'settings.old.json');
  if (existsSync(settingsOldPath)) {
    zip.addLocalFile(settingsOldPath);
    files.push('settings.old.json');
  }

  // Database (SQLite only)
  if (!isPgsql) {
    // Flush WAL to main DB file
    try {
      await dataSource.query('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e) {
      logger.warn('WAL checkpoint failed, backup may require WAL files', {
        label: 'Backup',
        errorMessage: (e as Error).message,
      });
    }

    const dbPath = path.join(configPath, 'db', 'db.sqlite3');
    if (existsSync(dbPath)) {
      zip.addLocalFile(dbPath, 'db');
      files.push('db/db.sqlite3');
    }
  }

  // Manifest
  const manifest: BackupManifest = {
    version: getAppVersion(),
    timestamp: new Date().toISOString(),
    dbType: isPgsql ? 'postgres' : 'sqlite',
    files,
  };
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));

  return zip.toBuffer();
}

/**
 * Validate a backup ZIP buffer and return the parsed manifest and zip handle.
 */
export function validateBackupZip(zipBuffer: Buffer): {
  manifest: BackupManifest;
  zip: AdmZip;
} {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch {
    throw new Error('Invalid ZIP file');
  }

  // Path traversal and allowed-file check
  let totalSize = 0;
  for (const entry of zip.getEntries()) {
    const name = entry.entryName.replace(/\\/g, '/');
    if (name.includes('..') || path.isAbsolute(name)) {
      throw new Error(`Unsafe entry in ZIP: ${name}`);
    }
    if (!ALLOWED_FILES.has(name)) {
      throw new Error(`Unexpected file in backup: ${name}`);
    }
    totalSize += entry.header.size;
  }

  if (totalSize > MAX_DECOMPRESSED_SIZE) {
    throw new Error('Backup exceeds maximum allowed size');
  }

  // Parse manifest
  const manifestEntry = zip.getEntry('manifest.json');
  if (!manifestEntry) {
    throw new Error('Backup is missing manifest.json');
  }

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
  } catch {
    throw new Error('Invalid manifest.json in backup');
  }

  // Validate required files
  if (!zip.getEntry('settings.json')) {
    throw new Error('Backup is missing settings.json');
  }

  if (manifest.dbType === 'sqlite' && !zip.getEntry('db/db.sqlite3')) {
    throw new Error('SQLite backup is missing db/db.sqlite3');
  }

  // DB type mismatch check
  const currentDbType = isPgsql ? 'postgres' : 'sqlite';
  if (manifest.dbType !== currentDbType) {
    throw new Error(
      `Database type mismatch: backup is ${manifest.dbType}, current instance is ${currentDbType}`
    );
  }

  return { manifest, zip };
}

/**
 * Restore from a validated backup ZIP.
 * Creates a pre-restore backup before overwriting files.
 */
export async function restoreFromZip(
  zip: AdmZip,
  manifest: BackupManifest
): Promise<void> {
  const configPath = appDataPath();

  // Auto-backup current state
  try {
    const preRestoreBackup = await createBackupZip();
    await fs.writeFile(
      path.join(configPath, 'pre-restore-backup.zip'),
      preRestoreBackup
    );
    logger.info('Created pre-restore backup', { label: 'Backup' });
  } catch (e) {
    logger.warn('Failed to create pre-restore backup, continuing anyway', {
      label: 'Backup',
      errorMessage: (e as Error).message,
    });
  }

  // Restore settings.json (atomic write)
  const settingsEntry = zip.getEntry('settings.json');
  if (settingsEntry) {
    const settingsPath = path.join(configPath, 'settings.json');
    const tmpPath = settingsPath + '.tmp';
    await fs.writeFile(tmpPath, settingsEntry.getData());
    await fs.rename(tmpPath, settingsPath);
    logger.info('Restored settings.json', { label: 'Backup' });
  }

  // Restore settings.old.json if present
  const settingsOldEntry = zip.getEntry('settings.old.json');
  if (settingsOldEntry) {
    await fs.writeFile(
      path.join(configPath, 'settings.old.json'),
      settingsOldEntry.getData()
    );
  }

  // Restore SQLite database
  if (manifest.dbType === 'sqlite') {
    const dbEntry = zip.getEntry('db/db.sqlite3');
    if (dbEntry) {
      // Close current connection
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        logger.info('Closed database connection for restore', {
          label: 'Backup',
        });
      }

      const dbDir = path.join(configPath, 'db');
      await fs.mkdir(dbDir, { recursive: true });

      // Atomic write
      const dbPath = path.join(dbDir, 'db.sqlite3');
      const tmpPath = dbPath + '.tmp';
      await fs.writeFile(tmpPath, dbEntry.getData());
      await fs.rename(tmpPath, dbPath);

      // Remove stale WAL/SHM files
      for (const ext of ['-wal', '-shm']) {
        const walPath = dbPath + ext;
        try {
          await fs.unlink(walPath);
        } catch {
          // File doesn't exist, that's fine
        }
      }

      logger.info('Restored database', { label: 'Backup' });
    }
  }

  // Reload settings in memory
  await getSettings().load();
  logger.info('Restore complete', { label: 'Backup' });
}
