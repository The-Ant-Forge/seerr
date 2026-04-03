import mime from 'mime/lite';
import { describe, expect, it } from 'vitest';

/**
 * Tests for the mime package usage in Seerr's image proxy.
 * The imageproxy uses mime.getExtension() to resolve file extensions
 * from HTTP Content-Type headers when caching images.
 *
 * mime v3 uses CJS, v4 switches to ESM-only — these tests verify
 * the behaviors we depend on survive an upgrade.
 */
describe('mime.getExtension (imageproxy)', () => {
  it('resolves common image MIME types', () => {
    // mime v4 returns 'jpg' instead of 'jpeg' — both are valid
    expect(['jpeg', 'jpg']).toContain(mime.getExtension('image/jpeg'));
    expect(mime.getExtension('image/png')).toBe('png');
    expect(mime.getExtension('image/webp')).toBe('webp');
    expect(mime.getExtension('image/gif')).toBe('gif');
    expect(mime.getExtension('image/svg+xml')).toBe('svg');
  });

  it('returns null for unknown MIME types', () => {
    expect(mime.getExtension('application/x-unknown-type')).toBeNull();
  });

  it('handles MIME types with parameters', () => {
    // Content-Type headers can include charset, e.g. "image/svg+xml; charset=utf-8"
    // mime.getExtension does NOT handle parameters — callers must strip them.
    // This test documents the expected behavior.
    const contentType = 'image/svg+xml; charset=utf-8';
    const mimeType = contentType.split(';')[0].trim();
    expect(mime.getExtension(mimeType)).toBe('svg');
  });
});

describe('mime.getType', () => {
  it('resolves extensions to MIME types', () => {
    expect(mime.getType('jpeg')).toBe('image/jpeg');
    expect(mime.getType('png')).toBe('image/png');
    expect(mime.getType('webp')).toBe('image/webp');
  });
});
