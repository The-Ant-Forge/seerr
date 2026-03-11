import { Permission, hasPermission } from '@server/lib/permissions';
import { describe, expect, it } from 'vitest';

describe('Permission enum regression', () => {
  it('NONE = 0', () => expect(Permission.NONE).toBe(0));
  it('ADMIN = 2', () => expect(Permission.ADMIN).toBe(2));
  it('MANAGE_SETTINGS = 4', () => expect(Permission.MANAGE_SETTINGS).toBe(4));
  it('MANAGE_USERS = 8', () => expect(Permission.MANAGE_USERS).toBe(8));
  it('MANAGE_REQUESTS = 16', () => expect(Permission.MANAGE_REQUESTS).toBe(16));
  it('REQUEST = 32', () => expect(Permission.REQUEST).toBe(32));
  it('VOTE = 64', () => expect(Permission.VOTE).toBe(64));
  it('AUTO_APPROVE = 128', () => expect(Permission.AUTO_APPROVE).toBe(128));
  it('AUTO_APPROVE_MOVIE = 256', () =>
    expect(Permission.AUTO_APPROVE_MOVIE).toBe(256));
  it('AUTO_APPROVE_TV = 512', () =>
    expect(Permission.AUTO_APPROVE_TV).toBe(512));
  it('REQUEST_4K = 1024', () => expect(Permission.REQUEST_4K).toBe(1024));
  it('REQUEST_4K_MOVIE = 2048', () =>
    expect(Permission.REQUEST_4K_MOVIE).toBe(2048));
  it('REQUEST_4K_TV = 4096', () => expect(Permission.REQUEST_4K_TV).toBe(4096));
  it('REQUEST_ADVANCED = 8192', () =>
    expect(Permission.REQUEST_ADVANCED).toBe(8192));
  it('REQUEST_VIEW = 16384', () => expect(Permission.REQUEST_VIEW).toBe(16384));
  it('AUTO_APPROVE_4K = 32768', () =>
    expect(Permission.AUTO_APPROVE_4K).toBe(32768));
  it('AUTO_APPROVE_4K_MOVIE = 65536', () =>
    expect(Permission.AUTO_APPROVE_4K_MOVIE).toBe(65536));
  it('AUTO_APPROVE_4K_TV = 131072', () =>
    expect(Permission.AUTO_APPROVE_4K_TV).toBe(131072));
  it('REQUEST_MOVIE = 262144', () =>
    expect(Permission.REQUEST_MOVIE).toBe(262144));
  it('REQUEST_TV = 524288', () => expect(Permission.REQUEST_TV).toBe(524288));
  it('MANAGE_ISSUES = 1048576', () =>
    expect(Permission.MANAGE_ISSUES).toBe(1048576));
  it('VIEW_ISSUES = 2097152', () =>
    expect(Permission.VIEW_ISSUES).toBe(2097152));
  it('CREATE_ISSUES = 4194304', () =>
    expect(Permission.CREATE_ISSUES).toBe(4194304));
  it('AUTO_REQUEST = 8388608', () =>
    expect(Permission.AUTO_REQUEST).toBe(8388608));
  it('AUTO_REQUEST_MOVIE = 16777216', () =>
    expect(Permission.AUTO_REQUEST_MOVIE).toBe(16777216));
  it('AUTO_REQUEST_TV = 33554432', () =>
    expect(Permission.AUTO_REQUEST_TV).toBe(33554432));
  it('RECENT_VIEW = 67108864', () =>
    expect(Permission.RECENT_VIEW).toBe(67108864));
  it('WATCHLIST_VIEW = 134217728', () =>
    expect(Permission.WATCHLIST_VIEW).toBe(134217728));
  it('MANAGE_BLOCKLIST = 268435456', () =>
    expect(Permission.MANAGE_BLOCKLIST).toBe(268435456));
  it('VIEW_BLOCKLIST = 1073741824', () =>
    expect(Permission.VIEW_BLOCKLIST).toBe(1073741824));

  it('has exactly 30 permission values', () => {
    const keys = Object.keys(Permission).filter((k) => isNaN(Number(k)));
    expect(keys).toHaveLength(30);
  });
});

describe('hasPermission extended tests', () => {
  it('admin user always has any permission', () => {
    const adminValue = Permission.ADMIN;
    expect(hasPermission(Permission.MANAGE_SETTINGS, adminValue)).toBe(true);
    expect(hasPermission(Permission.MANAGE_USERS, adminValue)).toBe(true);
    expect(hasPermission(Permission.REQUEST, adminValue)).toBe(true);
    expect(hasPermission(Permission.MANAGE_BLOCKLIST, adminValue)).toBe(true);
  });

  it('returns true when checking NONE permission regardless of value', () => {
    expect(hasPermission(Permission.NONE, 0)).toBe(true);
    expect(hasPermission(Permission.NONE, 32)).toBe(true);
  });

  it('returns false for user without the specific permission', () => {
    expect(hasPermission(Permission.MANAGE_SETTINGS, Permission.REQUEST)).toBe(
      false
    );
  });

  it('returns true for user with the specific permission', () => {
    expect(hasPermission(Permission.REQUEST, Permission.REQUEST)).toBe(true);
  });

  it('handles array with "and" type - all must match', () => {
    const value = Permission.REQUEST | Permission.VOTE;
    expect(
      hasPermission([Permission.REQUEST, Permission.VOTE], value, {
        type: 'and',
      })
    ).toBe(true);
    expect(
      hasPermission([Permission.REQUEST, Permission.MANAGE_SETTINGS], value, {
        type: 'and',
      })
    ).toBe(false);
  });

  it('handles array with "or" type - any must match', () => {
    const value = Permission.REQUEST;
    expect(
      hasPermission([Permission.REQUEST, Permission.MANAGE_SETTINGS], value, {
        type: 'or',
      })
    ).toBe(true);
  });

  it('admin bypasses array checks', () => {
    expect(
      hasPermission(
        [Permission.MANAGE_SETTINGS, Permission.MANAGE_USERS],
        Permission.ADMIN,
        { type: 'and' }
      )
    ).toBe(true);
  });

  it('combined permission bits work correctly', () => {
    const value =
      Permission.REQUEST | Permission.REQUEST_4K | Permission.AUTO_APPROVE;
    expect(hasPermission(Permission.REQUEST, value)).toBe(true);
    expect(hasPermission(Permission.REQUEST_4K, value)).toBe(true);
    expect(hasPermission(Permission.AUTO_APPROVE, value)).toBe(true);
    expect(hasPermission(Permission.MANAGE_USERS, value)).toBe(false);
  });
});
