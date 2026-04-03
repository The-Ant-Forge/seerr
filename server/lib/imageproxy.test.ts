import { getExtension, getType } from '@server/utils/mimeTypes';
import { describe, expect, it } from 'vitest';

/**
 * Tests for the inline MIME type utility used by the image proxy.
 */
describe('getExtension', () => {
  it('resolves common image MIME types', () => {
    expect(getExtension('image/jpeg')).toBe('jpg');
    expect(getExtension('image/png')).toBe('png');
    expect(getExtension('image/webp')).toBe('webp');
    expect(getExtension('image/gif')).toBe('gif');
    expect(getExtension('image/svg+xml')).toBe('svg');
    expect(getExtension('image/avif')).toBe('avif');
  });

  it('returns null for unknown MIME types', () => {
    expect(getExtension('application/x-unknown-type')).toBeNull();
  });
});

describe('getType', () => {
  it('resolves extensions to MIME types', () => {
    expect(getType('jpg')).toBe('image/jpeg');
    expect(getType('png')).toBe('image/png');
    expect(getType('webp')).toBe('image/webp');
  });

  it('handles dot-prefixed extensions', () => {
    expect(getType('.jpg')).toBe('image/jpeg');
  });

  it('returns null for unknown extensions', () => {
    expect(getType('xyz')).toBeNull();
  });
});
