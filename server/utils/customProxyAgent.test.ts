import { describe, expect, it } from 'vitest';

/**
 * Tests for the proxy agent utilities. These validate the pure logic
 * (URL filtering, local address detection) without making real network
 * calls. The proxy agent module uses: http-proxy-agent, https-proxy-agent,
 * undici (Agent, ProxyAgent, setGlobalDispatcher).
 */

// Re-implement isLocalAddress here to test it in isolation,
// since the module's version is not exported.
function isLocalAddress(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    return true;
  }

  const privateIpRanges = [
    /^10\./, // 10.x.x.x
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.x.x - 172.31.x.x
    /^192\.168\./, // 192.168.x.x
  ];
  if (privateIpRanges.some((regex) => regex.test(hostname))) {
    return true;
  }

  return false;
}

// Re-implement skipUrl logic for testing bypass filter parsing
function skipUrl(
  url: string,
  bypassFilter: string,
  bypassLocalAddresses: boolean
): boolean {
  const hostname = new URL(url).hostname;

  if (bypassLocalAddresses && isLocalAddress(hostname)) {
    return true;
  }

  for (const address of bypassFilter.split(',')) {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      continue;
    }

    if (trimmedAddress.startsWith('*')) {
      const domain = trimmedAddress.slice(1);
      if (hostname.endsWith(domain)) {
        return true;
      }
    } else if (hostname === trimmedAddress) {
      return true;
    }
  }

  return false;
}

describe('isLocalAddress', () => {
  it('recognises localhost', () => {
    expect(isLocalAddress('localhost')).toBe(true);
  });

  it('recognises IPv4 loopback', () => {
    expect(isLocalAddress('127.0.0.1')).toBe(true);
  });

  it('recognises IPv6 loopback', () => {
    expect(isLocalAddress('::1')).toBe(true);
  });

  it('recognises 10.x.x.x range', () => {
    expect(isLocalAddress('10.0.0.1')).toBe(true);
    expect(isLocalAddress('10.255.255.255')).toBe(true);
  });

  it('recognises 172.16-31.x.x range', () => {
    expect(isLocalAddress('172.16.0.1')).toBe(true);
    expect(isLocalAddress('172.31.255.255')).toBe(true);
    expect(isLocalAddress('172.15.0.1')).toBe(false);
    expect(isLocalAddress('172.32.0.1')).toBe(false);
  });

  it('recognises 192.168.x.x range', () => {
    expect(isLocalAddress('192.168.1.1')).toBe(true);
    expect(isLocalAddress('192.168.50.40')).toBe(true);
  });

  it('rejects public IPs', () => {
    expect(isLocalAddress('8.8.8.8')).toBe(false);
    expect(isLocalAddress('104.18.36.51')).toBe(false);
  });
});

describe('skipUrl (bypass filter)', () => {
  it('bypasses local addresses when enabled', () => {
    expect(skipUrl('http://localhost:3819/api', '', true)).toBe(true);
    expect(skipUrl('http://192.168.1.1:8080/test', '', true)).toBe(true);
  });

  it('does not bypass local addresses when disabled', () => {
    expect(skipUrl('http://localhost:3819/api', '', false)).toBe(false);
  });

  it('matches exact hostnames in bypass filter', () => {
    expect(
      skipUrl('https://api.example.com/v1', 'api.example.com', false)
    ).toBe(true);
  });

  it('matches wildcard domains in bypass filter', () => {
    expect(skipUrl('https://sub.example.com/v1', '*.example.com', false)).toBe(
      true
    );
    expect(
      skipUrl('https://deep.sub.example.com/v1', '*.example.com', false)
    ).toBe(true);
  });

  it('does not match unrelated domains', () => {
    expect(skipUrl('https://other.com/v1', '*.example.com', false)).toBe(false);
  });

  it('handles multiple comma-separated filters', () => {
    const filter = 'api.local, *.internal.net, 10.0.0.5';
    expect(skipUrl('http://api.local/test', filter, false)).toBe(true);
    expect(skipUrl('http://svc.internal.net/test', filter, false)).toBe(true);
    expect(skipUrl('http://10.0.0.5/test', filter, false)).toBe(true);
    expect(skipUrl('http://external.com/test', filter, false)).toBe(false);
  });

  it('handles empty filter gracefully', () => {
    expect(skipUrl('http://example.com', '', false)).toBe(false);
    expect(skipUrl('http://example.com', '  ,  ,  ', false)).toBe(false);
  });
});
