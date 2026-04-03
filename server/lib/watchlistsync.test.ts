import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

// Mock all external dependencies before importing the module
vi.mock('@server/api/plextv', () => ({
  default: vi.fn(),
}));

vi.mock('@server/datasource', () => ({
  getRepository: vi.fn(() => ({
    createQueryBuilder: vi.fn(() => ({
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([]),
    })),
  })),
}));

vi.mock('@server/entity/Media', () => ({
  default: {
    getRelatedMedia: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@server/entity/MediaRequest', () => ({
  MediaRequest: {
    request: vi.fn().mockResolvedValue({}),
  },
  DuplicateMediaRequestError: class extends Error {},
  BlocklistedMediaError: class extends Error {},
  NoSeasonsAvailableError: class extends Error {},
  QuotaRestrictedError: class extends Error {},
  RequestPermissionError: class extends Error {},
}));

vi.mock('@server/entity/User', () => ({
  User: vi.fn(),
}));

vi.mock('@server/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@server/lib/permissions', () => ({
  Permission: {
    AUTO_REQUEST: 1 << 20,
    AUTO_REQUEST_MOVIE: 1 << 21,
    AUTO_REQUEST_TV: 1 << 22,
  },
}));

// Use dynamic import after mocks are set up
const { default: watchlistSync } = await import('@server/lib/watchlistsync');

describe('WatchlistSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the running flag via a second sync call test
  });

  describe('concurrent run guard', () => {
    it('prevents overlapping sync runs', async () => {
      const logger = (await import('@server/logger')).default;

      // Manually set the running flag
      (watchlistSync as unknown as { running: boolean }).running = true;

      await watchlistSync.syncWatchlist();

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('previous run is still in progress'),
        expect.any(Object)
      );

      // Clean up
      (watchlistSync as unknown as { running: boolean }).running = false;
    });

    it('resets running flag after sync completes', async () => {
      // The sync will complete quickly since getRepository returns empty users
      const { getRepository } = await import('@server/datasource');
      (getRepository as unknown as MockInstance).mockReturnValue({
        createQueryBuilder: vi.fn(() => ({
          addSelect: vi.fn().mockReturnThis(),
          leftJoinAndSelect: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          getMany: vi.fn().mockResolvedValue([]),
        })),
      });

      await watchlistSync.syncWatchlist();

      expect((watchlistSync as unknown as { running: boolean }).running).toBe(
        false
      );
    });

    it('resets running flag even if user query throws', async () => {
      const { getRepository } = await import('@server/datasource');
      (getRepository as unknown as MockInstance).mockReturnValue({
        createQueryBuilder: vi.fn(() => ({
          addSelect: vi.fn().mockReturnThis(),
          leftJoinAndSelect: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          getMany: vi
            .fn()
            .mockRejectedValue(new Error('SQLITE_BUSY: database is locked')),
        })),
      });

      // The error propagates, but the finally block still resets running
      await expect(watchlistSync.syncWatchlist()).rejects.toThrow(
        'SQLITE_BUSY'
      );

      expect((watchlistSync as unknown as { running: boolean }).running).toBe(
        false
      );
    });
  });
});
