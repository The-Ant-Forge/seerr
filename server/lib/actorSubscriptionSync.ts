import IMDBRadarrProxy from '@server/api/rating/imdbRadarrProxy';
import TheMovieDb from '@server/api/themoviedb';
import type {
  TmdbPersonCreditCast,
  TmdbPersonCreditCrew,
} from '@server/api/themoviedb/interfaces';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import { ActorSubscription } from '@server/entity/ActorSubscription';
import {
  BlocklistedMediaError,
  DuplicateMediaRequestError,
  MediaRequest,
  NoSeasonsAvailableError,
  QuotaRestrictedError,
  RequestPermissionError,
} from '@server/entity/MediaRequest';
import logger from '@server/logger';
import { Permission } from './permissions';

type CombinedCredit = TmdbPersonCreditCast | TmdbPersonCreditCrew;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ActorSubscriptionSync {
  public async syncSubscriptions(): Promise<void> {
    const repo = getRepository(ActorSubscription);
    const subs = await repo.find();

    if (subs.length === 0) return;

    // Group by personId to avoid duplicate TMDB calls
    const byPerson = new Map<number, ActorSubscription[]>();
    for (const sub of subs) {
      const group = byPerson.get(sub.personId) ?? [];
      group.push(sub);
      byPerson.set(sub.personId, group);
    }

    logger.info(
      `Processing ${subs.length} subscriptions for ${byPerson.size} people`,
      { label: 'Actor Subscription Sync' }
    );

    const tmdb = new TheMovieDb();

    for (const [personId, personSubs] of byPerson) {
      try {
        const credits = await tmdb.getPersonCombinedCredits({ personId });

        for (const sub of personSubs) {
          await this.processSub(sub, credits.cast, credits.crew, tmdb);
        }
      } catch (e) {
        logger.error(`Failed to fetch credits for person ${personId}`, {
          label: 'Actor Subscription Sync',
          errorMessage: (e as Error).message,
        });
      }

      // Rate limit: 300ms between person fetches
      await delay(300);
    }
  }

  private async processSub(
    sub: ActorSubscription,
    allCast: TmdbPersonCreditCast[],
    allCrew: TmdbPersonCreditCrew[],
    tmdb: TheMovieDb
  ): Promise<void> {
    const repo = getRepository(ActorSubscription);
    const knownIds = new Set(sub.getKnownCreditIds());

    // Filter credits by subscription settings
    let relevantCredits: CombinedCredit[] = [];

    if (sub.creditType === 'cast' || sub.creditType === 'both') {
      relevantCredits.push(...allCast);
    }
    if (sub.creditType === 'crew' || sub.creditType === 'both') {
      relevantCredits.push(...allCrew);
    }

    // Filter by media type
    if (sub.mediaFilter !== 'all') {
      relevantCredits = relevantCredits.filter(
        (c) => c.media_type === sub.mediaFilter
      );
    }

    // Filter out adult content
    relevantCredits = relevantCredits.filter((c) => !c.adult);

    // Find new credits
    const newCredits = relevantCredits.filter(
      (c) => !knownIds.has(c.credit_id)
    );

    if (newCredits.length > 0) {
      logger.info(
        `Found ${newCredits.length} new credits for ${sub.personName} (user: ${sub.subscribedBy.displayName})`,
        { label: 'Actor Subscription Sync' }
      );

      // Check if user has auto-request permission
      const canAutoRequest = sub.subscribedBy.hasPermission(
        [
          Permission.AUTO_REQUEST,
          Permission.AUTO_REQUEST_MOVIE,
          Permission.AUTO_REQUEST_TV,
        ],
        { type: 'or' }
      );

      const imdbApi = sub.minImdbRating > 0 ? new IMDBRadarrProxy() : undefined;

      for (const credit of newCredits) {
        const title = credit.title || credit.name || 'Unknown';
        const mediaType =
          credit.media_type === 'movie' ? MediaType.MOVIE : MediaType.TV;

        // Check type-specific auto-request permission
        const canRequestType =
          mediaType === MediaType.MOVIE
            ? sub.subscribedBy.hasPermission(
                [Permission.AUTO_REQUEST, Permission.AUTO_REQUEST_MOVIE],
                { type: 'or' }
              )
            : sub.subscribedBy.hasPermission(
                [Permission.AUTO_REQUEST, Permission.AUTO_REQUEST_TV],
                { type: 'or' }
              );

        if (sub.action === 'request' && canAutoRequest && canRequestType) {
          // Check IMDb rating if a minimum is configured
          if (imdbApi && sub.minImdbRating > 0) {
            const meetsRating = await this.checkImdbRating(
              credit,
              mediaType,
              sub.minImdbRating,
              tmdb,
              imdbApi
            );
            if (!meetsRating) {
              logger.debug(
                `Skipped "${title}" — below IMDb rating threshold (${sub.minImdbRating})`,
                { label: 'Actor Subscription Sync' }
              );
              continue;
            }
          }

          await this.requestCredit(credit, mediaType, title, sub, tmdb);
        }
        // TODO: notify action — send notification via notificationManager
      }
    }

    // Update known credit IDs with ALL current credits (not just filtered ones)
    const allCurrentIds = [
      ...allCast.map((c) => c.credit_id),
      ...allCrew.map((c) => c.credit_id),
    ];
    sub.setKnownCreditIds(allCurrentIds);
    sub.lastSyncedAt = new Date();
    await repo.save(sub);
  }

  private async checkImdbRating(
    credit: CombinedCredit,
    mediaType: MediaType,
    minRating: number,
    tmdb: TheMovieDb,
    imdbApi: IMDBRadarrProxy
  ): Promise<boolean> {
    try {
      let imdbId: string | undefined;

      if (mediaType === MediaType.MOVIE) {
        const movie = await tmdb.getMovie({ movieId: credit.id });
        imdbId = movie.imdb_id;
      } else {
        const tv = await tmdb.getTvShow({ tvId: credit.id });
        imdbId = tv.external_ids?.imdb_id;
      }

      if (!imdbId) {
        // No IMDb ID available — let it through (don't block on missing data)
        return true;
      }

      const ratings = await imdbApi.getMovieRatings(imdbId);
      if (!ratings) {
        // No rating data available — let it through
        return true;
      }

      return ratings.criticsScore >= minRating;
    } catch (e) {
      logger.debug(
        `Could not check IMDb rating for credit ${credit.id}: ${(e as Error).message}`,
        { label: 'Actor Subscription Sync' }
      );
      // On error, let it through rather than silently dropping
      return true;
    }
  }

  private async requestCredit(
    credit: CombinedCredit,
    mediaType: MediaType,
    title: string,
    sub: ActorSubscription,
    tmdb: TheMovieDb
  ): Promise<void> {
    try {
      let tvdbId: number | undefined;

      // For TV shows, we need to fetch the tvdbId
      if (mediaType === MediaType.TV) {
        try {
          const tvShow = await tmdb.getTvShow({ tvId: credit.id });
          tvdbId = tvShow.external_ids?.tvdb_id;
        } catch {
          logger.debug(
            `Could not fetch TV details for ${title} (tmdb: ${credit.id})`,
            { label: 'Actor Subscription Sync' }
          );
          return;
        }
      }

      logger.info(
        `Auto-requesting "${title}" for ${sub.subscribedBy.displayName} (following ${sub.personName})`,
        { label: 'Actor Subscription Sync' }
      );

      await MediaRequest.request(
        {
          mediaId: credit.id,
          mediaType,
          seasons: mediaType === MediaType.TV ? 'all' : undefined,
          tvdbId,
          is4k: false,
        },
        sub.subscribedBy,
        { isAutoRequest: true }
      );
    } catch (e) {
      if (!(e instanceof Error)) return;

      switch (e.constructor) {
        case RequestPermissionError:
        case DuplicateMediaRequestError:
        case QuotaRestrictedError:
        case NoSeasonsAvailableError:
          logger.debug(
            `Skipped requesting "${title}" from actor subscription`,
            {
              label: 'Actor Subscription Sync',
              errorMessage: e.message,
            }
          );
          break;
        case BlocklistedMediaError:
          break;
        default:
          logger.error(`Failed to request "${title}" from actor subscription`, {
            label: 'Actor Subscription Sync',
            errorMessage: e.message,
          });
      }
    }
  }
}

const actorSubscriptionSync = new ActorSubscriptionSync();

export default actorSubscriptionSync;
