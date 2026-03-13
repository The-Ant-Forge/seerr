import TheMovieDb from '@server/api/themoviedb';
import { getRepository } from '@server/datasource';
import { ActorSubscription } from '@server/entity/ActorSubscription';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { Router } from 'express';

const actorSubscriptionRoutes = Router();

// List current user's subscriptions
actorSubscriptionRoutes.get('/', async (req, res, next) => {
  try {
    const repo = getRepository(ActorSubscription);
    const pageSize = req.query.take ? Number(req.query.take) : 20;
    const skip = req.query.skip ? Number(req.query.skip) : 0;

    const [results, total] = await repo.findAndCount({
      where: { subscribedBy: { id: req.user?.id } },
      order: { personName: 'ASC' },
      take: pageSize,
      skip,
    });

    return res.status(200).json({
      pageInfo: {
        pages: Math.ceil(total / pageSize),
        pageSize,
        results: total,
        page: Math.ceil(skip / pageSize) + 1,
      },
      results: results.map((sub) => ({
        id: sub.id,
        personId: sub.personId,
        personName: sub.personName,
        profilePath: sub.profilePath,
        mediaFilter: sub.mediaFilter,
        creditType: sub.creditType,
        minImdbRating: sub.minImdbRating,
        action: sub.action,
        createdAt: sub.createdAt,
        lastSyncedAt: sub.lastSyncedAt,
      })),
    });
  } catch (e) {
    next({ status: 500, message: (e as Error).message });
  }
});

// Check if current user is subscribed to a person
actorSubscriptionRoutes.get('/person/:personId', async (req, res, next) => {
  try {
    const repo = getRepository(ActorSubscription);
    const sub = await repo.findOne({
      where: {
        personId: Number(req.params.personId),
        subscribedBy: { id: req.user?.id },
      },
    });

    if (!sub) {
      return res.status(200).json(null);
    }

    return res.status(200).json({
      id: sub.id,
      personId: sub.personId,
      personName: sub.personName,
      profilePath: sub.profilePath,
      mediaFilter: sub.mediaFilter,
      creditType: sub.creditType,
      minImdbRating: sub.minImdbRating,
      action: sub.action,
      createdAt: sub.createdAt,
      lastSyncedAt: sub.lastSyncedAt,
    });
  } catch (e) {
    next({ status: 500, message: (e as Error).message });
  }
});

// Create subscription
actorSubscriptionRoutes.post('/', async (req, res, next) => {
  try {
    if (!req.user) {
      return next({ status: 401, message: 'Unauthorized' });
    }

    const {
      personId,
      mediaFilter,
      creditType,
      minImdbRating,
      action,
      backfill,
    } = req.body as {
      personId: number;
      mediaFilter?: string;
      creditType?: string;
      minImdbRating?: number;
      action?: string;
      backfill?: boolean;
    };

    if (!personId) {
      return next({ status: 400, message: 'personId is required' });
    }

    const repo = getRepository(ActorSubscription);

    // Check for duplicate
    const existing = await repo.findOne({
      where: {
        personId,
        subscribedBy: { id: req.user.id },
      },
    });

    if (existing) {
      return next({ status: 409, message: 'Already following this person' });
    }

    // Fetch person details from TMDB to validate and get name/profile
    const tmdb = new TheMovieDb();
    const person = await tmdb.getPerson({ personId });

    // Seed knownCreditIds with all current credits so we don't request the back catalog
    // Unless backfill is requested — then leave empty so the sync picks up everything
    let allCreditIds: string[] = [];
    if (!backfill) {
      const credits = await tmdb.getPersonCombinedCredits({ personId });
      allCreditIds = [
        ...credits.cast.map((c) => c.credit_id),
        ...credits.crew.map((c) => c.credit_id),
      ];
    }

    const sub = new ActorSubscription({
      personId,
      personName: person.name,
      profilePath: person.profile_path ?? null,
      mediaFilter: (mediaFilter as 'all' | 'movie' | 'tv') ?? 'all',
      creditType: (creditType as 'cast' | 'crew' | 'both') ?? 'cast',
      minImdbRating: minImdbRating ?? 0,
      action: (action as 'request' | 'notify') ?? 'request',
      subscribedBy: req.user,
    });
    sub.setKnownCreditIds(allCreditIds);

    await repo.save(sub);

    logger.info(`User ${req.user.displayName} followed ${person.name}`, {
      label: 'Actor Subscription',
    });

    return res.status(201).json({
      id: sub.id,
      personId: sub.personId,
      personName: sub.personName,
      profilePath: sub.profilePath,
      mediaFilter: sub.mediaFilter,
      creditType: sub.creditType,
      minImdbRating: sub.minImdbRating,
      action: sub.action,
      createdAt: sub.createdAt,
      lastSyncedAt: sub.lastSyncedAt,
    });
  } catch (e) {
    logger.error('Failed to create actor subscription', {
      label: 'Actor Subscription',
      errorMessage: (e as Error).message,
    });
    next({ status: 500, message: (e as Error).message });
  }
});

// Update subscription
actorSubscriptionRoutes.put('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      return next({ status: 401, message: 'Unauthorized' });
    }

    const repo = getRepository(ActorSubscription);
    const sub = await repo.findOneBy({ id: Number(req.params.id) });

    if (!sub) {
      return next({ status: 404, message: 'Subscription not found' });
    }

    if (
      sub.subscribedBy.id !== req.user.id &&
      !req.user.hasPermission(Permission.ADMIN)
    ) {
      return next({ status: 403, message: 'Not authorized' });
    }

    const { mediaFilter, creditType, minImdbRating, action, backfill } =
      req.body as {
        mediaFilter?: string;
        creditType?: string;
        minImdbRating?: number;
        action?: string;
        backfill?: boolean;
      };

    if (mediaFilter) sub.mediaFilter = mediaFilter as 'all' | 'movie' | 'tv';
    if (creditType) sub.creditType = creditType as 'cast' | 'crew' | 'both';
    if (minImdbRating !== undefined) sub.minImdbRating = minImdbRating;
    if (action) sub.action = action as 'request' | 'notify';
    if (backfill) sub.setKnownCreditIds([]);

    await repo.save(sub);

    return res.status(200).json({
      id: sub.id,
      personId: sub.personId,
      personName: sub.personName,
      profilePath: sub.profilePath,
      mediaFilter: sub.mediaFilter,
      creditType: sub.creditType,
      minImdbRating: sub.minImdbRating,
      action: sub.action,
      createdAt: sub.createdAt,
      lastSyncedAt: sub.lastSyncedAt,
    });
  } catch (e) {
    next({ status: 500, message: (e as Error).message });
  }
});

// Delete subscription
actorSubscriptionRoutes.delete('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      return next({ status: 401, message: 'Unauthorized' });
    }

    const repo = getRepository(ActorSubscription);
    const sub = await repo.findOneBy({ id: Number(req.params.id) });

    if (!sub) {
      return next({ status: 404, message: 'Subscription not found' });
    }

    if (
      sub.subscribedBy.id !== req.user.id &&
      !req.user.hasPermission(Permission.ADMIN)
    ) {
      return next({ status: 403, message: 'Not authorized' });
    }

    await repo.delete(sub.id);
    return res.status(204).send();
  } catch (e) {
    next({ status: 500, message: (e as Error).message });
  }
});

export default actorSubscriptionRoutes;
