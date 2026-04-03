import { validateBackupZip, type BackupManifest } from '@server/utils/backup';
import AdmZip from 'adm-zip';
import { describe, expect, it, vi } from 'vitest';

// Mock isPgsql to always return false (SQLite mode) for validation tests
vi.mock('@server/datasource', () => ({
  default: { isInitialized: false },
  isPgsql: false,
  getRepository: vi.fn(),
}));

vi.mock('@server/lib/settings', () => ({
  getSettings: vi.fn(() => ({ load: vi.fn() })),
}));

vi.mock('@server/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@server/utils/appDataVolume', () => ({
  appDataPath: () => '/tmp/test-config',
}));

vi.mock('@server/utils/appVersion', () => ({
  getAppVersion: () => '1.0.0-test',
}));

/**
 * Build a valid backup ZIP buffer with the given manifest and files.
 */
function buildBackupZip(
  manifest: BackupManifest,
  opts?: {
    extraFiles?: { name: string; content: Buffer }[];
    skipSettings?: boolean;
  }
): Buffer {
  const zip = new AdmZip();
  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));

  if (!opts?.skipSettings) {
    zip.addFile('settings.json', Buffer.from('{"clientId":"test"}'));
  }

  if (manifest.dbType === 'sqlite') {
    zip.addFile('db/db.sqlite3', Buffer.from('fake-sqlite-data'));
  }

  if (opts?.extraFiles) {
    for (const f of opts.extraFiles) {
      zip.addFile(f.name, f.content);
    }
  }

  return zip.toBuffer();
}

describe('backup validation (adm-zip)', () => {
  it('accepts a valid SQLite backup', () => {
    const manifest: BackupManifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dbType: 'sqlite',
      files: ['settings.json', 'db/db.sqlite3'],
    };

    const buf = buildBackupZip(manifest);
    const result = validateBackupZip(buf);

    expect(result.manifest.version).toBe('1.0.0');
    expect(result.manifest.dbType).toBe('sqlite');
    expect(result.zip).toBeDefined();
    expect(result.zip.getEntries).toBeDefined();
  });

  it('rejects an invalid ZIP buffer', () => {
    expect(() => validateBackupZip(Buffer.from('not a zip'))).toThrow(
      'Invalid ZIP file'
    );
  });

  it('rejects a ZIP with path traversal', () => {
    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from('{}'));
    zip.addFile('settings.json', Buffer.from('{}'));
    zip.addFile('../../../etc/passwd', Buffer.from('pwned'));

    expect(() => validateBackupZip(zip.toBuffer())).toThrow('Unexpected file');
  });

  it('rejects a ZIP with unexpected files', () => {
    const manifest: BackupManifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dbType: 'sqlite',
      files: ['settings.json'],
    };

    const buf = buildBackupZip(manifest, {
      extraFiles: [{ name: 'evil.sh', content: Buffer.from('rm -rf /') }],
    });

    expect(() => validateBackupZip(buf)).toThrow('Unexpected file');
  });

  it('rejects a ZIP missing manifest.json', () => {
    const zip = new AdmZip();
    zip.addFile('settings.json', Buffer.from('{}'));

    expect(() => validateBackupZip(zip.toBuffer())).toThrow(
      'missing manifest.json'
    );
  });

  it('rejects a ZIP missing settings.json', () => {
    const zip = new AdmZip();
    const manifest: BackupManifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dbType: 'sqlite',
      files: ['settings.json'],
    };
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));

    expect(() => validateBackupZip(zip.toBuffer())).toThrow(
      'missing settings.json'
    );
  });

  it('rejects a SQLite backup missing the database file', () => {
    const zip = new AdmZip();
    const manifest: BackupManifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dbType: 'sqlite',
      files: ['settings.json', 'db/db.sqlite3'],
    };
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
    zip.addFile('settings.json', Buffer.from('{}'));

    expect(() => validateBackupZip(zip.toBuffer())).toThrow(
      'missing db/db.sqlite3'
    );
  });

  it('rejects a postgres backup on a sqlite instance', () => {
    const manifest: BackupManifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dbType: 'postgres',
      files: ['settings.json'],
    };

    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
    zip.addFile('settings.json', Buffer.from('{}'));

    expect(() => validateBackupZip(zip.toBuffer())).toThrow(
      'Database type mismatch'
    );
  });

  it('rejects corrupt manifest JSON', () => {
    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from('{{not json'));
    zip.addFile('settings.json', Buffer.from('{}'));

    expect(() => validateBackupZip(zip.toBuffer())).toThrow(
      'Invalid manifest.json'
    );
  });

  it('includes settings.old.json when present', () => {
    const manifest: BackupManifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dbType: 'sqlite',
      files: ['settings.json', 'settings.old.json', 'db/db.sqlite3'],
    };

    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
    zip.addFile('settings.json', Buffer.from('{}'));
    zip.addFile('settings.old.json', Buffer.from('{}'));
    zip.addFile('db/db.sqlite3', Buffer.from('fake'));

    const result = validateBackupZip(zip.toBuffer());
    expect(result.zip.getEntry('settings.old.json')).toBeTruthy();
  });
});
