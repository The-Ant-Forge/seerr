import { hasPermission, Permission } from '@server/lib/permissions';
import { describe, expect, it } from 'vitest';

describe('hasPermission', () => {
  describe('single permission checks', () => {
    it('returns true when user has the exact permission', () => {
      expect(hasPermission(Permission.REQUEST, Permission.REQUEST)).toBe(true);
    });

    it('returns false when user lacks the permission', () => {
      expect(hasPermission(Permission.REQUEST, Permission.VOTE)).toBe(false);
    });

    it('returns true when user has multiple permissions including the checked one', () => {
      const userPerms = Permission.REQUEST | Permission.VOTE;
      expect(hasPermission(Permission.REQUEST, userPerms)).toBe(true);
      expect(hasPermission(Permission.VOTE, userPerms)).toBe(true);
    });

    it('returns true for Permission.NONE regardless of user value', () => {
      expect(hasPermission(Permission.NONE, 0)).toBe(true);
      expect(hasPermission(Permission.NONE, Permission.REQUEST)).toBe(true);
    });
  });

  describe('admin override', () => {
    it('returns true for any permission when user is admin', () => {
      expect(hasPermission(Permission.MANAGE_SETTINGS, Permission.ADMIN)).toBe(
        true
      );
      expect(hasPermission(Permission.MANAGE_USERS, Permission.ADMIN)).toBe(
        true
      );
      expect(hasPermission(Permission.MANAGE_REQUESTS, Permission.ADMIN)).toBe(
        true
      );
    });

    it('returns true for array permissions when user is admin', () => {
      expect(
        hasPermission(
          [Permission.MANAGE_SETTINGS, Permission.MANAGE_USERS],
          Permission.ADMIN
        )
      ).toBe(true);
    });
  });

  describe('array permissions with "and" type', () => {
    it('returns true when user has all permissions', () => {
      const userPerms =
        Permission.REQUEST | Permission.VOTE | Permission.REQUEST_4K;
      expect(
        hasPermission([Permission.REQUEST, Permission.VOTE], userPerms, {
          type: 'and',
        })
      ).toBe(true);
    });

    it('returns false when user is missing one permission', () => {
      const userPerms = Permission.REQUEST | Permission.VOTE;
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_REQUESTS],
          userPerms,
          { type: 'and' }
        )
      ).toBe(false);
    });

    it('defaults to "and" type when no options provided', () => {
      const userPerms = Permission.REQUEST;
      expect(
        hasPermission([Permission.REQUEST, Permission.VOTE], userPerms)
      ).toBe(false);
    });
  });

  describe('array permissions with "or" type', () => {
    it('returns true when user has at least one permission', () => {
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_REQUESTS],
          Permission.REQUEST,
          { type: 'or' }
        )
      ).toBe(true);
    });

    it('returns false when user has none of the permissions', () => {
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_REQUESTS],
          Permission.VOTE,
          { type: 'or' }
        )
      ).toBe(false);
    });
  });

  describe('bitwise edge cases', () => {
    it('handles user with no permissions (value 0)', () => {
      expect(hasPermission(Permission.REQUEST, 0)).toBe(false);
    });

    it('handles high-value permissions correctly', () => {
      expect(
        hasPermission(
          Permission.VIEW_BLOCKLIST,
          Permission.VIEW_BLOCKLIST | Permission.MANAGE_BLOCKLIST
        )
      ).toBe(true);
    });
  });
});
