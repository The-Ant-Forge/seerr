import {
  escapeRegExp,
  findIndex,
  isEqual,
  merge,
  mergeWith,
  omit,
  set,
  sortBy,
  truncate,
  uniqWith,
} from 'lodash';
import { describe, expect, it } from 'vitest';

/**
 * Tests for the lodash functions used across Seerr.
 * Each test covers the specific behavior we depend on, so we catch
 * any regressions when upgrading lodash.
 */
describe('lodash functions used by Seerr', () => {
  describe('truncate (MediaRequest, MediaRequestSubscriber)', () => {
    it('truncates long strings', () => {
      const long = 'A'.repeat(200);
      expect(truncate(long, { length: 50 }).length).toBeLessThanOrEqual(50);
      expect(truncate(long, { length: 50 })).toMatch(/\.\.\.$/);
    });

    it('leaves short strings unchanged', () => {
      expect(truncate('short', { length: 50 })).toBe('short');
    });
  });

  describe('mergeWith (Settings deep merge)', () => {
    it('deep merges objects', () => {
      const defaults = { a: 1, b: { c: 2, d: 3 } };
      const overrides = { b: { c: 99 } };
      const result = mergeWith({}, defaults, overrides);

      expect(result).toEqual({ a: 1, b: { c: 99, d: 3 } });
    });

    it('supports custom array handling via customizer', () => {
      const customizer = (objValue: unknown, srcValue: unknown) => {
        if (Array.isArray(objValue)) {
          return srcValue; // Replace arrays instead of merging
        }
      };

      const defaults = { tags: [1, 2, 3] };
      const overrides = { tags: [4, 5] };
      const result = mergeWith({}, defaults, overrides, customizer);

      expect(result.tags).toEqual([4, 5]);
    });
  });

  describe('sortBy (routes, TMDB API)', () => {
    it('sorts objects by a key', () => {
      const items = [
        { name: 'Charlie', order: 3 },
        { name: 'Alpha', order: 1 },
        { name: 'Bravo', order: 2 },
      ];
      const sorted = sortBy(items, 'order');
      expect(sorted.map((i) => i.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });
  });

  describe('escapeRegExp (settings routes)', () => {
    it('escapes special regex characters', () => {
      const escaped = escapeRegExp('[test](value)');
      expect(escaped).toBe('\\[test\\]\\(value\\)');

      // The escaped string should be safe to use in a RegExp
      const regex = new RegExp(escaped);
      expect(regex.test('[test](value)')).toBe(true);
      expect(regex.test('testvalue')).toBe(false);
    });
  });

  describe('omit (settings routes)', () => {
    it('removes specified keys', () => {
      const obj = { a: 1, b: 2, c: 3, secret: 'hidden' };
      expect(omit(obj, ['secret', 'c'])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('set (settings routes)', () => {
    it('sets nested values by path', () => {
      const obj = {};
      set(obj, 'a.b.c', 42);
      expect(obj).toEqual({ a: { b: { c: 42 } } });
    });
  });

  describe('merge (settings routes)', () => {
    it('deep merges multiple objects', () => {
      const result = merge({ a: 1 }, { b: 2 }, { a: 3, c: 4 });
      expect(result).toEqual({ a: 3, b: 2, c: 4 });
    });
  });

  describe('uniqWith (downloadtracker)', () => {
    it('removes duplicates by custom comparator', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      const result = uniqWith(items, isEqual);
      expect(result).toHaveLength(2);
    });
  });

  describe('findIndex (user routes)', () => {
    it('finds index by predicate', () => {
      const items = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];
      expect(findIndex(items, { id: 2 })).toBe(1);
      expect(findIndex(items, { id: 99 })).toBe(-1);
    });
  });

  describe('isEqual (MediaRequestSubscriber)', () => {
    it('deeply compares objects', () => {
      expect(isEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
      expect(isEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false);
    });
  });
});
