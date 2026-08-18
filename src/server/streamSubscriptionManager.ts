export type StreamPriorityLevel = 'ACTIVE_VIEW' | 'WATCHLIST' | 'PORTFOLIO' | 'DASHBOARD';

export const PRIORITY_WEIGHTS: Record<StreamPriorityLevel, number> = {
  ACTIVE_VIEW: 100,
  WATCHLIST: 70,
  PORTFOLIO: 50,
  DASHBOARD: 30,
};

export interface SubscriptionRecord {
  symbol: string;
  priorityLevel: StreamPriorityLevel;
  priorityWeight: number;
  lastAccessed: number;
  clientCount: number;
}

export interface SubscriptionResult {
  symbol: string;
  status: 'SUBSCRIBED_STREAM' | 'SUBSCRIBED_REST_FALLBACK';
  evictedSymbol?: string;
  activeCount: number;
  maxLimit: number;
}

export class StreamSubscriptionManager {
  private static instance: StreamSubscriptionManager;

  private maxStreamSymbols: number;
  private activeStreams: Map<string, SubscriptionRecord> = new Map();
  private restFallbackSymbols: Set<string> = new Set();
  private onStreamChangeCallback?: (action: 'SUBSCRIBE' | 'UNSUBSCRIBE', symbol: string) => void;

  constructor(maxStreamSymbols = Number(process.env.MAX_ACTIVE_STREAM_SYMBOLS) || 30) {
    this.maxStreamSymbols = Math.max(1, maxStreamSymbols);
  }

  public static getInstance(): StreamSubscriptionManager {
    if (!StreamSubscriptionManager.instance) {
      StreamSubscriptionManager.instance = new StreamSubscriptionManager();
    }
    return StreamSubscriptionManager.instance;
  }

  public setStreamChangeHandler(handler: (action: 'SUBSCRIBE' | 'UNSUBSCRIBE', symbol: string) => void) {
    this.onStreamChangeCallback = handler;
  }

  public getMaxStreamSymbols(): number {
    return this.maxStreamSymbols;
  }

  public setMaxStreamSymbols(max: number): void {
    this.maxStreamSymbols = Math.max(1, max);
  }

