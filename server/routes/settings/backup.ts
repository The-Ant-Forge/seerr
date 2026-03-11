import logger from '@server/logger';
import {
  createBackupZip,
  restoreFromZip,
  validateBackupZip,
} from '@server/utils/backup';
import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';

const backupRoutes = Router();

// Download backup ZIP
backupRoutes.get('/', async (_req, res, next) => {
  try {
    const zipBuffer = await createBackupZip();

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\.\d+Z$/, '');
    const filename = `seerr-backup-${timestamp}.zip`;

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zipBuffer.length),
    });
    res.send(zipBuffer);
  } catch (e) {
    logger.error('Failed to create backup', {
      label: 'Backup',
      errorMessage: (e as Error).message,
    });
    next(e);
  }
});

// Restore from backup ZIP (authenticated — requires restart)
backupRoutes.post(
  '/restore',
  rateLimit({ windowMs: 60 * 1000, max: 2 }),
  express.raw({ type: 'application/zip', limit: '500mb' }),
  async (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'No backup file provided' });
      }

      const { manifest, zip } = validateBackupZip(req.body);
      await restoreFromZip(zip, manifest);

      res.json({ success: true, restartRequired: true });

      // Allow response to flush, then exit for process manager to restart
      setTimeout(() => {
        logger.info('Restarting after restore...', { label: 'Backup' });
        process.exit(0);
      }, 2000);
    } catch (e) {
      logger.error('Restore failed', {
        label: 'Backup',
        errorMessage: (e as Error).message,
      });
      return res
        .status(400)
        .json({ error: (e as Error).message || 'Restore failed' });
    }
  }
);

export default backupRoutes;
