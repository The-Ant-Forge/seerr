import { MediaServerType, ServerType } from '@server/constants/server';
import { describe, expect, it } from 'vitest';

describe('MediaServerType enum', () => {
  it('PLEX = 1', () => {
    expect(MediaServerType.PLEX).toBe(1);
  });

  it('JELLYFIN = 2', () => {
    expect(MediaServerType.JELLYFIN).toBe(2);
  });

  it('EMBY = 3', () => {
    expect(MediaServerType.EMBY).toBe(3);
  });

  it('NOT_CONFIGURED = 4', () => {
    expect(MediaServerType.NOT_CONFIGURED).toBe(4);
  });

  it('has exactly 4 members', () => {
    const keys = Object.keys(MediaServerType).filter((k) => isNaN(Number(k)));
    expect(keys).toHaveLength(4);
  });
});

describe('ServerType enum', () => {
  it('JELLYFIN = "Jellyfin"', () => {
    expect(ServerType.JELLYFIN).toBe('Jellyfin');
  });

  it('EMBY = "Emby"', () => {
    expect(ServerType.EMBY).toBe('Emby');
  });
});
