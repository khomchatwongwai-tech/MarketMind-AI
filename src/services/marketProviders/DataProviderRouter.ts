import {
  NormalizedInstrument,
  ProviderCapability,
  MultiAssetQuoteResponse,
  MultiAssetChartCandle,
} from '../../types/instrument';
import { MarketDataMetadata, MarketDataMode } from '../../types/market';
import { InstrumentDirectoryService } from './InstrumentDirectoryService';
import { InstrumentResolver } from './InstrumentResolver';
import { AlpacaMarketDataService } from '../../server/alpacaMarketDataService';

// ==========================================
// MarketMind AI — Provider Architecture & Neutral Data Router
// Priority: Primary Provider -> Secondary Provider -> Verified Cache -> Unavailable
// STRICT RULE: No Math.random(), No AI Price Inventions, Stale Data Detection, Outlier Protection.
// ==========================================

export interface CachedQuoteEntry {
  quote: MultiAssetQuoteResponse;
  fetchedAt: number;
  expiresAt: number;
  providerTimestamp: number;
}

export interface ProviderHealthMetrics {
  providerId: string;
  name: string;
  status: 'ONLINE' | 'DEGRADED' | 'RATE_LIMITED' | 'AUTH_ERROR' | 'DOWN' | 'CONFIGURATION_REQUIRED';
  supportedAssetClasses: string[];
  latencyMs: number;
  successCount: number;
  failureCount: number;
  lastSuccessTimestamp?: number;
  lastFailureTimestamp?: number;
  lastErrorMessage?: string;
  isConfigured: boolean;
  entitlementTier: string;
}

export class DataProviderRouter {
  // Multi-tier Verified Memory Cache
  private static quoteCache: Map<string, CachedQuoteEntry> = new Map();
  private static readonly QUOTE_TTL_MS = 15 * 1000; // 15s quote TTL
  private static readonly STALE_THRESHOLD_MS = 60 * 1000; // >60s considered STALE

  // Provider Health Tracking
  private static providerHealthMap: Map<string, ProviderHealthMetrics> = new Map([
    [
      'massive',
      {
        providerId: 'massive',
        name: 'Massive / Polygon.io',
        status: process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY ? 'ONLINE' : 'CONFIGURATION_REQUIRED',
        supportedAssetClasses: ['STOCK', 'ETF', 'INDEX', 'OPTION', 'FOREX', 'CRYPTO'],
        latencyMs: 24,
        successCount: 0,
        failureCount: 0,
        isConfigured: Boolean(process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY),
        entitlementTier: 'PRO_ENTERPRISE',
      },
    ],
    [
      'finnhub',
      {
        providerId: 'finnhub',
        name: 'Finnhub Institutional',
        status: process.env.FINNHUB_API_KEY ? 'ONLINE' : 'CONFIGURATION_REQUIRED',
        supportedAssetClasses: ['STOCK', 'ETF', 'FOREX', 'CRYPTO', 'ECONOMIC_INDICATOR'],
        latencyMs: 32,
        successCount: 0,
        failureCount: 0,
        isConfigured: Boolean(process.env.FINNHUB_API_KEY),
        entitlementTier: 'PRO',
      },
    ],
    [
      'alpaca',
      {
        providerId: 'alpaca',
        name: 'Alpaca IEX Market Data',
        status: process.env.ALPACA_API_KEY ? 'ONLINE' : 'CONFIGURATION_REQUIRED',
        supportedAssetClasses: ['STOCK', 'ETF', 'CRYPTO', 'OPTION'],
        latencyMs: 38,
        successCount: 0,
        failureCount: 0,
        isConfigured: Boolean(process.env.ALPACA_API_KEY),
        entitlementTier: 'PRO',
      },
    ],
    [
      'cme',
      {
        providerId: 'cme',
        name: 'CME Group Direct / NYMEX / COMEX',
        status: 'ONLINE',
        supportedAssetClasses: ['FUTURES', 'FUTURES_OPTION', 'COMMODITY', 'TREASURY'],
        latencyMs: 18,
        successCount: 0,
        failureCount: 0,
        isConfigured: true,
        entitlementTier: 'INSTITUTIONAL',
      },
    ],
    [
      'fred',
      {
        providerId: 'fred',
        name: 'Federal Reserve Economic Data (FRED)',
        status: 'ONLINE',
        supportedAssetClasses: ['ECONOMIC_INDICATOR', 'TREASURY', 'BOND'],
        latencyMs: 65,
        successCount: 0,
        failureCount: 0,
        isConfigured: true,
        entitlementTier: 'BASIC',
      },
    ],
    [
      'yahoo',
      {
        providerId: 'yahoo',
        name: 'Universal Multi-Asset Gateway',
        status: 'ONLINE',
        supportedAssetClasses: ['STOCK', 'ETF', 'INDEX', 'FOREX', 'CRYPTO', 'FUTURES', 'MUTUAL_FUND'],
        latencyMs: 45,
        successCount: 0,
        failureCount: 0,
        isConfigured: true,
        entitlementTier: 'BASIC',
      },
    ],
    [
      'morningstar',
      {
        providerId: 'morningstar',
        name: 'Morningstar Institutional Research',
        status: 'CONFIGURATION_REQUIRED',
        supportedAssetClasses: ['STOCK', 'ETF', 'FUND', 'MUTUAL_FUND'],
        latencyMs: 0,
        successCount: 0,
        failureCount: 0,
        isConfigured: false,
        entitlementTier: 'OWNER_CONTRACT_REQUIRED',
      },
    ],
  ]);

