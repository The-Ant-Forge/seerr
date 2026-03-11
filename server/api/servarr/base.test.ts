import ServarrBase from '@server/api/servarr/base';
import type { DVRSettings } from '@server/lib/settings';
import { describe, expect, it } from 'vitest';

describe('ServarrBase.buildUrl', () => {
  const makeSettings = (overrides: Partial<DVRSettings> = {}): DVRSettings => ({
    id: 1,
    name: 'Test',
    hostname: 'localhost',
    port: 7878,
    apiKey: 'abc123',
    useSsl: false,
    baseUrl: '',
    activeProfileId: 1,
    activeProfileName: 'Any',
    activeDirectory: '/movies',
    tags: [],
    is4k: false,
    isDefault: true,
    syncEnabled: false,
    preventSearch: false,
    tagRequests: false,
    overrideRule: [],
    ...overrides,
  });

  it('builds a basic http URL', () => {
    const url = ServarrBase.buildUrl(makeSettings(), '/api/v3');
    expect(url).toBe('http://localhost:7878/api/v3');
  });

  it('builds an https URL when useSsl is true', () => {
    const url = ServarrBase.buildUrl(
      makeSettings({ useSsl: true, port: 443 }),
      '/api/v3'
    );
    expect(url).toBe('https://localhost:443/api/v3');
  });

  it('includes baseUrl in the built URL', () => {
    const url = ServarrBase.buildUrl(
      makeSettings({ baseUrl: '/radarr' }),
      '/api/v3'
    );
    expect(url).toBe('http://localhost:7878/radarr/api/v3');
  });

  it('handles empty baseUrl', () => {
    const url = ServarrBase.buildUrl(makeSettings({ baseUrl: '' }), '/api/v3');
    expect(url).toBe('http://localhost:7878/api/v3');
  });

  it('handles undefined baseUrl', () => {
    const url = ServarrBase.buildUrl(
      makeSettings({ baseUrl: undefined }),
      '/api/v3'
    );
    expect(url).toBe('http://localhost:7878/api/v3');
  });

  it('handles custom hostname and port', () => {
    const url = ServarrBase.buildUrl(
      makeSettings({ hostname: '10.0.0.5', port: 9090 }),
      '/api/v3'
    );
    expect(url).toBe('http://10.0.0.5:9090/api/v3');
  });

  it('handles path with no leading slash', () => {
    const url = ServarrBase.buildUrl(makeSettings(), 'api/v3');
    expect(url).toBe('http://localhost:7878api/v3');
  });

  it('builds correct URL with empty path', () => {
    const url = ServarrBase.buildUrl(makeSettings(), '');
    expect(url).toBe('http://localhost:7878');
  });

  it('handles complex baseUrl and path combination', () => {
    const url = ServarrBase.buildUrl(
      makeSettings({ hostname: 'media.home', port: 8080, baseUrl: '/arr' }),
      '/api/v3/movie'
    );
    expect(url).toBe('http://media.home:8080/arr/api/v3/movie');
  });
});
