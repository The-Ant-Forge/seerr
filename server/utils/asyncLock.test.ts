import AsyncLock from '@server/utils/asyncLock';
import { describe, expect, it } from 'vitest';

describe('AsyncLock', () => {
  it('serialises concurrent operations on the same key', async () => {
    const lock = new AsyncLock();
    const order: number[] = [];

    const task1 = lock.dispatch('key1', async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push(1);
    });

    const task2 = lock.dispatch('key1', async () => {
      order.push(2);
    });

    await Promise.all([task1, task2]);
    expect(order).toEqual([1, 2]);
  });

  it('allows concurrent operations on different keys', async () => {
    const lock = new AsyncLock();
    const order: string[] = [];

    const task1 = lock.dispatch('key1', async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push('a');
    });

    const task2 = lock.dispatch('key2', async () => {
      order.push('b');
    });

    await Promise.all([task1, task2]);
    // key2 should complete before key1 since they're independent
    expect(order).toEqual(['b', 'a']);
  });

  it('returns a value from the callback', async () => {
    const lock = new AsyncLock();

    const result = await lock.dispatch<number>('key1', async () => {
      return 42;
    });

    expect(result).toBe(42);
  });

  it('releases the lock on error', async () => {
    const lock = new AsyncLock();

    await expect(
      lock.dispatch('key1', async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');

    // Should be able to acquire the same key again
    const result = await lock.dispatch<string>('key1', async () => {
      return 'recovered';
    });
    expect(result).toBe('recovered');
  });

  it('handles numeric keys', async () => {
    const lock = new AsyncLock();
    const result = await lock.dispatch<number>(12345, async () => 99);
    expect(result).toBe(99);
  });
});
