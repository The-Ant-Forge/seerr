import {
  MediaRequestStatus,
  MediaStatus,
  MediaType,
} from '@server/constants/media';
import { describe, expect, it } from 'vitest';

describe('MediaRequestStatus enum', () => {
  it('has PENDING = 1', () => {
    expect(MediaRequestStatus.PENDING).toBe(1);
  });

  it('has APPROVED = 2', () => {
    expect(MediaRequestStatus.APPROVED).toBe(2);
  });

  it('has DECLINED = 3', () => {
    expect(MediaRequestStatus.DECLINED).toBe(3);
  });

  it('has FAILED = 4', () => {
    expect(MediaRequestStatus.FAILED).toBe(4);
  });

  it('has COMPLETED = 5', () => {
    expect(MediaRequestStatus.COMPLETED).toBe(5);
  });
});

describe('MediaType enum', () => {
  it('has MOVIE = "movie"', () => {
    expect(MediaType.MOVIE).toBe('movie');
  });

  it('has TV = "tv"', () => {
    expect(MediaType.TV).toBe('tv');
  });
});

describe('MediaStatus enum', () => {
  it('has UNKNOWN = 1', () => {
    expect(MediaStatus.UNKNOWN).toBe(1);
  });

  it('has PENDING = 2', () => {
    expect(MediaStatus.PENDING).toBe(2);
  });

  it('has PROCESSING = 3', () => {
    expect(MediaStatus.PROCESSING).toBe(3);
  });

  it('has PARTIALLY_AVAILABLE = 4', () => {
    expect(MediaStatus.PARTIALLY_AVAILABLE).toBe(4);
  });

  it('has AVAILABLE = 5', () => {
    expect(MediaStatus.AVAILABLE).toBe(5);
  });

  it('has BLOCKLISTED = 6', () => {
    expect(MediaStatus.BLOCKLISTED).toBe(6);
  });

  it('has DELETED = 7', () => {
    expect(MediaStatus.DELETED).toBe(7);
  });

  it('has exactly 7 members', () => {
    // Numeric enums generate reverse mappings, so count string keys only
    const keys = Object.keys(MediaStatus).filter((k) => isNaN(Number(k)));
    expect(keys).toHaveLength(7);
  });
});