  /**
   * Request subscription for a symbol with a given priority level
   */
  public subscribe(
    rawSymbol: string,
    priorityLevel: StreamPriorityLevel = 'ACTIVE_VIEW'
  ): SubscriptionResult {
    const symbol = rawSymbol.toUpperCase().trim();
    if (!symbol) {
      return {
        symbol: '',
        status: 'SUBSCRIBED_REST_FALLBACK',
        activeCount: this.activeStreams.size,
        maxLimit: this.maxStreamSymbols,
      };
    }

    const priorityWeight = PRIORITY_WEIGHTS[priorityLevel];
    const existing = this.activeStreams.get(symbol);

    if (existing) {
      // Elevate priority if new request has higher priority
      if (priorityWeight > existing.priorityWeight) {
        existing.priorityLevel = priorityLevel;
        existing.priorityWeight = priorityWeight;
      }
      existing.lastAccessed = Date.now();
      existing.clientCount++;

      return {
        symbol,
        status: 'SUBSCRIBED_STREAM',
        activeCount: this.activeStreams.size,
        maxLimit: this.maxStreamSymbols,
      };
    }

    // Symbol is not currently in active stream
    // Check if we have capacity under the max stream limit
    if (this.activeStreams.size < this.maxStreamSymbols) {
      this.activeStreams.set(symbol, {
        symbol,
        priorityLevel,
        priorityWeight,
        lastAccessed: Date.now(),
        clientCount: 1,
      });
      this.restFallbackSymbols.delete(symbol);
      this.onStreamChangeCallback?.('SUBSCRIBE', symbol);

      return {
        symbol,
        status: 'SUBSCRIBED_STREAM',
        activeCount: this.activeStreams.size,
        maxLimit: this.maxStreamSymbols,
      };
    }

    // Capacity is full (e.g. 30 symbols). Find the lowest priority / oldest candidate for eviction
    let lowestCandidate: SubscriptionRecord | null = null;

    for (const record of this.activeStreams.values()) {
      if (!lowestCandidate) {
        lowestCandidate = record;
        continue;
      }
      if (record.priorityWeight < lowestCandidate.priorityWeight) {
        lowestCandidate = record;
      } else if (
        record.priorityWeight === lowestCandidate.priorityWeight &&
        record.lastAccessed < lowestCandidate.lastAccessed
      ) {
        lowestCandidate = record;
      }
    }

    // If the new request has higher or equal priority to the lowest candidate, evict the candidate
    if (lowestCandidate && priorityWeight >= lowestCandidate.priorityWeight) {
      const evictedSymbol = lowestCandidate.symbol;
      this.activeStreams.delete(evictedSymbol);
      this.restFallbackSymbols.add(evictedSymbol);
      this.onStreamChangeCallback?.('UNSUBSCRIBE', evictedSymbol);

      this.activeStreams.set(symbol, {
        symbol,
        priorityLevel,
        priorityWeight,
        lastAccessed: Date.now(),
        clientCount: 1,
      });
      this.restFallbackSymbols.delete(symbol);
      this.onStreamChangeCallback?.('SUBSCRIBE', symbol);

      return {
        symbol,
        status: 'SUBSCRIBED_STREAM',
        evictedSymbol,
        activeCount: this.activeStreams.size,
        maxLimit: this.maxStreamSymbols,
      };
    }

    // New request is lower priority than all 30 active stream symbols
    // Route to verified on-demand REST polling fallback
    this.restFallbackSymbols.add(symbol);

    return {
      symbol,
      status: 'SUBSCRIBED_REST_FALLBACK',
      activeCount: this.activeStreams.size,
      maxLimit: this.maxStreamSymbols,
    };
  }

  /**
   * Unsubscribe a symbol
   */
  public unsubscribe(rawSymbol: string): void {
    const symbol = rawSymbol.toUpperCase().trim();
    if (!symbol) return;

    const existing = this.activeStreams.get(symbol);
    if (existing) {
      existing.clientCount--;
      if (existing.clientCount <= 0) {
        this.activeStreams.delete(symbol);
        this.onStreamChangeCallback?.('UNSUBSCRIBE', symbol);

        // If there are symbols waiting in rest fallback, promote one to the active stream
        this.promoteRestFallbackIfAvailable();
      }
    } else {
      this.restFallbackSymbols.delete(symbol);
    }
  }

  /**
   * Promote waiting REST symbols to active stream if capacity allows
   */
  private promoteRestFallbackIfAvailable(): void {
    if (this.activeStreams.size >= this.maxStreamSymbols || this.restFallbackSymbols.size === 0) {
      return;
    }

    const waiting = Array.from(this.restFallbackSymbols);
    const nextSymbol = waiting[0];
    if (nextSymbol) {
      this.restFallbackSymbols.delete(nextSymbol);
      this.subscribe(nextSymbol, 'WATCHLIST');
    }
  }

  public getActiveStreamSymbols(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  public getRestFallbackSymbols(): string[] {
    return Array.from(this.restFallbackSymbols);
  }

  public isStreamActive(symbol: string): boolean {
    return this.activeStreams.has(symbol.toUpperCase().trim());
  }

  public getStats() {
    return {
      activeStreamCount: this.activeStreams.size,
      maxStreamLimit: this.maxStreamSymbols,
      restFallbackCount: this.restFallbackSymbols.size,
      activeSymbols: this.getActiveStreamSymbols(),
      restFallbackSymbols: this.getRestFallbackSymbols(),
    };
  }

  public resetForTests(newLimit = 30): void {
    this.activeStreams.clear();
    this.restFallbackSymbols.clear();
    this.maxStreamSymbols = newLimit;
  }
}
