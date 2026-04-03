import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export interface RateLimitOptions {
  /** Max requests per interval (when using maxRequests without maxRPS) */
  maxRequests?: number;
  /** Max requests per second */
  maxRPS?: number;
  /** Time window in ms (defaults to 1000 when maxRPS is set) */
  perMilliseconds?: number;
}

/**
 * Simple Axios rate limiter using a token-bucket approach.
 * Replaces `axios-rate-limit` package to reduce supply chain surface.
 *
 * Delays requests when the rate limit is exceeded by queueing them
 * with an interceptor.
 */
export default function rateLimit(
  instance: AxiosInstance,
  options: RateLimitOptions
): AxiosInstance {
  const maxRequests = options.maxRPS ?? options.maxRequests ?? 1;
  const perMs = options.maxRPS ? 1000 : (options.perMilliseconds ?? 1000);
  const intervalMs = perMs / maxRequests;

  let lastRequestTime = 0;

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;

    if (elapsed >= intervalMs) {
      lastRequestTime = now;
      return config;
    }

    const delay = intervalMs - elapsed;
    lastRequestTime = now + delay;

    return new Promise((resolve) => {
      setTimeout(() => resolve(config), delay);
    });
  });

  return instance;
}
