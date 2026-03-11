import { Notification } from '@server/lib/notifications';

/**
 * Maps a notification type to a human-readable request status label.
 */
export function getNotificationStatusLabel(type: Notification): string {
  switch (type) {
    case Notification.MEDIA_PENDING:
      return 'Pending Approval';
    case Notification.MEDIA_APPROVED:
    case Notification.MEDIA_AUTO_APPROVED:
      return 'Processing';
    case Notification.MEDIA_AVAILABLE:
      return 'Available';
    case Notification.MEDIA_DECLINED:
      return 'Declined';
    case Notification.MEDIA_FAILED:
      return 'Failed';
    case Notification.MEDIA_AUTO_REQUESTED:
      return 'Automatically Requested';
    default:
      return '';
  }
}
