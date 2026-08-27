import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callWithRateLimit, MIN_INTERVAL_MS, _resetRateLimiter, _setLastCallAt } from './rateLimiter';

describe('callWithRateLimit', () => {
  beforeEach(() => {
    _resetRateLimiter();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    _resetRateLimiter();
  });

  it('calls are spaced at least MIN_INTERVAL_MS apart', async () => {
    const fn1 = vi.fn().mockResolvedValue('first');
    const fn2 = vi.fn().mockResolvedValue('second');

    // First call immediate
    const p1 = callWithRateLimit(fn1);
    await vi.advanceTimersByTimeAsync(0);
    const r1 = await p1;
    expect(r1).toBe('first');
    expect(fn1).toHaveBeenCalledTimes(1);

    // Second call should wait MIN_INTERVAL_MS
    const p2 = callWithRateLimit(fn2);
    // fn2 should not have been called yet because wait is pending
    expect(fn2).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(MIN_INTERVAL_MS);
    const r2 = await p2;
    expect(r2).toBe('second');
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('simulated 429 triggers backoff and retry', async () => {
    const err429: any = new Error('429');
    err429.status = 429;
    err429.headers = { 'retry-after': '0' }; // immediate retry for test speed; fallback to 2^attempt if missing would be 1s etc
    // But we set retry-after 0 to avoid waiting long; test still verifies retry logic.
    // Use a value 0 to make sleep(0) then succeed.
    const fn = vi.fn()
      .mockRejectedValueOnce(err429)
      .mockResolvedValueOnce('ok');

    // Need to bypass MIN_INTERVAL: reset lastCall far in past
    _setLastCallAt(Date.now() - MIN_INTERVAL_MS - 1000);

    const p = callWithRateLimit(fn, 2);
    // Need to advance for retryAfter sleep (0) -> still need tick
    await vi.advanceTimersByTimeAsync(0);
    // After first failure, it will sleep retryAfter*1000 =0, then retry
    await vi.advanceTimersByTimeAsync(0);
    const result = await p;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries with exponential backoff when no retry-after header (2^attempt)', async () => {
    const err429: any = new Error('429');
    err429.status = 429;
    err429.headers = {}; // no retry-after -> uses 2**attempt

    const fn = vi.fn()
      .mockRejectedValueOnce(err429)
      .mockResolvedValueOnce('ok');

    _setLastCallAt(Date.now() - MIN_INTERVAL_MS - 1000);
    const p = callWithRateLimit(fn, 2);
    // first attempt fails, then sleep 1*1000 (2**0)
    await vi.advanceTimersByTimeAsync(1000);
    const result = await p;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after maxRetries is exhausted', async () => {
    const err429: any = new Error('429');
    err429.status = 429;
    err429.headers = { 'retry-after': '0' };
    const fn = vi.fn().mockRejectedValue(err429);
    _setLastCallAt(Date.now() - MIN_INTERVAL_MS - 1000);

    const p = callWithRateLimit(fn, 1); // 1 retry => 2 total attempts
    const expectation = expect(p).rejects.toThrow();
    // Advance timers for retry sleeps (retryAfter 0)
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    await expectation;
    expect(fn).toHaveBeenCalledTimes(2); // attempt 0 + 1 retry
  });

  it('non-429 error does not retry', async () => {
    const err: any = new Error('boom');
    err.status = 500;
    const fn = vi.fn().mockRejectedValue(err);
    _setLastCallAt(Date.now() - MIN_INTERVAL_MS - 1000);
    const p = callWithRateLimit(fn, 3);
    const expectation = expect(p).rejects.toThrow('boom');
    await vi.advanceTimersByTimeAsync(0);
    await expectation;
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
