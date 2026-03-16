import Modal from '@app/components/Common/Modal';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import axios from 'axios';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';

const messages = defineMessages(
  'components.PersonDetails.ActorSubscribeModal',
  {
    followTitle: 'Follow {personName}',
    editTitle: 'Edit Following: {personName}',
    mediaFilterLabel: 'Media Type',
    mediaFilterAll: 'Movies & Series',
    mediaFilterMovie: 'Movies Only',
    mediaFilterTv: 'Series Only',
    creditTypeLabel: 'Credit Type',
    creditTypeCast: 'Acting',
    creditTypeCrew: 'Crew',
    creditTypeBoth: 'Acting & Crew',
    roleFilterLabel: 'Role',
    roleFilterAny: 'Any',
    roleFilterLead: 'Lead (Top 5 Billed)',
    roleFilterSupporting: 'Supporting',
    roleFilterDirector: 'Director',
    roleFilterProducer: 'Producer',
    roleFilterWriter: 'Writer',
    roleFilterComposer: 'Composer',
    roleFilterCinematographer: 'Cinematographer',
    minImdbRatingLabel: 'Minimum IMDb Rating',
    minImdbRatingHint:
      'Only auto-request titles rated at or above this on IMDb (0–10). 0 = no filter.',
    actionLabel: 'When New Credits Appear',
    actionRequest: 'Auto-Request',
    actionNotify: 'Notify Only',
    follow: 'Follow',
    update: 'Update',
    unfollow: 'Unfollow',
    followSuccess: 'Now following {personName}',
    updateSuccess: 'Updated following for {personName}',
    unfollowSuccess: 'Unfollowed {personName}',
    backfillLabel: 'Backfill existing credits',
    backfillHint:
      'Also request all existing credits for this person, not just future ones. This could generate a large number of requests.',
    backfillHintEdit:
      'Re-scan all credits on the next sync, including ones already processed. This could generate a large number of requests.',
    followFailed: 'Failed: {error}',
  }
);

interface ActorSubscription {
  id: number;
  personId: number;
  personName: string;
  profilePath: string | null;
  mediaFilter: string;
  creditType: string;
  roleFilter: string;
  minImdbRating: number;
  action: string;
  createdAt: string;
  lastSyncedAt: string | null;
}

interface ActorSubscribeModalProps {
  personId: number;
  personName: string;
  existing?: ActorSubscription | null;
  onClose: () => void;
  onComplete: () => void;
}