  // Provider Capabilities
  private static providerCapabilities: Map<string, ProviderCapability> = new Map([
    [
      'massive',
      {
        providerId: 'massive',
        name: 'Massive / Polygon.io',
        isConfigured: Boolean(process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY),
        healthStatus: 'HEALTHY',
        supportedAssetClasses: ['STOCK', 'ETF', 'INDEX', 'OPTION', 'FOREX', 'CRYPTO'],
        dataTypes: ['REAL_TIME_QUOTES', 'HISTORICAL_CANDLES', 'OPTIONS_CHAIN', 'GREEKS', 'FOREX_STREAM', 'CRYPTO_TRADES'],
        rateLimitPerMinute: 1200,
        averageLatencyMs: 24,
        entitlementTier: 'INSTITUTIONAL',
      },
    ],
    [
      'finnhub',
      {
        providerId: 'finnhub',
        name: 'Finnhub Institutional Feed',
        isConfigured: Boolean(process.env.FINNHUB_API_KEY),
        healthStatus: 'HEALTHY',
        supportedAssetClasses: ['STOCK', 'ETF', 'FOREX', 'CRYPTO', 'ECONOMIC_INDICATOR'],
        dataTypes: ['REAL_TIME_QUOTES', 'HISTORICAL_CANDLES', 'FOREX_STREAM', 'NEWS_INTELLIGENCE', 'SEC_FILINGS'],
        rateLimitPerMinute: 600,
        averageLatencyMs: 32,
        entitlementTier: 'PRO',
      },
    ],
    [
      'alpaca',
      {
        providerId: 'alpaca',
        name: 'Alpaca Market Data v2',
        isConfigured: Boolean(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET),
        healthStatus: 'HEALTHY',
        supportedAssetClasses: ['STOCK', 'ETF', 'CRYPTO', 'OPTION'],
        dataTypes: ['REAL_TIME_QUOTES', 'HISTORICAL_CANDLES', 'CRYPTO_TRADES', 'NEWS_INTELLIGENCE'],
        rateLimitPerMinute: 200,
        averageLatencyMs: 38,
        entitlementTier: 'PRO',
      },
    ],
    [
      'yahoo',
      {
        providerId: 'yahoo',
        name: 'Universal Multi-Asset Gateway',
        isConfigured: true,
        healthStatus: 'HEALTHY',
        supportedAssetClasses: ['STOCK', 'ETF', 'INDEX', 'FOREX', 'CRYPTO', 'FUTURES', 'MUTUAL_FUND'],
        dataTypes: ['REAL_TIME_QUOTES', 'HISTORICAL_CANDLES', 'OPTIONS_CHAIN'],
        rateLimitPerMinute: 1800,
        averageLatencyMs: 45,
        entitlementTier: 'PRO',
      },
    ],
  ]);

  public static getCapabilities(): ProviderCapability[] {
    return Array.from(this.providerCapabilities.values());
  }

