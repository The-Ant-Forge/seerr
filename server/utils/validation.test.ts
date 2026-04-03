import validator from 'validator';
import { describe, expect, it } from 'vitest';

/**
 * Tests for the validator package usage in Seerr.
 * The app uses validator.isEmail() in auth routes and email notifications.
 * These tests ensure the validation behavior we depend on doesn't change
 * across upgrades.
 */
describe('validator.isEmail', () => {
  it('accepts standard email addresses', () => {
    expect(validator.isEmail('user@example.com')).toBe(true);
    expect(validator.isEmail('user.name@example.com')).toBe(true);
    expect(validator.isEmail('user+tag@example.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validator.isEmail('')).toBe(false);
    expect(validator.isEmail('not-an-email')).toBe(false);
    expect(validator.isEmail('@example.com')).toBe(false);
    expect(validator.isEmail('user@')).toBe(false);
  });

  it('accepts emails without TLD when require_tld is false', () => {
    // This matches how Seerr uses it in auth.ts:
    // validator.isEmail(user.email, { require_tld: false })
    expect(validator.isEmail('user@localhost', { require_tld: false })).toBe(
      true
    );
    expect(validator.isEmail('admin@intranet', { require_tld: false })).toBe(
      true
    );
  });

  it('rejects emails without TLD by default', () => {
    expect(validator.isEmail('user@localhost')).toBe(false);
  });
});
