import {
  Notification,
  getAdminPermission,
  hasNotificationType,
} from '@server/lib/notifications';
import { Permission } from '@server/lib/permissions';
import { describe, expect, it } from 'vitest';

describe('Notification enum values', () => {
  it('NONE = 0', () => {
    expect(Notification.NONE).toBe(0);
  });

  it('MEDIA_PENDING = 2', () => {
    expect(Notification.MEDIA_PENDING).toBe(2);
  });

  it('MEDIA_APPROVED = 4', () => {
    expect(Notification.MEDIA_APPROVED).toBe(4);
  });

  it('MEDIA_AVAILABLE = 8', () => {
    expect(Notification.MEDIA_AVAILABLE).toBe(8);
  });

  it('MEDIA_FAILED = 16', () => {
    expect(Notification.MEDIA_FAILED).toBe(16);
  });

  it('TEST_NOTIFICATION = 32', () => {
    expect(Notification.TEST_NOTIFICATION).toBe(32);
  });

  it('MEDIA_DECLINED = 64', () => {
    expect(Notification.MEDIA_DECLINED).toBe(64);
  });

  it('MEDIA_AUTO_APPROVED = 128', () => {
    expect(Notification.MEDIA_AUTO_APPROVED).toBe(128);
  });

  it('MEDIA_AUTO_REQUESTED = 4096', () => {
    expect(Notification.MEDIA_AUTO_REQUESTED).toBe(4096);
  });
});

describe('hasNotificationType', () => {
  it('returns true when types is NONE (0)', () => {
    expect(hasNotificationType(Notification.NONE, 0)).toBe(true);
  });

  it('returns true when value includes the notification type', () => {
    // Value has MEDIA_PENDING (2) and TEST_NOTIFICATION (32) enabled = 34
    expect(hasNotificationType(Notification.MEDIA_PENDING, 34)).toBe(true);
  });

  it('returns false when value does not include the notification type', () => {
    // Value only has MEDIA_APPROVED (4)
    expect(hasNotificationType(Notification.MEDIA_PENDING, 4)).toBe(false);
  });

  it('always allows TEST_NOTIFICATION even if not in value', () => {
    // TEST_NOTIFICATION is auto-added if missing
    expect(hasNotificationType(Notification.TEST_NOTIFICATION, 0)).toBe(true);
  });

  it('works with an array of notification types', () => {
    // Sum of MEDIA_PENDING (2) + MEDIA_APPROVED (4) = 6
    const value = 2 + 4 + 32; // PENDING + APPROVED + TEST
    expect(
      hasNotificationType(
        [Notification.MEDIA_PENDING, Notification.MEDIA_APPROVED],
        value
      )
    ).toBe(true);
  });

  it('returns true for array if any type matches in value via bitwise', () => {
    // Value = MEDIA_PENDING (2), array sum = 2 + 4 = 6, 2 & 6 = 2 (truthy)
    expect(
      hasNotificationType(
        [Notification.MEDIA_PENDING, Notification.MEDIA_APPROVED],
        2
      )
    ).toBe(true);
  });

  it('returns false for array when no types match', () => {
    // Value = MEDIA_AVAILABLE (8), check for PENDING (2) + APPROVED (4) = 6
    expect(
      hasNotificationType(
        [Notification.MEDIA_PENDING, Notification.MEDIA_APPROVED],
        8
      )
    ).toBe(false);
  });
});

describe('getAdminPermission', () => {
  it('returns MANAGE_REQUESTS for MEDIA_PENDING', () => {
    expect(getAdminPermission(Notification.MEDIA_PENDING)).toBe(
      Permission.MANAGE_REQUESTS
    );
  });

  it('returns MANAGE_REQUESTS for MEDIA_APPROVED', () => {
    expect(getAdminPermission(Notification.MEDIA_APPROVED)).toBe(
      Permission.MANAGE_REQUESTS
    );
  });

  it('returns MANAGE_REQUESTS for MEDIA_AVAILABLE', () => {
    expect(getAdminPermission(Notification.MEDIA_AVAILABLE)).toBe(
      Permission.MANAGE_REQUESTS
    );
  });

  it('returns MANAGE_REQUESTS for MEDIA_FAILED', () => {
    expect(getAdminPermission(Notification.MEDIA_FAILED)).toBe(
      Permission.MANAGE_REQUESTS
    );
  });

  it('returns MANAGE_REQUESTS for MEDIA_DECLINED', () => {
    expect(getAdminPermission(Notification.MEDIA_DECLINED)).toBe(
      Permission.MANAGE_REQUESTS
    );
  });

  it('returns MANAGE_REQUESTS for MEDIA_AUTO_APPROVED', () => {
    expect(getAdminPermission(Notification.MEDIA_AUTO_APPROVED)).toBe(
      Permission.MANAGE_REQUESTS
    );
  });

  it('returns MANAGE_ISSUES for ISSUE_CREATED', () => {
    expect(getAdminPermission(Notification.ISSUE_CREATED)).toBe(
      Permission.MANAGE_ISSUES
    );
  });

  it('returns MANAGE_ISSUES for ISSUE_COMMENT', () => {
    expect(getAdminPermission(Notification.ISSUE_COMMENT)).toBe(
      Permission.MANAGE_ISSUES
    );
  });

  it('returns MANAGE_ISSUES for ISSUE_RESOLVED', () => {
    expect(getAdminPermission(Notification.ISSUE_RESOLVED)).toBe(
      Permission.MANAGE_ISSUES
    );
  });

  it('returns MANAGE_ISSUES for ISSUE_REOPENED', () => {
    expect(getAdminPermission(Notification.ISSUE_REOPENED)).toBe(
      Permission.MANAGE_ISSUES
    );
  });

  it('returns ADMIN for unknown notification type', () => {
    expect(getAdminPermission(99999 as Notification)).toBe(Permission.ADMIN);
  });

  it('returns ADMIN for TEST_NOTIFICATION', () => {
    expect(getAdminPermission(Notification.TEST_NOTIFICATION)).toBe(
      Permission.ADMIN
    );
  });
});
