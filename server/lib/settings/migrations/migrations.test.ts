import migrateHostname from '@server/lib/settings/migrations/0001_migrate_hostname';
import migrateRegionSetting from '@server/lib/settings/migrations/0004_migrate_region_setting';
import migrateNetworkSettings from '@server/lib/settings/migrations/0005_migrate_network_settings';
import removeLunaSeaSetting from '@server/lib/settings/migrations/0006_remove_lunasea';
import migrateBlacklistToBlocklist from '@server/lib/settings/migrations/0008_migrate_blacklist_to_blocklist';
import { describe, expect, it } from 'vitest';

describe('Migration 0001: migrateHostname', () => {
  it('parses http hostname into ip, port, useSsl, urlBase', () => {
    const input: any = {
      jellyfin: {
        hostname: 'http://192.168.1.100:8096',
      },
    };
    const result = migrateHostname(input);
    expect(result.jellyfin.ip).toBe('192.168.1.100');
    expect(result.jellyfin.port).toBe('8096');
    expect(result.jellyfin.useSsl).toBe(false);
    expect(result.jellyfin.urlBase).toBe('');
    expect((result.jellyfin as any).hostname).toBeUndefined();
  });

  it('parses https hostname with SSL', () => {
    const input: any = {
      jellyfin: {
        hostname: 'https://secure.example.com:443/jf',
      },
    };
    const result = migrateHostname(input);
    expect(result.jellyfin.ip).toBe('secure.example.com');
    expect(result.jellyfin.port).toBe('443');
    expect(result.jellyfin.useSsl).toBe(true);
    expect(result.jellyfin.urlBase).toBe('/jf');
  });

  it('defaults port to 443 for https without explicit port', () => {
    const input: any = {
      jellyfin: {
        hostname: 'https://myserver.com',
      },
    };
    const result = migrateHostname(input);
    expect(result.jellyfin.ip).toBe('myserver.com');
    expect(result.jellyfin.port).toBe(443);
    expect(result.jellyfin.useSsl).toBe(true);
  });

  it('defaults port to 80 for http without explicit port', () => {
    const input: any = {
      jellyfin: {
        hostname: 'http://myserver.com',
      },
    };
    const result = migrateHostname(input);
    expect(result.jellyfin.port).toBe(80);
    expect(result.jellyfin.useSsl).toBe(false);
  });

  it('strips trailing slash from urlBase', () => {
    const input: any = {
      jellyfin: {
        hostname: 'http://host:8096/base/',
      },
    };
    const result = migrateHostname(input);
    expect(result.jellyfin.urlBase).toBe('/base');
  });

  it('does nothing when jellyfin has no hostname', () => {
    const input: any = {
      jellyfin: {
        ip: '10.0.0.1',
        port: 8096,
      },
    };
    const result = migrateHostname(input);
    expect(result.jellyfin.ip).toBe('10.0.0.1');
    expect(result.jellyfin.port).toBe(8096);
  });

  it('does nothing when jellyfin is undefined', () => {
    const input: any = { main: {} };
    const result = migrateHostname(input);
    expect(result).toEqual({ main: {} });
  });
});

describe('Migration 0004: migrateRegionSetting', () => {
  it('skips migration if discoverRegion and streamingRegion already exist', () => {
    const input: any = {
      main: {
        discoverRegion: 'US',
        streamingRegion: 'GB',
      },
    };
    const result = migrateRegionSetting(input);
    expect(result.main.discoverRegion).toBe('US');
    expect(result.main.streamingRegion).toBe('GB');
  });

  it('migrates old region to both discoverRegion and streamingRegion', () => {
    const input: any = {
      main: {
        region: 'DE',
      },
    };
    const result = migrateRegionSetting(input);
    expect(result.main.discoverRegion).toBe('DE');
    expect(result.main.streamingRegion).toBe('DE');
    expect(result.main.region).toBeUndefined();
  });

  it('sets defaults when no old region exists', () => {
    const input: any = {
      main: {},
    };
    const result = migrateRegionSetting(input);
    expect(result.main.discoverRegion).toBe('');
    expect(result.main.streamingRegion).toBe('US');
  });

  it('sets defaults when old region is empty string', () => {
    const input: any = {
      main: {
        region: '',
      },
    };
    const result = migrateRegionSetting(input);
    expect(result.main.discoverRegion).toBe('');
    expect(result.main.streamingRegion).toBe('US');
  });
});

describe('Migration 0005: migrateNetworkSettings', () => {
  it('skips migration if network already exists', () => {
    const input: any = {
      main: { csrfProtection: true },
      network: { csrfProtection: false },
    };
    const result = migrateNetworkSettings(input);
    expect(result.network.csrfProtection).toBe(false);
  });

  it('moves csrfProtection, trustProxy, forceIpv4First from main to network', () => {
    const input: any = {
      main: {
        csrfProtection: true,
        trustProxy: true,
        forceIpv4First: true,
        applicationTitle: 'Seerr',
      },
    };
    const result = migrateNetworkSettings(input);
    expect(result.network.csrfProtection).toBe(true);
    expect(result.network.trustProxy).toBe(true);
    expect(result.network.forceIpv4First).toBe(true);
    expect(result.main.csrfProtection).toBeUndefined();
    expect(result.main.trustProxy).toBeUndefined();
    expect(result.main.forceIpv4First).toBeUndefined();
  });

  it('moves proxy settings from main to network', () => {
    const proxyConfig = {
      enabled: true,
      hostname: 'proxy.local',
      port: 3128,
      useSsl: false,
      user: 'admin',
      password: 'secret',
      bypassFilter: '',
      bypassLocalAddresses: true,
    };
    const input: any = {
      main: {
        proxy: proxyConfig,
      },
    };
    const result = migrateNetworkSettings(input);
    expect(result.network.proxy).toEqual(proxyConfig);
    expect(result.main.proxy).toBeUndefined();
  });

  it('provides default proxy when main has no proxy', () => {
    const input: any = {
      main: {},
    };
    const result = migrateNetworkSettings(input);
    expect(result.network.proxy).toEqual({
      enabled: false,
      hostname: '',
      port: 8080,
      useSsl: false,
      user: '',
      password: '',
      bypassFilter: '',
      bypassLocalAddresses: true,
    });
  });

  it('defaults csrfProtection, trustProxy, forceIpv4First to false when undefined', () => {
    const input: any = {
      main: {},
    };
    const result = migrateNetworkSettings(input);
    expect(result.network.csrfProtection).toBe(false);
    expect(result.network.trustProxy).toBe(false);
    expect(result.network.forceIpv4First).toBe(false);
  });
});

