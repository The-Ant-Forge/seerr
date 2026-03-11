import { MediaServerType } from '@server/constants/server';

const migrateHostname = (settings: any): any => {
  const oldMediaServerType = settings.main.mediaServerType;
  if (
    oldMediaServerType === MediaServerType.JELLYFIN &&
    process.env.JELLYFIN_TYPE === 'emby'
  ) {
    settings.main.mediaServerType = MediaServerType.EMBY;
  }

  return settings;
};

export default migrateHostname;
