import type { Video } from '@server/models/Movie';

interface UserSettings {
  discoverRegion?: string;
  streamingRegion?: string;
}

interface AppSettings {
  discoverRegion?: string;
  streamingRegion?: string;
  youtubeUrl?: string;
}

/**
 * Returns the discover region, preferring user setting over app setting,
 * falling back to 'US'.
 */
export function getDiscoverRegion(
  userSettings: UserSettings | undefined,
  appSettings: AppSettings
): string {
  return userSettings?.discoverRegion
    ? userSettings.discoverRegion
    : appSettings.discoverRegion
      ? appSettings.discoverRegion
      : 'US';
}

/**
 * Returns the streaming region, preferring user setting over app setting,
 * falling back to 'US'.
 */
export function getStreamingRegion(
  userSettings: UserSettings | undefined,
  appSettings: AppSettings
): string {
  return userSettings?.streamingRegion
    ? userSettings.streamingRegion
    : appSettings.streamingRegion
      ? appSettings.streamingRegion
      : 'US';
}

/**
 * Finds the best trailer video from related videos and returns its URL.
 * Filters for 'Trailer' type, sorts by size ascending, picks the last (largest),
 * and builds a YouTube URL if the youtubeUrl setting is configured.
 */
export function getTrailerUrl(
  relatedVideos: Video[] | undefined,
  youtubeUrl: string | undefined
): string | undefined {
  const trailerVideo = relatedVideos
    ?.filter((r) => r.type === 'Trailer')
    .sort((a, b) => a.size - b.size)
    .pop();

  const trailerUrl =
    trailerVideo?.site === 'YouTube' && youtubeUrl != ''
      ? `${youtubeUrl}${trailerVideo?.key}`
      : trailerVideo?.url;

  return trailerUrl;
}