describe('Migration 0006: removeLunaSeaSetting', () => {
  it('removes lunasea agent from notifications', () => {
    const input: any = {
      notifications: {
        agents: {
          lunasea: { enabled: true, options: {} },
          discord: { enabled: false },
        },
      },
    };
    const result = removeLunaSeaSetting(input);
    expect(result.notifications.agents.lunasea).toBeUndefined();
    expect(result.notifications.agents.discord).toBeDefined();
  });

  it('does nothing if lunasea does not exist', () => {
    const input: any = {
      notifications: {
        agents: {
          discord: { enabled: false },
        },
      },
    };
    const result = removeLunaSeaSetting(input);
    expect(result.notifications.agents.discord).toBeDefined();
  });

  it('does nothing if notifications is undefined', () => {
    const input: any = { main: {} };
    const result = removeLunaSeaSetting(input);
    expect(result).toEqual({ main: {} });
  });

  it('does nothing if agents is undefined', () => {
    const input: any = { notifications: {} };
    const result = removeLunaSeaSetting(input);
    expect(result).toEqual({ notifications: {} });
  });
});

describe('Migration 0008: migrateBlacklistToBlocklist', () => {
  it('skips if migration already applied', () => {
    const input: any = {
      migrations: ['0008_migrate_blacklist_to_blocklist'],
      main: {
        hideBlacklisted: true,
      },
    };
    const result = migrateBlacklistToBlocklist(input);
    // Should not rename since migration was already applied
    expect(result.main.hideBlacklisted).toBe(true);
  });

  it('renames hideBlacklisted to hideBlocklisted', () => {
    const input: any = {
      main: {
        hideBlacklisted: true,
      },
    };
    const result = migrateBlacklistToBlocklist(input);
    expect(result.main.hideBlocklisted).toBe(true);
    expect(result.main.hideBlacklisted).toBeUndefined();
  });

  it('renames blacklistedTags to blocklistedTags', () => {
    const input: any = {
      main: {
        blacklistedTags: 'tag1,tag2',
      },
    };
    const result = migrateBlacklistToBlocklist(input);
    expect(result.main.blocklistedTags).toBe('tag1,tag2');
    expect(result.main.blacklistedTags).toBeUndefined();
  });

  it('renames blacklistedTagsLimit to blocklistedTagsLimit', () => {
    const input: any = {
      main: {
        blacklistedTagsLimit: 100,
      },
    };
    const result = migrateBlacklistToBlocklist(input);
    expect(result.main.blocklistedTagsLimit).toBe(100);
    expect(result.main.blacklistedTagsLimit).toBeUndefined();
  });

  it('renames process-blacklisted-tags job to process-blocklisted-tags', () => {
    const input: any = {
      main: {},
      jobs: {
        'process-blacklisted-tags': { schedule: '0 30 1 */7 * *' },
      },
    };
    const result = migrateBlacklistToBlocklist(input);
    expect(result.jobs['process-blocklisted-tags']).toEqual({
      schedule: '0 30 1 */7 * *',
    });
    expect(result.jobs['process-blacklisted-tags']).toBeUndefined();
  });

  it('records migration in migrations array', () => {
    const input: any = {
      main: {},
    };
    const result = migrateBlacklistToBlocklist(input);
    expect(result.migrations).toContain('0008_migrate_blacklist_to_blocklist');
  });

  it('initializes migrations array if not present', () => {
    const input: any = {
      main: {},
    };
    const result = migrateBlacklistToBlocklist(input);
    expect(Array.isArray(result.migrations)).toBe(true);
  });

  it('migrates all blacklist fields at once', () => {
    const input: any = {
      main: {
        hideBlacklisted: false,
        blacklistedTags: 'anime',
        blacklistedTagsLimit: 50,
      },
      jobs: {
        'process-blacklisted-tags': { schedule: '0 0 * * *' },
      },
    };
    const result = migrateBlacklistToBlocklist(input);
    expect(result.main.hideBlocklisted).toBe(false);
    expect(result.main.blocklistedTags).toBe('anime');
    expect(result.main.blocklistedTagsLimit).toBe(50);
    expect(result.jobs['process-blocklisted-tags']).toEqual({
      schedule: '0 0 * * *',
    });
    expect(result.main.hideBlacklisted).toBeUndefined();
    expect(result.main.blacklistedTags).toBeUndefined();
    expect(result.main.blacklistedTagsLimit).toBeUndefined();
    expect(result.jobs['process-blacklisted-tags']).toBeUndefined();
  });
});