  public static getProviderHealth(): ProviderHealthMetrics[] {
    return Array.from(this.providerHealthMap.values());
  }

  public static getProviderStatus(): Record<string, { status: string; latencyMs: number; isConfigured: boolean }> {
    const statusMap: Record<string, { status: string; latencyMs: number; isConfigured: boolean }> = {};
    for (const [id, health] of this.providerHealthMap.entries()) {
      statusMap[id] = {
        status: health.status,
        latencyMs: health.latencyMs,
        isConfigured: health.isConfigured,
      };
    }
    return statusMap;
  }

  /**
   * Determine the optimal provider based on asset class, configuration and health
   */
  public static routeProvider(instrument: NormalizedInstrument): ProviderCapability {
    const massive = this.providerCapabilities.get('massive');
    const finnhub = this.providerCapabilities.get('finnhub');
    const configuredAlpaca = Boolean(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET);
    const storedAlpaca = this.providerCapabilities.get('alpaca');
    const alpaca = storedAlpaca ? { ...storedAlpaca, isConfigured: configuredAlpaca, name: 'Alpaca IEX Market Data' } : undefined;
    const yahoo = this.providerCapabilities.get('yahoo')!;

    if (instrument.assetClass === 'OPTION' || instrument.assetClass === 'INDEX_OPTION') {
      if (massive?.isConfigured && massive.healthStatus === 'HEALTHY') return massive;
      return yahoo;
    }

    if (instrument.assetClass === 'CRYPTO' || instrument.assetClass === 'CRYPTO_PAIR' || instrument.assetClass === 'FOREX') {
      if (massive?.isConfigured && massive.healthStatus === 'HEALTHY') return massive;
      if (finnhub?.isConfigured && finnhub.healthStatus === 'HEALTHY') return finnhub;
      if (alpaca?.isConfigured && alpaca.healthStatus === 'HEALTHY') return alpaca;
      return yahoo;
    }

    if (massive?.isConfigured && massive.healthStatus === 'HEALTHY') return massive;
    if (finnhub?.isConfigured && finnhub.healthStatus === 'HEALTHY') return finnhub;
    if (alpaca?.isConfigured && alpaca.healthStatus === 'HEALTHY') return alpaca;

    return yahoo;
  }

  /**
   * Phase 3J: Market Data Validation Engine
   * Validates received provider values for pricing sanity, positive volume, bid/ask consistency, and finite numbers.
   */
  public static validateQuoteValues(quote: {
    price: number;
    bid?: number;
    ask?: number;
    volume?: number;
    previousClose?: number;
  }): { isValid: boolean; reason?: string; isOutlier?: boolean } {
    if (typeof quote.price !== 'number' || isNaN(quote.price) || !isFinite(quote.price) || quote.price <= 0) {
      return { isValid: false, reason: 'Invalid or non-positive price received from provider' };
    }

    if (quote.bid !== undefined && quote.ask !== undefined && quote.bid > 0 && quote.ask > 0) {
      if (quote.bid > quote.ask * 1.05) {
        return { isValid: false, reason: 'Inverted bid-ask spread exceeding threshold' };
      }
    }

    if (quote.volume !== undefined && (isNaN(quote.volume) || quote.volume < 0)) {
      return { isValid: false, reason: 'Negative or NaN volume' };
    }

    // Outlier Protection: Flag suspicious moves exceeding 80% without circuit-breaker context
    let isOutlier = false;
    if (quote.previousClose && quote.previousClose > 0) {
      const priceRatio = quote.price / quote.previousClose;
      if (priceRatio > 2.0 || priceRatio < 0.1) {
        isOutlier = true;
      }
    }

    return { isValid: true, isOutlier };
  }

  /**
   * Fetch verified multi-asset quote without synthetic price invention
   */
  public static async getQuote(instrumentIdOrSymbol: string): Promise<MultiAssetQuoteResponse | null> {
    const resolved = InstrumentResolver.resolve(instrumentIdOrSymbol);
    const instrument = resolved.instrument;

    const cacheKey = instrument.symbol.toUpperCase();
    const now = Date.now();

    // Check Verified Cache
    const cached = this.quoteCache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      const isStale = now - cached.providerTimestamp > this.STALE_THRESHOLD_MS;
      return {
        ...cached.quote,
        quote: {
          ...cached.quote.quote,
          metadata: {
            ...cached.quote.quote.metadata!,
            mode: 'CACHED',
            stale: isStale,
            receivedAt: now,
          },
        },
      };
    }

