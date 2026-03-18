import type { PlexDevice } from '@server/interfaces/api/plexInterfaces';
import cacheManager from '@server/lib/cache';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { randomUUID } from 'node:crypto';
import xml2js from 'xml2js';
import ExternalAPI from './externalapi';

interface PlexAccountResponse {
  user: PlexUser;
}

interface PlexUser {
  id: number;
  uuid: string;
  email: string;
  joined_at: string;
  username: string;
  title: string;
  thumb: string;
  hasPassword: boolean;
  authToken: string;
  subscription: {
    active: boolean;
    status: string;
    plan: string;
    features: string[];
  };
  roles: {
    roles: string[];
  };
  entitlements: string[];
}

// JSON response from /api/v2/resources
interface PlexTvResourceConnection {
  protocol: string;
  address: string;
  port: number;
  uri: string;
  local: boolean;
}

interface PlexTvResource {
  name: string;
  product: string;
  productVersion: string;
  platform: string;
  platformVersion: string;
  device: string;
  clientIdentifier: string;
  createdAt: string;
  lastSeenAt: string;
  provides: string;
  owned: boolean;
  accessToken?: string;
  publicAddress?: string;
  httpsRequired?: boolean;
  synced?: boolean;
  relay?: boolean;
  dnsRebindingProtection?: boolean;
  natLoopbackSupported?: boolean;
  publicAddressMatches?: boolean;
  presence?: boolean;
  ownerId?: string;
  home?: boolean;
  sourceTitle?: string;
  connections: PlexTvResourceConnection[];
}

// JSON response from /api/users
interface PlexTvUserServer {
  id: string;
  serverId: string;
  machineIdentifier: string;
  name: string;
  lastSeenAt: string;
  numLibraries: string;
  owned: string;
}

export interface PlexTvUser {
  id: string;
  title: string;
  username: string;
  email: string;
  thumb: string;
  Server?: PlexTvUserServer[];
}

export interface UsersResponse {
  MediaContainer: {
    User: PlexTvUser[];
  };
}

interface WatchlistResponse {
  MediaContainer: {
    totalSize: number;
    Metadata?: {
      ratingKey: string;
    }[];
  };
}

interface MetadataResponse {
  MediaContainer: {
    Metadata: {
      ratingKey: string;
      type: 'movie' | 'show';
      title: string;
      Guid?: {
        id: `imdb://tt${number}` | `tmdb://${number}` | `tvdb://${number}`;
      }[];
    }[];
  };
}

export interface PlexWatchlistItem {
  ratingKey: string;
  tmdbId: number;
  tvdbId?: number;
  type: 'movie' | 'show';
  title: string;
}

export interface PlexWatchlistCache {
  etag: string;
  response: WatchlistResponse;
}

class PlexTvAPI extends ExternalAPI {
  private authToken: string;

