import { AlpacaProviderError } from './alpacaMarketDataService.js';

export class AlpacaRateLimiter {
  private static instance: AlpacaRateLimiter;
  private maxRequestsPerMinute: number;
  private requestTimestamps: number[] = [];

  constructor(maxRequestsPerMinute = Number(process.env.ALPACA_RATE_LIMIT_PER_MINUTE) || 200) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  public static getInstance(): AlpacaRateLimiter {
    if (!AlpacaRateLimiter.instance) {
      AlpacaRateLimiter.instance = new AlpacaRateLimiter();
    }
    return AlpacaRateLimiter.instance;
  }

  /**
   * Cleans expired request timestamps older than 60 seconds
   */
  private pruneOldRequests(now: number): void {
    const windowStart = now - 60_000;
    while (this.requestTimestamps.length > 0 && this.requestTimestamps[0] <= windowStart) {
      this.requestTimestamps.shift();
    }
  }

  /**
   * Attempt to acquire quota
   */
  public tryAcquire(cost = 1): boolean {
    const now = Date.now();
    this.pruneOldRequests(now);

    if (this.requestTimestamps.length + cost <= this.maxRequestsPerMinute) {
      for (let i = 0; i < cost; i++) {
        this.requestTimestamps.push(now);
      }
      return true;
    }
    return false;
  }

  /**
   * Acquire quota or throw RATE_LIMITED error
   */
  public acquireOrThrow(cost = 1): void {
    if (!this.tryAcquire(cost)) {
      throw new AlpacaProviderError(
        'RATE_LIMITED',
        `Alpaca Free rate limit of ${this.maxRequestsPerMinute} req/min exceeded. Fail-closed without mock data.`
      );
    }
  }

  /**
   * Get current rate limit stats
   */
  public getStats(): {
    used: number;
    limit: number;
    remaining: number;
    resetInSeconds: number;
  } {
    const now = Date.now();
    this.pruneOldRequests(now);
    const used = this.requestTimestamps.length;
    const remaining = Math.max(0, this.maxRequestsPerMinute - used);
    const oldest = this.requestTimestamps[0] || now;
    const resetInSeconds = Math.max(0, Math.ceil((oldest + 60_000 - now) / 1000));

    return {
      used,
      limit: this.maxRequestsPerMinute,
      remaining,
      resetInSeconds,
    };
  }

  /**
   * Reset for testing
   */
  public resetForTests(newLimit?: number): void {
    this.requestTimestamps = [];
    if (newLimit !== undefined) {
      this.maxRequestsPerMinute = newLimit;
    }
  }
}