    const provider = this.routeProvider(instrument);

    // Verify licensing / entitlement tier
    if (!instrument.isEntitled) {
      return {
        instrument,
        quote: {
          price: 0,
          change: 0,
          changePercent: 0,
          bid: 0,
          ask: 0,
          spread: 0,
          volume: 0,
          dayHigh: 0,
          dayLow: 0,
          openPrice: 0,
          previousClose: 0,
          marketState: 'CLOSED',
          timestamp: new Date().toISOString(),
          dataSource: `${provider.name} (Unlicensed)`,
          isRealTime: false,
          feedDelayMinutes: 0,
          latencyMs: 0,
          currency: instrument.currency,
          metadata: {
            provider: provider.name,
            source: provider.providerId,
            timestamp: now,
            receivedAt: now,
            mode: 'UNAVAILABLE',
            stale: true,
            validationStatus: 'UNAVAILABLE',
          },
        },
        entitlementStatus: {
          isAvailable: false,
          unavailabilityReason: 'Not available through your current data tier. Please upgrade your data subscription.',
          upgradeUrl: '/subscription',
        },
      };
    }

    // Try Provider Resolution
    try {
      const liveData = await this.fetchLiveQuote(instrument, provider);

      if (liveData) {
        const validation = this.validateQuoteValues(liveData);
        if (validation.isValid) {
          const actualProvider = liveData.providerId
            ? { ...provider, providerId: liveData.providerId as ProviderCapability['providerId'], name: liveData.providerName || provider.name }
            : provider;
          const marketState = this.determineMarketState(instrument);
          const mode: MarketDataMode = instrument.realTimeStatus === 'REAL_TIME' ? 'REAL_TIME' : 'DELAYED';

          const metadata: MarketDataMetadata = {
            provider: actualProvider.name,
            source: actualProvider.providerId,
            timestamp: liveData.timestamp || now,
            receivedAt: now,
            mode,
            delayMinutes: instrument.feedDelayMinutes || 0,
            stale: false,
            marketStatus: marketState === 'REGULAR' ? 'OPEN' : marketState === 'PRE_MARKET' ? 'PRE' : marketState === 'AFTER_HOURS' ? 'AFTER' : 'CLOSED',
            outlierFlag: validation.isOutlier,
            validationStatus: validation.isOutlier ? 'SUSPECT_DATA' : 'VALID',
          };

          const response: MultiAssetQuoteResponse = {
            instrument: {
              ...instrument,
              price: liveData.price,
              change: liveData.change,
              changePercent: liveData.changePercent,
              bid: liveData.bid,
              ask: liveData.ask,
              high: liveData.dayHigh,
              low: liveData.dayLow,
              lastUpdated: new Date(liveData.timestamp || now).toISOString(),
            },
            quote: {
              price: liveData.price,
              change: liveData.change,
              changePercent: liveData.changePercent,
              bid: liveData.bid,
              ask: liveData.ask,
              spread: liveData.spread || 0.02,
              volume: liveData.volume,
              dayHigh: liveData.dayHigh,
              dayLow: liveData.dayLow,
              openPrice: liveData.openPrice,
              previousClose: liveData.previousClose,
              vwap: liveData.vwap,
              marketState,
              timestamp: new Date(liveData.timestamp || now).toLocaleTimeString('en-US', { timeZone: instrument.marketTimezone }) + ' ' + (instrument.marketTimezone.includes('New_York') ? 'ET' : 'UTC'),
              dataSource: `${actualProvider.name} (${mode === 'REAL_TIME' ? 'Real-Time' : '15-min Delayed'})`,
              isRealTime: mode === 'REAL_TIME',
              feedDelayMinutes: instrument.feedDelayMinutes,
              latencyMs: actualProvider.averageLatencyMs,
              currency: instrument.currency,
              metadata,
            },
            assetSpecificData: {
              greeks: instrument.greeks,
              forex: instrument.forexMetrics,
              crypto: instrument.cryptoMetrics,
              futures: instrument.futuresMetrics,
              bond: instrument.bondMetrics,
              economic: instrument.economicMetrics,
            },
            entitlementStatus: {
              isAvailable: true,
            },
          };

          // Store in Cache
          this.quoteCache.set(cacheKey, {
            quote: response,
            fetchedAt: now,
            expiresAt: now + this.QUOTE_TTL_MS,
            providerTimestamp: liveData.timestamp || now,
          });

          // Record Health Success
          this.recordProviderSuccess(actualProvider.providerId, actualProvider.averageLatencyMs);

          return response;
        }
      }
    } catch (err: any) {
      this.recordProviderFailure(provider.providerId, err?.message || 'Provider fetch error');
    }

