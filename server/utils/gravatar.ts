import { createHash } from 'crypto';

export function gravatarUrl(
  email: string,
  options: { default?: string; size?: number } = {}
): string {
  const hash = createHash('md5')
    .update(email.trim().toLowerCase())
    .digest('hex');
  const params = new URLSearchParams();
  if (options.default) params.set('d', options.default);
  if (options.size) params.set('s', String(options.size));
  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`;
}