const ActorSubscribeModal = ({
  personId,
  personName,
  existing,
  onClose,
  onComplete,
}: ActorSubscribeModalProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();

  const [mediaFilter, setMediaFilter] = useState(
    existing?.mediaFilter ?? 'all'
  );
  const [creditType, setCreditType] = useState(existing?.creditType ?? 'cast');
  const [roleFilter, setRoleFilter] = useState(existing?.roleFilter ?? 'any');
  const [minImdbRating, setMinImdbRating] = useState(
    existing?.minImdbRating ?? 0
  );
  const [action, setAction] = useState(existing?.action ?? 'request');
  const [backfill, setBackfill] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (existing) {
        await axios.put(`/api/v1/actorSubscription/${existing.id}`, {
          mediaFilter,
          creditType,
          roleFilter,
          minImdbRating,
          action,
          backfill,
        });
        addToast(intl.formatMessage(messages.updateSuccess, { personName }), {
          appearance: 'success',
          autoDismiss: true,
        });
      } else {
        await axios.post('/api/v1/actorSubscription', {
          personId,
          mediaFilter,
          creditType,
          roleFilter,
          minImdbRating,
          action,
          backfill,
        });
        addToast(intl.formatMessage(messages.followSuccess, { personName }), {
          appearance: 'success',
          autoDismiss: true,
        });
      }
      onComplete();
    } catch (e) {
      addToast(
        intl.formatMessage(messages.followFailed, {
          error: (e as Error).message,
        }),
        { appearance: 'error', autoDismiss: true }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnfollow = async () => {
    if (!existing) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/v1/actorSubscription/${existing.id}`);
      addToast(intl.formatMessage(messages.unfollowSuccess, { personName }), {
        appearance: 'success',
        autoDismiss: true,
      });
      onComplete();
    } catch (e) {
      addToast(
        intl.formatMessage(messages.followFailed, {
          error: (e as Error).message,
        }),
        { appearance: 'error', autoDismiss: true }
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Transition
      as="div"
      appear
      show
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Modal
        title={intl.formatMessage(
          existing ? messages.editTitle : messages.followTitle,
          { personName }
        )}
        okText={intl.formatMessage(
          existing ? messages.update : messages.follow
        )}
        okButtonType="primary"
        onOk={handleSubmit}
        okDisabled={isSubmitting}
        onCancel={onClose}
        secondaryText={
          existing ? intl.formatMessage(messages.unfollow) : undefined
        }
        secondaryButtonType="danger"
        onSecondary={existing ? handleUnfollow : undefined}
        secondaryDisabled={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="text-label">
              {intl.formatMessage(messages.mediaFilterLabel)}
            </label>
            <select
              className=""
              value={mediaFilter}
              onChange={(e) => setMediaFilter(e.target.value)}
            >
              <option value="all">
                {intl.formatMessage(messages.mediaFilterAll)}
              </option>
              <option value="movie">
                {intl.formatMessage(messages.mediaFilterMovie)}
              </option>
              <option value="tv">
                {intl.formatMessage(messages.mediaFilterTv)}
              </option>
            </select>
          </div>

          <div>
            <label className="text-label">
              {intl.formatMessage(messages.creditTypeLabel)}
            </label>
            <select
              className=""
              value={creditType}
              onChange={(e) => {
                setCreditType(e.target.value);
                setRoleFilter('any');
              }}
            >
              <option value="cast">
                {intl.formatMessage(messages.creditTypeCast)}
              </option>
              <option value="crew">
                {intl.formatMessage(messages.creditTypeCrew)}
              </option>
              <option value="both">
                {intl.formatMessage(messages.creditTypeBoth)}
              </option>
            </select>
          </div>

          <div>
            <label className="text-label">
              {intl.formatMessage(messages.roleFilterLabel)}
            </label>
            <select
              className=""
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="any">
                {intl.formatMessage(messages.roleFilterAny)}
              </option>
              {(creditType === 'cast' || creditType === 'both') && (
                <>
                  <option value="lead">
                    {intl.formatMessage(messages.roleFilterLead)}
                  </option>
                  <option value="supporting">
                    {intl.formatMessage(messages.roleFilterSupporting)}
                  </option>
                </>
              )}
              {(creditType === 'crew' || creditType === 'both') && (
                <>
                  <option value="director">
                    {intl.formatMessage(messages.roleFilterDirector)}
                  </option>
                  <option value="producer">
                    {intl.formatMessage(messages.roleFilterProducer)}
                  </option>
                  <option value="writer">
                    {intl.formatMessage(messages.roleFilterWriter)}
                  </option>
                  <option value="composer">
                    {intl.formatMessage(messages.roleFilterComposer)}
                  </option>
                  <option value="cinematographer">
                    {intl.formatMessage(messages.roleFilterCinematographer)}
                  </option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-label">
              {intl.formatMessage(messages.minImdbRatingLabel)}
            </label>
            <input
              type="number"
              className=""
              min={0}
              max={10}
              step={0.1}
              value={minImdbRating}
              onChange={(e) =>
                setMinImdbRating(
                  Math.min(10, Math.max(0, Number(e.target.value)))
                )
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              {intl.formatMessage(messages.minImdbRatingHint)}
            </p>
          </div>

          <div>
            <label className="text-label">
              {intl.formatMessage(messages.actionLabel)}
            </label>
            <select
              className=""
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="request">
                {intl.formatMessage(messages.actionRequest)}
              </option>
              <option value="notify">
                {intl.formatMessage(messages.actionNotify)}
              </option>
            </select>
          </div>

          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={backfill}
                onChange={(e) => setBackfill(e.target.checked)}
              />
              <span className="text-sm font-medium text-white">
                {intl.formatMessage(messages.backfillLabel)}
              </span>
            </label>
            <p className="mt-1 pl-9 text-xs text-yellow-200/70">
              {intl.formatMessage(
                existing ? messages.backfillHintEdit : messages.backfillHint
              )}
            </p>
          </div>
        </div>
      </Modal>
    </Transition>
  );
};

export default ActorSubscribeModal;
