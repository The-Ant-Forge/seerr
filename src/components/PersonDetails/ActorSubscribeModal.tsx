import Modal from '@app/components/Common/Modal';
import defineMessages from '@app/utils/defineMessages';
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
    minVoteCountLabel: 'Minimum Vote Count',
    minVoteCountHint:
      'Filter out obscure titles with few votes. 0 = no filter.',
    actionLabel: 'When New Credits Appear',
    actionRequest: 'Auto-Request',
    actionNotify: 'Notify Only',
    follow: 'Follow',
    update: 'Update',
    unfollow: 'Unfollow',
    followSuccess: 'Now following {personName}',
    updateSuccess: 'Updated following for {personName}',
    unfollowSuccess: 'Unfollowed {personName}',
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
  minVoteCount: number;
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
  const [minVoteCount, setMinVoteCount] = useState(existing?.minVoteCount ?? 0);
  const [action, setAction] = useState(existing?.action ?? 'request');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (existing) {
        await axios.put(`/api/v1/actorSubscription/${existing.id}`, {
          mediaFilter,
          creditType,
          minVoteCount,
          action,
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
          minVoteCount,
          action,
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
    <Modal
      title={intl.formatMessage(
        existing ? messages.editTitle : messages.followTitle,
        { personName }
      )}
      okText={intl.formatMessage(existing ? messages.update : messages.follow)}
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
            className="rounded-only"
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
            className="rounded-only"
            value={creditType}
            onChange={(e) => setCreditType(e.target.value)}
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
            {intl.formatMessage(messages.minVoteCountLabel)}
          </label>
          <input
            type="number"
            className="rounded-only"
            min={0}
            value={minVoteCount}
            onChange={(e) =>
              setMinVoteCount(Math.max(0, Number(e.target.value)))
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            {intl.formatMessage(messages.minVoteCountHint)}
          </p>
        </div>

        <div>
          <label className="text-label">
            {intl.formatMessage(messages.actionLabel)}
          </label>
          <select
            className="rounded-only"
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
      </div>
    </Modal>
  );
};

export default ActorSubscribeModal;
