import { Notification } from '@server/lib/notifications';
import { getNotificationStatusLabel } from '@server/lib/notifications/notificationStatusHelper';
import { describe, expect, it } from 'vitest';

describe('getNotificationStatusLabel', () => {
  it('returns "Pending Approval" for MEDIA_PENDING', () => {
    expect(getNotificationStatusLabel(Notification.MEDIA_PENDING)).toBe(
      'Pending Approval'
    );
  });

  it('returns "Processing" for MEDIA_APPROVED', () => {
    expect(getNotificationStatusLabel(Notification.MEDIA_APPROVED)).toBe(
      'Processing'
    );
  });

  it('returns "Processing" for MEDIA_AUTO_APPROVED', () => {
    expect(getNotificationStatusLabel(Notification.MEDIA_AUTO_APPROVED)).toBe(
      'Processing'
    );
  });

  it('returns "Available" for MEDIA_AVAILABLE', () => {
    expect(getNotificationStatusLabel(Notification.MEDIA_AVAILABLE)).toBe(
      'Available'
    );
  });

  it('returns "Declined" for MEDIA_DECLINED', () => {
    expect(getNotificationStatusLabel(Notification.MEDIA_DECLINED)).toBe(
      'Declined'
    );
  });

  it('returns "Failed" for MEDIA_FAILED', () => {
    expect(getNotificationStatusLabel(Notification.MEDIA_FAILED)).toBe(
      'Failed'
    );
  });

  it('returns "Automatically Requested" for MEDIA_AUTO_REQUESTED', () => {
    expect(getNotificationStatusLabel(Notification.MEDIA_AUTO_REQUESTED)).toBe(
      'Automatically Requested'
    );
  });

  it('returns empty string for TEST_NOTIFICATION', () => {
    expect(getNotificationStatusLabel(Notification.TEST_NOTIFICATION)).toBe('');
  });

  it('returns empty string for ISSUE_CREATED', () => {
    expect(getNotificationStatusLabel(Notification.ISSUE_CREATED)).toBe('');
  });

  it('returns empty string for ISSUE_COMMENT', () => {
    expect(getNotificationStatusLabel(Notification.ISSUE_COMMENT)).toBe('');
  });

  it('returns empty string for ISSUE_RESOLVED', () => {
    expect(getNotificationStatusLabel(Notification.ISSUE_RESOLVED)).toBe('');
  });

  it('returns empty string for ISSUE_REOPENED', () => {
    expect(getNotificationStatusLabel(Notification.ISSUE_REOPENED)).toBe('');
  });

  it('returns empty string for NONE', () => {
    expect(getNotificationStatusLabel(Notification.NONE)).toBe('');
  });

  it('returns empty string for an unknown numeric value', () => {
    expect(getNotificationStatusLabel(99999 as Notification)).toBe('');
  });
});
