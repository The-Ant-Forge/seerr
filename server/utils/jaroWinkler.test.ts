import { jaroSimilarity } from '@server/utils/jaroWinkler';
import { describe, expect, it } from 'vitest';

describe('jaroSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaroSimilarity('abc', 'abc')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(jaroSimilarity('abc', 'xyz')).toBe(0);
  });

  it('returns 0 when either string is empty', () => {
    expect(jaroSimilarity('', 'abc')).toBe(0);
    expect(jaroSimilarity('abc', '')).toBe(0);
  });

  // Known reference values from Wikipedia / wink-jaro-distance
  it('computes MARTHA vs MARHTA correctly (~0.944)', () => {
    const sim = jaroSimilarity('MARTHA', 'MARHTA');
    expect(sim).toBeCloseTo(0.944, 2);
  });

  it('computes DIXON vs DICKSONX correctly (~0.767)', () => {
    const sim = jaroSimilarity('DIXON', 'DICKSONX');
    expect(sim).toBeCloseTo(0.767, 2);
  });

  it('scores similar movie titles highly', () => {
    const sim = jaroSimilarity('the dark knight', 'dark knight the');
    expect(sim).toBeGreaterThan(0.7);
  });

  it('scores dissimilar titles low', () => {
    const sim = jaroSimilarity('the dark knight', 'frozen');
    expect(sim).toBeLessThan(0.5);
  });
});
