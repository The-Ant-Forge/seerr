# Spec: Actor Subscriptions ("Following")

**Date:** 2026-03-12
**Status:** Implemented

## Overview

Users can "follow" actors/people on TMDB. A daily scheduled job checks each followed person's combined credits for new entries. When new credits appear that match the user's filter criteria, Seerr auto-requests them or sends a notification.

## How it works

1. User visits a person page (e.g., `/person/12345`) and clicks the "Follow" button
2. A modal lets them configure: media type (movies/series/both), credit type (acting/crew/both), minimum vote count threshold, and action (auto-request or notify)
3. On creation, all existing credits are seeded as "known" to avoid requesting the back catalog
4. A daily job (2 AM) checks TMDB for new credits, diffs against known credits, and processes new ones
5. Users manage their subscriptions at `/following` in the sidebar

## Entity: ActorSubscription

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | int (PK) | auto | Primary key |
| `personId` | int, indexed | — | TMDB person ID |
| `personName` | varchar | — | Cached display name |
| `profilePath` | varchar, nullable | — | Cached TMDB profile image path |
| `mediaFilter` | varchar | `'all'` | `'all'` / `'movie'` / `'tv'` |
| `creditType` | varchar | `'cast'` | `'cast'` / `'crew'` / `'both'` |
| `minImdbRating` | int | `0` | Quality threshold (0 = no filter) |
| `action` | varchar | `'request'` | `'request'` / `'notify'` |
| `knownCreditIds` | text | `'[]'` | JSON array of processed TMDB credit_id strings |
| `subscribedBy` | FK → User | — | The user who created this subscription |
| `createdAt` | datetime | now | Creation timestamp |
| `updatedAt` | datetime | now | Last update timestamp |
| `lastSyncedAt` | datetime, nullable | null | Last successful sync timestamp |

Unique constraint: `(personId, subscribedBy)` — one subscription per person per user.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/actorSubscription` | User | List user's subscriptions (paginated) |
| `POST` | `/api/v1/actorSubscription` | User | Create subscription (seeds known credits) |
| `PUT` | `/api/v1/actorSubscription/:id` | Owner/Admin | Update subscription settings |
| `DELETE` | `/api/v1/actorSubscription/:id` | Owner/Admin | Delete subscription |
| `GET` | `/api/v1/actorSubscription/person/:personId` | User | Check subscription status for a person |

## Sync Job

- **Job ID:** `actor-subscription-sync`
- **Default schedule:** `0 0 2 * * *` (daily at 2 AM)
- **Logic:**
  1. Load all subscriptions, group by personId
  2. For each unique person: one TMDB `getPersonCombinedCredits()` call
  3. For each subscription: filter credits by mediaFilter, creditType, minImdbRating
  4. Diff credit_ids against knownCreditIds to find new ones
  5. For new credits with action=request: check user has AUTO_REQUEST permission, call `MediaRequest.request({ isAutoRequest: true })`
  6. Update knownCreditIds with full current set, update lastSyncedAt
  7. 300ms delay between person fetches for TMDB rate limiting

## UI

### Person page (`/person/:id`)
- "Follow" / "Following" button next to person name (heart icon)
- Clicking opens configuration modal

### Following page (`/following`)
- Sidebar nav item beneath "Series" (heart icon)
- Lists all subscriptions with: avatar, name, media filter badge, action badge, last synced date
- Edit (opens modal) and delete buttons per row
- Paginated

### Subscribe Modal
- Media type selector (Movies & Series / Movies Only / Series Only)
- Credit type selector (Acting / Crew / Acting & Crew)
- Minimum vote count input
- Action selector (Auto-Request / Notify Only)
- If editing: Update + Unfollow buttons

## Permissions

- Any authenticated user can create subscriptions
- Auto-request only fires if user has AUTO_REQUEST permission; otherwise falls back to notify
- Edit/delete restricted to subscription owner or admin

## Key Design Decisions

1. **No billing `order` field** — TMDB combined_credits doesn't return it. Using `IMDb rating` as quality proxy instead.
2. **Credit ID tracking** — Stores all known credit_ids as JSON text. Seeded on creation to prevent back-catalog flood.
3. **TMDB efficiency** — Groups subscriptions by personId for one API call per person, not per subscription.
4. **Crew support** — Can follow someone as director/writer via creditType='crew'.

## Implementation Files

### Created
- `server/entity/ActorSubscription.ts` — TypeORM entity
- `server/migration/sqlite/1773275799528-AddActorSubscriptions.ts`
- `server/migration/postgres/1773275799528-AddActorSubscriptions.ts`
- `server/routes/actorSubscription.ts` — CRUD + check routes
- `server/lib/actorSubscriptionSync.ts` — Daily sync job
- `src/pages/following/index.tsx` — Next.js page
- `src/components/FollowingList/index.tsx` — List component
- `src/components/PersonDetails/ActorSubscribeModal.tsx` — Subscribe modal

### Modified
- `server/entity/User.ts` — Added actorSubscriptions relation
- `server/routes/index.ts` — Mounted actorSubscription routes
- `server/lib/settings/index.ts` — Added JobId + default schedule
- `server/job/schedule.ts` — Registered sync job
- `src/components/PersonDetails/index.tsx` — Added Follow button
- `src/components/Layout/Sidebar/index.tsx` — Added nav item
- `seerr-api.yml` — OpenAPI specs for 5 endpoints
