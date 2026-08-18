export interface SubscriptionDetail {
  symbol: string;
  consumers: Set<string>;
  subscribedAt: number;
  lastTickTime?: number;
  tickCount: number;
}

export class SymbolSubscriptionRegistry {
  private subscriptions: Map<string, SubscriptionDetail> = new Map();
  private maxAllowedSubscriptions: number = 100;

  constructor(maxSubscriptions: number = 100) {
    this.maxAllowedSubscriptions = maxSubscriptions;
  }

  /**
   * Subscribes a consumer to a symbol.
   * Returns whether this was the first subscription for that symbol (requiring an upstream call).
   */
  public subscribe(
    symbol: string,
    consumerId: string
  ): { isFirstSubscription: boolean; totalSubscribers: number; currentSymbolsCount: number } {
    const cleanSym = (symbol || '').toUpperCase().trim();
    if (!cleanSym) {
      return { isFirstSubscription: false, totalSubscribers: 0, currentSymbolsCount: this.subscriptions.size };
    }

    let detail = this.subscriptions.get(cleanSym);
    const isFirstSubscription = !detail || detail.consumers.size === 0;

    if (!detail) {
      if (this.subscriptions.size >= this.maxAllowedSubscriptions) {
        console.warn(`[SubscriptionRegistry] Maximum subscriptions limit (${this.maxAllowedSubscriptions}) reached.`);
      }
      detail = {
        symbol: cleanSym,
        consumers: new Set<string>(),
        subscribedAt: Date.now(),
        tickCount: 0,
      };
      this.subscriptions.set(cleanSym, detail);
    }

    detail.consumers.add(consumerId);

    return {
      isFirstSubscription,
      totalSubscribers: detail.consumers.size,
      currentSymbolsCount: this.subscriptions.size,
    };
  }

  /**
   * Unsubscribes a consumer from a symbol.
   * Returns whether this was the last consumer for that symbol (requiring an upstream unsubscription).
   */
  public unsubscribe(
    symbol: string,
    consumerId: string
  ): { isLastUnsubscription: boolean; remainingSubscribers: number; currentSymbolsCount: number } {
    const cleanSym = (symbol || '').toUpperCase().trim();
    const detail = this.subscriptions.get(cleanSym);

    if (!detail) {
      return { isLastUnsubscription: false, remainingSubscribers: 0, currentSymbolsCount: this.subscriptions.size };
    }

    detail.consumers.delete(consumerId);

    if (detail.consumers.size === 0) {
      this.subscriptions.delete(cleanSym);
      return {
        isLastUnsubscription: true,
        remainingSubscribers: 0,
        currentSymbolsCount: this.subscriptions.size,
      };
    }

    return {
      isLastUnsubscription: false,
      remainingSubscribers: detail.consumers.size,
      currentSymbolsCount: this.subscriptions.size,
    };
  }

  public getActiveSymbols(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  public getRefCount(symbol: string): number {
    return this.subscriptions.get((symbol || '').toUpperCase())?.consumers.size || 0;
  }

  public recordTick(symbol: string, timestamp: number = Date.now()): void {
    const detail = this.subscriptions.get((symbol || '').toUpperCase());
    if (detail) {
      detail.lastTickTime = timestamp;
      detail.tickCount++;
    }
  }

  public getAllDetails(): Array<{
    symbol: string;
    refCount: number;
    consumers: string[];
    subscribedAt: number;
    lastTickTime?: number;
    tickAgeMs?: number;
    tickCount: number;
  }> {
    const now = Date.now();
    return Array.from(this.subscriptions.values()).map((d) => ({
      symbol: d.symbol,
      refCount: d.consumers.size,
      consumers: Array.from(d.consumers),
      subscribedAt: d.subscribedAt,
      lastTickTime: d.lastTickTime,
      tickAgeMs: d.lastTickTime ? now - d.lastTickTime : undefined,
      tickCount: d.tickCount,
    }));
  }

  public clear(): void {
    this.subscriptions.clear();
  }
}