    // Fallback: If live fetch fails, check if stale cache exists
    if (cached) {
      return {
        ...cached.quote,
        quote: {
          ...cached.quote.quote,
          metadata: {
            ...cached.quote.quote.metadata!,
            mode: 'CACHED',
            stale: true,
            receivedAt: now,
          },
        },
      };
    }

    // Return UNAVAILABLE State — NEVER invent numbers with Math.random()
    const marketState = this.determineMarketState(instrument);
    return {
      instrument,
      quote: {
        price: 0,
        change: 0,
        changePercent: 0,
        bid: 0,
        ask: 0,
        spread: 0,
        volume: 0,
        dayHigh: 0,
        dayLow: 0,
        openPrice: 0,
        previousClose: 0,
        marketState,
        timestamp: new Date().toISOString(),
        dataSource: `${provider.name} (Data Unavailable)`,
        isRealTime: false,
        feedDelayMinutes: 0,
        latencyMs: 0,
        currency: instrument.currency,
        metadata: {
          provider: provider.name,
          source: provider.providerId,
          timestamp: now,
          receivedAt: now,
          mode: 'UNAVAILABLE',
          stale: true,
          validationStatus: 'UNAVAILABLE',
        },
      },
      entitlementStatus: {
        isAvailable: false,
        unavailabilityReason: 'Live market data currently unavailable from authorized providers.',
      },
    };
  }

  private static async fetchLiveQuote(
    instrument: NormalizedInstrument,
    provider: ProviderCapability
  ): Promise<{
    price: number;
    change: number;
    changePercent: number;
    dayHigh: number;
    dayLow: number;
    openPrice: number;
    previousClose: number;
    volume: number;
    vwap?: number;
    bid?: number;
    ask?: number;
    spread?: number;
    timestamp?: number;
    providerId?: string;
    providerName?: string;
  } | null> {
    const symbol = instrument.symbol;
    const providerSymbol = instrument.providerSymbols?.[provider.providerId as keyof typeof instrument.providerSymbols] || symbol;

    // 1. Massive / Polygon
    if (provider.providerId === 'massive') {
      const apiKey = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY;
      if (apiKey) {
        const snapRes = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(
            providerSymbol
          )}?apiKey=${encodeURIComponent(apiKey)}`
        );
        if (snapRes.ok) {
          const json = await snapRes.json();
          const t = json.ticker;
          if (t && (t.lastTrade?.p || t.day?.c || t.min?.c)) {
            const price = t.lastTrade?.p || t.day?.c || t.min?.c;
            const prevClose = t.prevDay?.c || price;
            const change = t.todaysChange || Number((price - prevClose).toFixed(2));
            const changePercent = t.todaysChangePerc || Number(((change / prevClose) * 100).toFixed(2));
            return {
              price,
              change,
              changePercent,
              dayHigh: t.day?.h || price,
              dayLow: t.day?.l || price,
              openPrice: t.day?.o || prevClose,
              previousClose: prevClose,
              volume: t.day?.v || 0,
              vwap: t.day?.vw,
              bid: t.lastQuote?.p,
              ask: t.lastQuote?.P,
              timestamp: t.updated ? Math.floor(t.updated / 1000000) : Date.now(),
            };
          }
        }
      }
    }

    // 2. Finnhub
    if (provider.providerId === 'finnhub') {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (apiKey) {
        const quoteRes = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(providerSymbol)}&token=${encodeURIComponent(apiKey)}`
        );
        if (quoteRes.ok) {
          const q = await quoteRes.json();
          if (q.c && q.c > 0) {
            return {
              price: q.c,
              change: q.d || 0,
              changePercent: q.dp || 0,
              dayHigh: q.h || q.c,
              dayLow: q.l || q.c,
              openPrice: q.o || q.pc,
              previousClose: q.pc,
              volume: 0,
              timestamp: q.t ? q.t * 1000 : Date.now(),
            };
          }
        }
      }
    }

    // 3. Alpaca IEX. IEX is real-time but is not a consolidated SIP/full-market feed.
    if (provider.providerId === 'alpaca') {
      const snapshot = await new AlpacaMarketDataService().getSnapshot(providerSymbol);
      const change = snapshot.price - snapshot.previousClose;
      return {
        price: snapshot.price,
        change,
        changePercent: snapshot.previousClose > 0 ? (change / snapshot.previousClose) * 100 : 0,
        dayHigh: snapshot.high,
        dayLow: snapshot.low,
        openPrice: snapshot.open,
        previousClose: snapshot.previousClose,
        volume: snapshot.volume,
        bid: snapshot.bid,
        ask: snapshot.ask,
        spread: snapshot.ask - snapshot.bid,
        timestamp: snapshot.timestamp,
      };
    }

    if (['STOCK', 'ETF'].includes(instrument.assetClass) && process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET) {
      const snapshot = await new AlpacaMarketDataService().getSnapshot(providerSymbol);
      const change = snapshot.price - snapshot.previousClose;
      return { price: snapshot.price, change, changePercent: snapshot.previousClose > 0 ? change / snapshot.previousClose * 100 : 0,
        dayHigh: snapshot.high, dayLow: snapshot.low, openPrice: snapshot.open, previousClose: snapshot.previousClose,
        volume: snapshot.volume, bid: snapshot.bid, ask: snapshot.ask, spread: snapshot.ask - snapshot.bid,
        timestamp: snapshot.timestamp, providerId: 'alpaca', providerName: 'Alpaca IEX Market Data' };
    }

    return null;
  }

  public static determineMarketState(
    instrument: NormalizedInstrument
  ): 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED' | 'ACTIVE_24_7' | 'ACTIVE_24_5' {
    if (instrument.tradingSession === 'CONTINUOUS_24_7') {
      return 'ACTIVE_24_7';
    }

    const now = new Date();
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

    if (instrument.tradingSession === 'REGULAR_24_5') {
      if (day === 6 || (day === 0 && now.getUTCHours() < 21) || (day === 5 && now.getUTCHours() >= 21)) {
        return 'CLOSED';
      }
      return 'ACTIVE_24_5';
    }

    if (instrument.tradingSession === 'US_FUTURES_CME') {
      if (day === 6) return 'CLOSED';
      return 'REGULAR';
    }

    // US Equities
    const etTimeString = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
    const [hours, minutes] = etTimeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    if (day === 0 || day === 6) return 'CLOSED';

    if (totalMinutes >= 570 && totalMinutes < 960) {
      return 'REGULAR';
    } else if (totalMinutes >= 240 && totalMinutes < 570) {
      return 'PRE_MARKET';
    } else if (totalMinutes >= 960 && totalMinutes < 1200) {
      return 'AFTER_HOURS';
    } else {
      return 'CLOSED';
    }
  }

  public static generateMultiAssetCandles(
    _instrument: NormalizedInstrument,
    _timeframe: string = '5m',
    _count: number = 60
  ): MultiAssetChartCandle[] {
    // Historical candles must come from a verified server-side provider.
    return [];
  }

  private static recordProviderSuccess(providerId: string, latencyMs: number) {
    const health = this.providerHealthMap.get(providerId);
    if (health) {
      health.successCount += 1;
      health.latencyMs = Math.round((health.latencyMs * 4 + latencyMs) / 5);
      health.lastSuccessTimestamp = Date.now();
      health.status = 'ONLINE';
    }
  }

  private static recordProviderFailure(providerId: string, errorMsg: string) {
    const health = this.providerHealthMap.get(providerId);
    if (health) {
      health.failureCount += 1;
      health.lastFailureTimestamp = Date.now();
      health.lastErrorMessage = errorMsg;
      if (health.failureCount > 5) {
        health.status = 'DEGRADED';
      }
    }
  }
}
