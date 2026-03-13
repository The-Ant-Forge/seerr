import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import Header from '@app/components/Common/Header';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import PageTitle from '@app/components/Common/PageTitle';
import ActorSubscribeModal from '@app/components/PersonDetails/ActorSubscribeModal';
import defineMessages from '@app/utils/defineMessages';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';

const messages = defineMessages('components.FollowingList', {
  following: 'Following',
  noFollowing:
    'You are not following anyone yet. Visit a person page to follow them.',
  mediaFilterAll: 'All',
  mediaFilterMovie: 'Movies',
  mediaFilterTv: 'Series',
  creditTypeCast: 'Acting',
  creditTypeCrew: 'Crew',
  creditTypeBoth: 'Both',
  actionRequest: 'Auto-Request',
  actionNotify: 'Notify',
  lastSynced: 'Last synced {date}',
  neverSynced: 'Never synced',
  unfollowSuccess: 'Unfollowed {personName}',
  unfollowFailed: 'Failed to unfollow: {error}',
});

interface ActorSubscription {
  id: number;
  personId: number;
  personName: string;
  profilePath: string | null;
  mediaFilter: string;
  creditType: string;
  minImdbRating: number;
  action: string;
  createdAt: string;
  lastSyncedAt: string | null;
}

interface FollowingResponse {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: ActorSubscription[];
}

const FollowingList = () => {
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();
  const [editSub, setEditSub] = useState<ActorSubscription | null>(null);

  const page = router.query.page ? Number(router.query.page) : 1;
  const pageIndex = page - 1;
  const pageSize = 20;

  const { data, error, mutate } = useSWR<FollowingResponse>(
    `/api/v1/actorSubscription?take=${pageSize}&skip=${pageIndex * pageSize}`
  );

  const handleDelete = async (sub: ActorSubscription) => {
    try {
      await axios.delete(`/api/v1/actorSubscription/${sub.id}`);
      addToast(
        intl.formatMessage(messages.unfollowSuccess, {
          personName: sub.personName,
        }),
        { appearance: 'success', autoDismiss: true }
      );
      mutate();
    } catch (e) {
      addToast(
        intl.formatMessage(messages.unfollowFailed, {
          error: (e as Error).message,
        }),
        { appearance: 'error', autoDismiss: true }
      );
    }
  };

  const mediaFilterLabel = (filter: string) => {
    switch (filter) {
      case 'movie':
        return intl.formatMessage(messages.mediaFilterMovie);
      case 'tv':
        return intl.formatMessage(messages.mediaFilterTv);
      default:
        return intl.formatMessage(messages.mediaFilterAll);
    }
  };

  const creditTypeLabel = (type: string) => {
    switch (type) {
      case 'crew':
        return intl.formatMessage(messages.creditTypeCrew);
      case 'both':
        return intl.formatMessage(messages.creditTypeBoth);
      default:
        return intl.formatMessage(messages.creditTypeCast);
    }
  };

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const hasNextPage = data ? pageIndex + 1 < data.pageInfo.pages : false;
  const hasPrevPage = pageIndex > 0;

  return (
    <>
      <PageTitle title={intl.formatMessage(messages.following)} />
      {editSub && (
        <ActorSubscribeModal
          personId={editSub.personId}
          personName={editSub.personName}
          existing={editSub}
          onClose={() => setEditSub(null)}
          onComplete={() => {
            setEditSub(null);
            mutate();
          }}
        />
      )}
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header>{intl.formatMessage(messages.following)}</Header>
      </div>

      {data?.results.length === 0 ? (
        <p className="text-center text-gray-400">
          {intl.formatMessage(messages.noFollowing)}
        </p>
      ) : (
        <>
          <div className="flex flex-col space-y-3">
            {data?.results.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center rounded-lg bg-gray-800 p-4 ring-1 ring-gray-700"
              >
                <Link href={`/person/${sub.personId}`}>
                  <div className="relative mr-4 h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
                    {sub.profilePath ? (
                      <CachedImage
                        type="tmdb"
                        src={`https://image.tmdb.org/t/p/w185${sub.profilePath}`}
                        alt={sub.personName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        fill
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-700 text-lg text-gray-300">
                        {sub.personName.charAt(0)}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="min-w-0 flex-grow">
                  <Link
                    href={`/person/${sub.personId}`}
                    className="text-lg font-semibold text-white hover:underline"
                  >
                    {sub.personName}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge badgeType="default">
                      {mediaFilterLabel(sub.mediaFilter)}
                    </Badge>
                    <Badge badgeType="default">
                      {creditTypeLabel(sub.creditType)}
                    </Badge>
                    <Badge
                      badgeType={
                        sub.action === 'request' ? 'success' : 'warning'
                      }
                    >
                      {sub.action === 'request'
                        ? intl.formatMessage(messages.actionRequest)
                        : intl.formatMessage(messages.actionNotify)}
                    </Badge>
                    {sub.minImdbRating > 0 && (
                      <Badge badgeType="default">
                        IMDb ≥ {sub.minImdbRating}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {sub.lastSyncedAt
                      ? intl.formatMessage(messages.lastSynced, {
                          date: intl.formatDate(sub.lastSyncedAt, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          }),
                        })
                      : intl.formatMessage(messages.neverSynced)}
                  </div>
                </div>
                <div className="ml-4 flex flex-shrink-0 gap-2">
                  <Button buttonType="ghost" onClick={() => setEditSub(sub)}>
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                  <Button buttonType="danger" onClick={() => handleDelete(sub)}>
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {(hasNextPage || hasPrevPage) && (
            <nav className="mt-6 flex items-center justify-center space-x-4">
              <Button
                buttonType="default"
                disabled={!hasPrevPage}
                onClick={() =>
                  router.push({
                    pathname: router.pathname,
                    query: { ...router.query, page: page - 1 },
                  })
                }
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-400">
                {page} / {data?.pageInfo.pages ?? 1}
              </span>
              <Button
                buttonType="default"
                disabled={!hasNextPage}
                onClick={() =>
                  router.push({
                    pathname: router.pathname,
                    query: { ...router.query, page: page + 1 },
                  })
                }
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  );
};

export default FollowingList;
