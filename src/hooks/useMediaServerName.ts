import { MediaServerType } from '@server/constants/server';
import type { IntlShape, MessageDescriptor } from 'react-intl';

/**
 * Returns a play-button label based on the current media server type.
 *
 * @param mediaServerType - The configured media server type (Plex, Emby, or Jellyfin)
 * @param formatMessage   - react-intl's formatMessage function
 * @param playMessage     - The message descriptor for standard play (e.g. "Play on {mediaServerName}")
 * @param play4kMessage   - The message descriptor for 4K play (e.g. "Play 4K on {mediaServerName}")
 */
export function getMediaServerPlayLabel(
  mediaServerType: MediaServerType,
  formatMessage: IntlShape['formatMessage'],
  playMessage: MessageDescriptor
): string {
  if (mediaServerType === MediaServerType.EMBY) {
    return formatMessage(playMessage, { mediaServerName: 'Emby' });
  }

  if (mediaServerType === MediaServerType.PLEX) {
    return formatMessage(playMessage, { mediaServerName: 'Plex' });
  }

  return formatMessage(playMessage, { mediaServerName: 'Jellyfin' });
}

export function get4kMediaServerPlayLabel(
  mediaServerType: MediaServerType,
  formatMessage: IntlShape['formatMessage'],
  playMessage: MessageDescriptor,
  play4kMessage: MessageDescriptor,
  jellyfinMessage?: MessageDescriptor
): string {
  if (mediaServerType === MediaServerType.EMBY) {
    return formatMessage(playMessage, { mediaServerName: 'Emby' });
  }

  if (mediaServerType === MediaServerType.PLEX) {
    return formatMessage(play4kMessage, { mediaServerName: 'Plex' });
  }

  return formatMessage(jellyfinMessage ?? play4kMessage, {
    mediaServerName: 'Jellyfin',
  });
}
