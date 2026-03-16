import IMDBRadarrProxy from '@server/api/rating/imdbRadarrProxy';
import TheMovieDb from '@server/api/themoviedb';
import type {
  TmdbPersonCreditCast,
  TmdbPersonCreditCrew,
} from '@server/api/themoviedb/interfaces';
import { MediaType } from '@server/constants/media';
import { getRepository } from '@server/datasource';
import {
  ActorSubscription,
  type RoleFilter,
} from '@server/entity/ActorSubscription';
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

// 'pass' = meets threshold, 'fail' = below threshold or old unrated junk,
// 'pending' = no rating yet but content is recent/upcoming (retry later)
type RatingResult = 'pass' | 'fail' | 'pending';

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

    // Filter out "Self" cast credits (interviews, behind-the-scenes, awards, etc.)
    const selfPattern = /\bself\b|\bhimself\b|\bherself\b|\bthemselves\b/i;
    relevantCredits = relevantCredits.filter((c) => {
      if ('character' in c && selfPattern.test(c.character)) {
        return false;
      }
      return true;
    });

    // Apply role filter
    if (sub.roleFilter !== 'any') {
      relevantCredits = relevantCredits.filter((c) =>
        this.matchesRoleFilter(c, sub.roleFilter)
      );
    }

    // Find new credits
    const newCredits = relevantCredits.filter(
      (c) => !knownIds.has(c.credit_id)
    );

    const pendingCreditIds: string[] = [];

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

      const imdbApi = new IMDBRadarrProxy();

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
          // Always check IMDb rating — filters junk and enforces minimum
          const ratingResult = await this.checkImdbRating(
            credit,
            mediaType,
            sub.minImdbRating,
            tmdb,
            imdbApi
          );

          if (ratingResult === 'pending') {
            // No rating yet but content is recent/upcoming — retry next sync
            pendingCreditIds.push(credit.credit_id);
            logger.debug(
              `Deferred "${title}" — no rating yet, will retry later`,
              { label: 'Actor Subscription Sync' }
            );
            continue;
          }

          if (ratingResult === 'fail') {
            logger.debug(
              `Skipped "${title}" — below IMDb rating threshold (${sub.minImdbRating}) or unrated old content`,
              { label: 'Actor Subscription Sync' }
            );
            continue;
          }

          await this.requestCredit(credit, mediaType, title, sub, tmdb);
        }
        // TODO: notify action — send notification via notificationManager
      }
    }

    // Update known credit IDs with ALL current credits, EXCEPT pending ones
    // so they get retried on the next sync cycle
    const pendingSet = new Set(pendingCreditIds);
    const allCurrentIds = [
      ...allCast.map((c) => c.credit_id),
      ...allCrew.map((c) => c.credit_id),
    ].filter((id) => !pendingSet.has(id));
    sub.setKnownCreditIds(allCurrentIds);
    sub.lastSyncedAt = new Date();
    await repo.save(sub);
  }

  private matchesRoleFilter(
    credit: CombinedCredit,
    roleFilter: RoleFilter
  ): boolean {
    // Cast role filters
    if (roleFilter === 'lead') {
      return 'order' in credit && (credit.order ?? 999) <= 4; // top 5 billed (0-indexed)
    }
    if (roleFilter === 'supporting') {
      return 'order' in credit && (credit.order ?? 999) > 4;
    }

    // Crew role filters — match on department/job
    if ('department' in credit) {
      switch (roleFilter) {
        case 'director':
          return credit.job === 'Director';
        case 'producer':
          return credit.department === 'Production';
        case 'writer':
          return credit.department === 'Writing';
        case 'composer':
          return credit.job === 'Original Music Composer';
        case 'cinematographer':
          return credit.job === 'Director of Photography';
      }
    }

    // Cast credit but crew-only filter selected (or vice versa) — no match
    return false;
  }

  private async checkImdbRating(
    credit: CombinedCredit,
    mediaType: MediaType,
    minRating: number,
    tmdb: TheMovieDb,
    imdbApi: IMDBRadarrProxy
  ): Promise<RatingResult> {
    try {
      let imdbId: string | undefined;

      if (mediaType === MediaType.MOVIE) {
        const movie = await tmdb.getMovie({ movieId: credit.id });
        imdbId = movie.imdb_id;
      } else {
        const tv = await tmdb.getTvShow({ tvId: credit.id });
        imdbId = tv.external_ids?.imdb_id;
      }

      // Determine release date for age check
      const releaseStr =
        mediaType === MediaType.MOVIE
          ? credit.release_date
          : credit.first_air_date;
      const releaseDate = releaseStr ? new Date(releaseStr) : null;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const isRecentOrUpcoming = !releaseDate || releaseDate > oneMonthAgo;

      if (!imdbId) {
        // No IMDb ID — if recent/upcoming, retry later; otherwise it's junk
        return isRecentOrUpcoming ? 'pending' : 'fail';
      }

      const ratings = await imdbApi.getMovieRatings(imdbId);

      if (!ratings || ratings.criticsScore === 0) {
        // No rating data — if recent/upcoming, retry later; otherwise it's junk
        return isRecentOrUpcoming ? 'pending' : 'fail';
      }

      // Has a rating — check against minimum threshold (0 = no minimum)
      if (minRating > 0 && ratings.criticsScore < minRating) {
        return 'fail';
      }

      return 'pass';
    } catch (e) {
      logger.debug(
        `Could not check IMDb rating for credit ${credit.id}: ${(e as Error).message}`,
        { label: 'Actor Subscription Sync' }
      );
      // On error, treat as pending so we retry rather than silently dropping
      return 'pending';
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
