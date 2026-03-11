import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@server/lib/settings', () => ({
  getSettings: vi.fn(() => ({
    jellyfin: {
      useSsl: false,
      ip: '192.168.1.100',
      port: 8096,
      urlBase: '',
    },
  })),
}));

import { getSettings } from '@server/lib/settings';
import { getHostname } from '@server/utils/getHostname';

describe('getHostname', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds http URL from explicit params without SSL', () => {
    const result = getHostname({
      useSsl: false,
      ip: '10.0.0.1',
      port: 8096,
      urlBase: '',
    });
    expect(result).toBe('http://10.0.0.1:8096');
  });

  it('builds https URL from explicit params with SSL', () => {
    const result = getHostname({
      useSsl: true,
      ip: '10.0.0.1',
      port: 443,
      urlBase: '',
    });
    expect(result).toBe('https://10.0.0.1:443');
  });

  it('appends urlBase to the URL', () => {
    const result = getHostname({
      useSsl: false,
      ip: 'myhost',
      port: 8096,
      urlBase: '/jellyfin',
    });
    expect(result).toBe('http://myhost:8096/jellyfin');
  });

  it('handles undefined useSsl as falsy (http)', () => {
    const result = getHostname({
      ip: 'localhost',
      port: 8096,
      urlBase: '',
    });
    expect(result).toBe('http://localhost:8096');
  });

  it('handles undefined urlBase', () => {
    const result = getHostname({
      useSsl: false,
      ip: 'localhost',
      port: 8096,
    });
    expect(result).toBe('http://localhost:8096undefined');
  });

  it('falls back to settings when no params provided', () => {
    const result = getHostname();
    expect(getSettings).toHaveBeenCalled();
    expect(result).toBe('http://192.168.1.100:8096');
  });

  it('falls back to settings with SSL enabled', () => {
    vi.mocked(getSettings).mockReturnValue({
      jellyfin: {
        useSsl: true,
        ip: 'secure.host',
        port: 443,
        urlBase: '/jf',
      },
    } as any);

    const result = getHostname();
    expect(result).toBe('https://secure.host:443/jf');
  });

  it('handles IPv6 address in params', () => {
    const result = getHostname({
      useSsl: false,
      ip: '::1',
      port: 8096,
      urlBase: '',
    });
    expect(result).toBe('http://::1:8096');
  });
});
