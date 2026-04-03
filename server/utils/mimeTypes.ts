/**
 * Minimal MIME-to-extension mapping for the image proxy cache.
 * Replaces the `mime` package to reduce supply chain surface.
 */
const mimeToExt: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/heif': 'heif',
  'image/heic': 'heic',
};

const extToMime: Record<string, string> = {};
for (const [mime, ext] of Object.entries(mimeToExt)) {
  extToMime[ext] = mime;
}

export function getExtension(mimeType: string): string | null {
  return mimeToExt[mimeType] ?? null;
}

export function getType(extension: string): string | null {
  const ext = extension.replace(/^\./, '');
  return extToMime[ext] ?? null;
}
