import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the datasource module to control isPgsql
let mockIsPgsql = false;
vi.mock('@server/datasource', () => ({
  get isPgsql() {
    return mockIsPgsql;
  },
}));

// Mock typeorm Column decorator
vi.mock('typeorm', () => ({
  Column: vi.fn((options: any) => options),
}));

import { DbAwareColumn, resolveDbType } from '@server/utils/DbColumnHelper';
import { Column } from 'typeorm';

describe('resolveDbType', () => {
  beforeEach(() => {
    mockIsPgsql = false;
  });

  it('returns the original type for SQLite (non-postgres)', () => {
    mockIsPgsql = false;
    expect(resolveDbType('datetime')).toBe('datetime');
  });

  it('maps datetime to "timestamp with time zone" for PostgreSQL', () => {
    mockIsPgsql = true;
    expect(resolveDbType('datetime')).toBe('timestamp with time zone');
  });

  it('returns unmapped types as-is for PostgreSQL', () => {
    mockIsPgsql = true;
    expect(resolveDbType('varchar')).toBe('varchar');
  });

  it('returns unmapped types as-is for SQLite', () => {
    mockIsPgsql = false;
    expect(resolveDbType('int')).toBe('int');
  });
});

describe('DbAwareColumn', () => {
  beforeEach(() => {
    mockIsPgsql = false;
    vi.clearAllMocks();
  });

  it('calls Column with resolved type for postgres datetime', () => {
    mockIsPgsql = true;
    DbAwareColumn({ type: 'datetime' });
    expect(Column).toHaveBeenCalledWith({
      type: 'timestamp with time zone',
    });
  });

  it('calls Column with original type for sqlite datetime', () => {
    mockIsPgsql = false;
    DbAwareColumn({ type: 'datetime' });
    expect(Column).toHaveBeenCalledWith({ type: 'datetime' });
  });

  it('calls Column without type modification when type is undefined', () => {
    DbAwareColumn({});
    expect(Column).toHaveBeenCalledWith({});
  });

  it('passes additional column options through', () => {
    DbAwareColumn({ type: 'datetime', nullable: true, default: 'NOW()' });
    expect(Column).toHaveBeenCalledWith({
      type: 'datetime',
      nullable: true,
      default: 'NOW()',
    });
  });
});
