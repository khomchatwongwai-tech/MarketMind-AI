import { AlpacaStockQuote, AlpacaBar } from './alpacaMarketDataService.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MarketDataCache {
  private static instance: MarketDataCache;

  private quotes = new Map<string, CacheEntry<AlpacaStockQuote>>();
  private trades = new Map<string, CacheEntry<{ symbol: string; price: number; size: number; timestamp: number }>>();
  private bars = new Map<string, CacheEntry<AlpacaBar[]>>();

  // Default TTLs in milliseconds
  public static readonly QUOTE_TTL_MS = 3_000;  // 3 seconds
  public static readonly TRADE_TTL_MS = 2_000;  // 2 seconds
  public static readonly BARS_TTL_MS = 30_000;  // 30 seconds

  public static getInstance(): MarketDataCache {
    if (!MarketDataCache.instance) {
      MarketDataCache.instance = new MarketDataCache();
    }
    return MarketDataCache.instance;
  }

  public getQuote(symbol: string): AlpacaStockQuote | null {
    const key = symbol.toUpperCase().trim();
    const entry = this.quotes.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.quotes.delete(key);
      return null;
    }
    return entry.data;
  }

  public setQuote(symbol: string, quote: AlpacaStockQuote, ttlMs = MarketDataCache.QUOTE_TTL_MS): void {
    const key = symbol.toUpperCase().trim();
    this.quotes.set(key, {
      data: quote,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public getTrade(symbol: string): { symbol: string; price: number; size: number; timestamp: number } | null {
    const key = symbol.toUpperCase().trim();
    const entry = this.trades.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.trades.delete(key);
      return null;
    }
    return entry.data;
  }

  public setTrade(
    symbol: string,
    trade: { symbol: string; price: number; size: number; timestamp: number },
    ttlMs = MarketDataCache.TRADE_TTL_MS
  ): void {
    const key = symbol.toUpperCase().trim();
    this.trades.set(key, {
      data: trade,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public getBars(symbol: string, timeframe: string): AlpacaBar[] | null {
    const key = `${symbol.toUpperCase().trim()}:${timeframe}`;
    const entry = this.bars.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.bars.delete(key);
      return null;
    }
    return entry.data;
  }

  public setBars(symbol: string, timeframe: string, bars: AlpacaBar[], ttlMs = MarketDataCache.BARS_TTL_MS): void {
    const key = `${symbol.toUpperCase().trim()}:${timeframe}`;
    this.bars.set(key, {
      data: bars,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public clear(): void {
    this.quotes.clear();
    this.trades.clear();
    this.bars.clear();
  }
}
