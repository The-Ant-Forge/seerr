import { describe, expect, it, vi } from 'vitest';

vi.mock('web-push', () => ({
  default: {
    generateVAPIDKeys: vi.fn(() => ({
      publicKey: 'mockPublicKey',
      privateKey: 'mockPrivateKey',
    })),
  },
}));

import { MediaServerType } from '@server/constants/server';
import { Permission } from '@server/lib/permissions';
import Settings from '@server/lib/settings';

// Reset the singleton between test files
vi.mock('@server/lib/settings', async (importOriginal) => {
  const mod = (await importOriginal()) as any;
  return {
    ...mod,
    // Re-export getSettings with fresh singleton management per test
  };
});

describe('Settings class', () => {
  it('initializes with default values', () => {
    const settings = new Settings();
    expect(settings.main.applicationTitle).toBe('Seerr');
    expect(settings.main.defaultPermissions).toBe(Permission.REQUEST);
    expect(settings.main.localLogin).toBe(true);
    expect(settings.main.mediaServerLogin).toBe(true);
    expect(settings.main.hideAvailable).toBe(false);
    expect(settings.main.locale).toBe('en');
  });

  it('initializes plex with default values', () => {
    const settings = new Settings();
    expect(settings.plex.name).toBe('');
    expect(settings.plex.port).toBe(32400);
    expect(settings.plex.useSsl).toBe(false);
    expect(settings.plex.libraries).toEqual([]);
  });

  it('initializes jellyfin with default values', () => {
    const settings = new Settings();
    expect(settings.jellyfin.port).toBe(8096);
    expect(settings.jellyfin.useSsl).toBe(false);
    expect(settings.jellyfin.urlBase).toBe('');
    expect(settings.jellyfin.libraries).toEqual([]);
  });

  it('initializes with empty radarr and sonarr arrays', () => {
    const settings = new Settings();
    expect(settings.radarr).toEqual([]);
    expect(settings.sonarr).toEqual([]);
  });

  it('initializes with not-configured media server type', () => {
    const settings = new Settings();
    expect(settings.main.mediaServerType).toBe(MediaServerType.NOT_CONFIGURED);
  });

  it('merges initial settings with defaults', () => {
    const settings = new Settings({
      main: {
        applicationTitle: 'Custom Title',
      },
    } as any);
    expect(settings.main.applicationTitle).toBe('Custom Title');
    // Defaults should still be present
    expect(settings.main.locale).toBe('en');
  });

  it('allows setting and getting main settings', () => {
    const settings = new Settings();
    const newMain = { ...settings.main, applicationTitle: 'Updated' };
    settings.main = newMain;
    expect(settings.main.applicationTitle).toBe('Updated');
  });

  it('allows setting and getting plex settings', () => {
    const settings = new Settings();
    const newPlex = { ...settings.plex, name: 'My Plex' };
    settings.plex = newPlex;
    expect(settings.plex.name).toBe('My Plex');
  });

  it('allows setting and getting jellyfin settings', () => {
    const settings = new Settings();
    const newJf = { ...settings.jellyfin, ip: '10.0.0.5' };
    settings.jellyfin = newJf;
    expect(settings.jellyfin.ip).toBe('10.0.0.5');
  });

  it('allows setting and getting notification settings', () => {
    const settings = new Settings();
    expect(settings.notifications.agents.discord.enabled).toBe(false);
    const newNotifications = { ...settings.notifications };
    newNotifications.agents.discord.enabled = true;
    settings.notifications = newNotifications;
    expect(settings.notifications.agents.discord.enabled).toBe(true);
  });

  it('initializes with default job schedules', () => {
    const settings = new Settings();
    expect(settings.jobs['plex-full-scan'].schedule).toBe('0 0 3 * * *');
    expect(settings.jobs['radarr-scan'].schedule).toBe('0 0 4 * * *');
    expect(settings.jobs['sonarr-scan'].schedule).toBe('0 30 4 * * *');
    expect(settings.jobs['download-sync'].schedule).toBe('0 * * * * *');
  });

  it('initializes with default network settings', () => {
    const settings = new Settings();
    expect(settings.network.csrfProtection).toBe(false);
    expect(settings.network.trustProxy).toBe(false);
    expect(settings.network.forceIpv4First).toBe(false);
    expect(settings.network.proxy.enabled).toBe(false);
    expect(settings.network.proxy.port).toBe(8080);
    expect(settings.network.dnsCache.enabled).toBe(false);
    expect(settings.network.apiRequestTimeout).toBe(10000);
  });

  it('initializes with empty migrations array', () => {
    const settings = new Settings();
    expect(settings.migrations).toEqual([]);
  });

  it('allows setting and getting migrations', () => {
    const settings = new Settings();
    settings.migrations = ['0001_migrate_hostname'];
    expect(settings.migrations).toEqual(['0001_migrate_hostname']);
  });

  it('exposes public settings as not initialized by default', () => {
    const settings = new Settings();
    expect(settings.public.initialized).toBe(false);
  });

  describe('fullPublicSettings', () => {
    it('computes movie4kEnabled from radarr defaults', () => {
      const settings = new Settings();
      expect(settings.fullPublicSettings.movie4kEnabled).toBe(false);

      settings.radarr = [{ id: 1, is4k: true, isDefault: true } as any];
      expect(settings.fullPublicSettings.movie4kEnabled).toBe(true);
    });

    it('computes series4kEnabled from sonarr defaults', () => {
      const settings = new Settings();
      expect(settings.fullPublicSettings.series4kEnabled).toBe(false);

      settings.sonarr = [{ id: 1, is4k: true, isDefault: true } as any];
      expect(settings.fullPublicSettings.series4kEnabled).toBe(true);
    });

    it('returns correct applicationTitle', () => {
      const settings = new Settings();
      expect(settings.fullPublicSettings.applicationTitle).toBe('Seerr');
    });

    it('returns email and webpush enabled flags', () => {
      const settings = new Settings();
      expect(settings.fullPublicSettings.emailEnabled).toBe(false);
      expect(settings.fullPublicSettings.enablePushRegistration).toBe(false);
    });

    it('movie4kEnabled is false if radarr server is 4k but not default', () => {
      const settings = new Settings();
      settings.radarr = [{ id: 1, is4k: true, isDefault: false } as any];
      expect(settings.fullPublicSettings.movie4kEnabled).toBe(false);
    });
  });
});