  constructor(authToken: string) {
    const settings = getSettings();

    super(
      'https://plex.tv',
      {},
      {
        headers: {
          'X-Plex-Token': authToken,
          'X-Plex-Client-Identifier': settings.clientId,
          'X-Plex-Product': 'Seerr',
          'X-Plex-Device-Name': 'Seerr',
          'X-Plex-Platform': 'Seerr',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        nodeCache: cacheManager.getCache('plextv').data,
      }
    );

    this.authToken = authToken;
  }

  public async getDevices(): Promise<PlexDevice[]> {
    try {
      const response = await this.axios.get<PlexTvResource[]>(
        '/api/v2/resources',
        { params: { includeHttps: 1, includeRelay: 1 } }
      );

      return (response.data ?? []).map((resource) => ({
        name: resource.name,
        product: resource.product,
        productVersion: resource.productVersion,
        platform: resource.platform,
        platformVersion: resource.platformVersion,
        device: resource.device,
        clientIdentifier: resource.clientIdentifier,
        createdAt: new Date(resource.createdAt),
        lastSeenAt: new Date(resource.lastSeenAt),
        provides: resource.provides.split(','),
        owned: resource.owned,
        accessToken: resource.accessToken,
        publicAddress: resource.publicAddress,
        publicAddressMatches: resource.publicAddressMatches ?? false,
        httpsRequired: resource.httpsRequired ?? false,
        synced: resource.synced ?? false,
        relay: resource.relay ?? false,
        dnsRebindingProtection: resource.dnsRebindingProtection ?? false,
        natLoopbackSupported: resource.natLoopbackSupported ?? false,
        presence: resource.presence ?? false,
        ownerID: resource.ownerId,
        home: resource.home ?? false,
        sourceTitle: resource.sourceTitle,
        connection: resource.connections?.map((conn) => ({
          protocol: conn.protocol,
          address: conn.address,
          port: conn.port,
          uri: conn.uri,
          local: conn.local,
        })),
      }));
    } catch (e) {
      logger.error('Something went wrong getting the devices from plex.tv', {
        label: 'Plex.tv API',
        errorMessage: e.message,
      });
      throw new Error('Invalid auth token');
    }
  }

  public async getUser(): Promise<PlexUser> {
    try {
      const account = await this.axios.get<PlexAccountResponse>(
        '/users/account.json'
      );

      return account.data.user;
    } catch (e) {
      logger.error(
        `Something went wrong while getting the account from plex.tv: ${e.message}`,
        { label: 'Plex.tv API' }
      );
      throw new Error('Invalid auth token');
    }
  }

  public async checkUserAccess(userId: number): Promise<boolean> {
    const settings = getSettings();

    try {
      if (!settings.plex.machineId) {
        throw new Error('Plex is not configured!');
      }

      const usersResponse = await this.getUsers();

      const users = usersResponse.MediaContainer.User;

      const user = users.find((u) => parseInt(u.id) === userId);

      if (!user) {
        throw new Error(
          "This user does not exist on the main Plex account's shared list"
        );
      }

      return !!user.Server?.find(
        (server) => server.machineIdentifier === settings.plex.machineId
      );
    } catch (e) {
      logger.error(`Error checking user access: ${e.message}`);
      return false;
    }
  }

  public async getUsers(): Promise<UsersResponse> {
    // Plex /api/users always returns XML regardless of Accept header
    const response = await this.axios.get('/api/users', {
      headers: { Accept: 'application/xml' },
      transformResponse: (data: string) => data, // prevent axios JSON parse
    });

    const parsed = await xml2js.parseStringPromise(response.data, {
      explicitArray: false,
    });

    const container = parsed.MediaContainer;
    const rawUsers = container.User
      ? Array.isArray(container.User)
        ? container.User
        : [container.User]
      : [];

    return {
      MediaContainer: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        User: rawUsers.map(
          (u: any): PlexTvUser => ({
            id: u.$.id,
            title: u.$.title,
            username: u.$.username || u.$.title,
            email: u.$.email,
            thumb: u.$.thumb,
            Server: u.Server
              ? (Array.isArray(u.Server) ? u.Server : [u.Server]).map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (s: any) => ({
                    id: s.$.id,
                    serverId: s.$.serverId,
                    machineIdentifier: s.$.machineIdentifier,
                    name: s.$.name,
                    lastSeenAt: s.$.lastSeenAt,
                    numLibraries: s.$.numLibraries,
                    owned: s.$.owned,
                  })
                )
              : undefined,
          })
        ),
      },
    };
  }

  public async getWatchlist({
    offset = 0,
    size = 20,
  }: { offset?: number; size?: number } = {}): Promise<{
    offset: number;
    size: number;
    totalSize: number;
    items: PlexWatchlistItem[];
  }> {
    try {
      const watchlistCache = cacheManager.getCache('plexwatchlist');
      let cachedWatchlist = watchlistCache.data.get<PlexWatchlistCache>(
        this.authToken
      );

      const response = await this.axios.get<WatchlistResponse>(
        '/library/sections/watchlist/all',
        {
          params: {
            'X-Plex-Container-Start': offset,
            'X-Plex-Container-Size': size,
          },
          headers: {
            'If-None-Match': cachedWatchlist?.etag,
          },
          baseURL: 'https://discover.provider.plex.tv',
          validateStatus: (status) => status < 400, // Allow HTTP 304 to return without error
        }
      );

      // If we don't recieve HTTP 304, the watchlist has been updated and we need to update the cache.
      if (response.status >= 200 && response.status <= 299) {
        cachedWatchlist = {
          etag: response.headers.etag,
          response: response.data,
        };

        watchlistCache.data.set<PlexWatchlistCache>(
          this.authToken,
          cachedWatchlist
        );
      }

      const watchlistDetails = await Promise.all(
        (cachedWatchlist?.response.MediaContainer.Metadata ?? []).map(
          async (watchlistItem) => {
            let detailedResponse: MetadataResponse;
            try {
              detailedResponse = await this.getRolling<MetadataResponse>(
                `/library/metadata/${watchlistItem.ratingKey}`,
                {
                  baseURL: 'https://discover.provider.plex.tv',
                }
              );
            } catch (e) {
              if (e.response?.status === 404) {
                logger.warn(
                  `Item with ratingKey ${watchlistItem.ratingKey} not found, it may have been removed from the server.`,
                  { label: 'Plex.TV Metadata API' }
                );
                return null;
              } else {
                throw e;
              }
            }

            const metadata = detailedResponse.MediaContainer.Metadata[0];

            const tmdbString = metadata.Guid?.find((guid) =>
              guid.id.startsWith('tmdb')
            );
            const tvdbString = metadata.Guid?.find((guid) =>
              guid.id.startsWith('tvdb')
            );

            return {
              ratingKey: metadata.ratingKey,
              // This should always be set? But I guess it also cannot be?
              // We will filter out the 0's afterwards
              tmdbId: tmdbString ? Number(tmdbString.id.split('//')[1]) : 0,
              tvdbId: tvdbString
                ? Number(tvdbString.id.split('//')[1])
                : undefined,
              title: metadata.title,
              type: metadata.type,
            };
          }
        )
      );

      const filteredList = watchlistDetails.filter(
        (detail) => detail?.tmdbId
      ) as PlexWatchlistItem[];

      return {
        offset,
        size,
        totalSize: cachedWatchlist?.response.MediaContainer.totalSize ?? 0,
        items: filteredList,
      };
    } catch (e) {
      logger.error('Failed to retrieve watchlist items', {
        label: 'Plex.TV Metadata API',
        errorMessage: e.message,
      });
      return {
        offset,
        size,
        totalSize: 0,
        items: [],
      };
    }
  }

  public async pingToken() {
    try {
      const response = await this.axios.get('/api/v2/ping', {
        headers: {
          'X-Plex-Client-Identifier': randomUUID(),
        },
      });
      if (!response?.data?.pong) {
        throw new Error('No pong response');
      }
    } catch (e) {
      logger.error('Failed to ping token', {
        label: 'Plex Refresh Token',
        errorMessage: e.message,
      });
    }
  }
}

export default PlexTvAPI;
