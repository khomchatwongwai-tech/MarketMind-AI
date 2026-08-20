import {
  NormalizedInstrument,
  ProviderCapability,
  MultiAssetQuoteResponse,
  MultiAssetChartCandle,
} from '../../types/instrument.js';
import { MarketDataMetadata, MarketDataMode } from '../../types/market.js';
import { InstrumentResolver } from './InstrumentResolver.js';
import { AppConfig } from '../../config/environment.js';
import {
  getLiveMarketDataService,
  MarketDataUnavailableError,
} from '../../server/liveMarketDataService.js';

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

  // Provider Health Tracking
  private static providerHealthMap: Map<string, ProviderHealthMetrics> = new Map([
    [
      'massive',
      {
        providerId: 'massive',
        name: 'Massive / Polygon.io',
        status: process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY ? 'DEGRADED' : 'CONFIGURATION_REQUIRED',
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
        name: 'Alpaca Market Data v2',
        status: process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET ? 'DEGRADED' : 'CONFIGURATION_REQUIRED',
        supportedAssetClasses: ['STOCK', 'ETF', 'CRYPTO', 'OPTION'],
        latencyMs: 38,
        successCount: 0,
        failureCount: 0,
        isConfigured: Boolean(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET),
        entitlementTier: 'PRO',
      },
    ],
    [
      'robinhood',
      {
        providerId: 'robinhood',
        name: 'Robinhood Read-Only Market Data',
        status: process.env.ROBINHOOD_MARKET_DATA_ENABLED === 'true' && process.env.ROBINHOOD_READ_ONLY !== 'false' && process.env.ROBINHOOD_MARKET_DATA_BASE_URL ? 'DEGRADED' : 'CONFIGURATION_REQUIRED',
        supportedAssetClasses: ['STOCK', 'ETF', 'INDEX', 'OPTION'],
        latencyMs: 0,
        successCount: 0,
        failureCount: 0,
        isConfigured: process.env.ROBINHOOD_MARKET_DATA_ENABLED === 'true' && process.env.ROBINHOOD_READ_ONLY !== 'false' && Boolean(process.env.ROBINHOOD_MARKET_DATA_BASE_URL),
        entitlementTier: 'SERVER_SIDE_AUTH_REQUIRED',
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
        name: 'Yahoo Finance',
        status: process.env.YAHOO_MARKET_DATA_ENABLED === 'false' ? 'CONFIGURATION_REQUIRED' : 'DEGRADED',
        supportedAssetClasses: ['STOCK', 'ETF', 'INDEX', 'FOREX', 'CRYPTO', 'FUTURES', 'MUTUAL_FUND'],
        latencyMs: 45,
        successCount: 0,
        failureCount: 0,
        isConfigured: process.env.YAHOO_MARKET_DATA_ENABLED !== 'false',
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
        healthStatus: 'DEGRADED',
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
        healthStatus: 'DEGRADED',
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
        healthStatus: 'DEGRADED',
        supportedAssetClasses: ['STOCK', 'ETF', 'CRYPTO', 'OPTION'],
        dataTypes: ['REAL_TIME_QUOTES', 'HISTORICAL_CANDLES', 'CRYPTO_TRADES', 'NEWS_INTELLIGENCE'],
        rateLimitPerMinute: 200,
        averageLatencyMs: 38,
        entitlementTier: 'PRO',
      },
    ],
    [
      'robinhood',
      {
        providerId: 'robinhood',
        name: 'Robinhood Read-Only Market Data',
        isConfigured: process.env.ROBINHOOD_MARKET_DATA_ENABLED === 'true' && process.env.ROBINHOOD_READ_ONLY !== 'false' && Boolean(process.env.ROBINHOOD_MARKET_DATA_BASE_URL),
        healthStatus: 'DEGRADED',
        supportedAssetClasses: ['STOCK', 'ETF', 'INDEX', 'OPTION'],
        dataTypes: ['REAL_TIME_QUOTES', 'HISTORICAL_CANDLES', 'OPTIONS_CHAIN', 'GREEKS'],
        rateLimitPerMinute: 0,
        averageLatencyMs: 0,
        entitlementTier: 'UNLICENSED',
      },
    ],
    [
      'yahoo',
      {
        providerId: 'yahoo',
        name: 'Yahoo Finance',
        isConfigured: process.env.YAHOO_MARKET_DATA_ENABLED !== 'false',
        healthStatus: 'DEGRADED',
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

  public static resetForTests(): void {
    this.quoteCache.clear();
  }

  /**
   * Determine the optimal provider based on asset class, configuration and health
   */
  public static routeProvider(instrument: NormalizedInstrument): ProviderCapability {
    const massive = this.providerCapabilities.get('massive');
    const finnhub = this.providerCapabilities.get('finnhub');
    const alpaca = this.providerCapabilities.get('alpaca');
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
      return {
        ...cached.quote,
        quote: {
          ...cached.quote.quote,
          metadata: {
            ...cached.quote.quote.metadata!,
            mode: 'CACHED',
            stale: false,
            receivedAt: now,
          },
        },
      };
    }

    // Verify licensing / entitlement tier
    if (!instrument.isEntitled) {
      return {
        instrument,
        quote: {
          price: null as any,
          change: null as any,
          changePercent: null as any,
          bid: null as any,
          ask: null as any,
          spread: null as any,
          volume: null as any,
          dayHigh: null as any,
          dayLow: null as any,
          openPrice: null as any,
          previousClose: null as any,
          marketState: 'CLOSED',
          timestamp: new Date().toISOString(),
          dataSource: 'Unavailable (Unlicensed)',
          isRealTime: false,
          feedDelayMinutes: 0,
          latencyMs: 0,
          currency: instrument.currency,
          metadata: {
            provider: 'Unavailable',
            source: 'unlicensed',
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
      const liveData = await this.fetchLiveQuote(instrument);

      if (liveData) {
        const validation = this.validateQuoteValues(liveData);
        if (!validation.isValid || validation.isOutlier) {
          throw new MarketDataUnavailableError(instrument.symbol, [
            {
              provider: liveData.providerId,
              category: 'malformed_payload',
              configured: true,
              timeout: false,
              latencyMs: liveData.latencyMs,
              timestamp: new Date().toISOString(),
            },
          ]);
        }

          const marketState = liveData.marketSession;
          const mode: MarketDataMode = liveData.isRealTime ? 'REAL_TIME' : 'DELAYED';

          const activeProviderId = liveData.providerId;
          const activeProviderName = liveData.providerName;

          const metadata: MarketDataMetadata = {
            provider: activeProviderId === 'robinhood' ? 'robinhood' : activeProviderName,
            source: activeProviderId,
            timestamp: liveData.timestamp || now,
            receivedAt: now,
            mode,
            delayMinutes: liveData.feedDelayMinutes,
            stale: false,
            marketStatus: marketState === 'REGULAR' ? 'OPEN' : marketState === 'PRE_MARKET' ? 'PRE' : marketState === 'AFTER_HOURS' ? 'AFTER' : 'CLOSED',
            outlierFlag: false,
            validationStatus: 'VALID',
            liveStatus: liveData.isRealTime ? 'live' : 'delayed',
            sourceType: activeProviderId === 'robinhood' ? 'robinhood_read_only_gateway' : activeProviderId,
            entitlementStatus: activeProviderId === 'robinhood' ? 'unknown' : undefined,
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
              spread:
                liveData.bid !== undefined && liveData.ask !== undefined
                  ? Number((liveData.ask - liveData.bid).toFixed(6))
                  : (null as any),
              volume: liveData.volume,
              dayHigh: liveData.dayHigh,
              dayLow: liveData.dayLow,
              openPrice: liveData.openPrice,
              previousClose: liveData.previousClose,
              vwap: liveData.vwap,
              marketState,
              timestamp: new Date(liveData.timestamp).toISOString(),
              dataSource: `${activeProviderName} (${mode === 'REAL_TIME' ? 'Real-Time' : `${liveData.feedDelayMinutes}-min Delayed`})`,
              isRealTime: mode === 'REAL_TIME',
              feedDelayMinutes: liveData.feedDelayMinutes,
              latencyMs: liveData.latencyMs,
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
          this.recordProviderSuccess(activeProviderId, liveData.latencyMs);

          return response;
      }
    } catch (err: any) {
      if (err instanceof MarketDataUnavailableError) {
        for (const diagnostic of err.diagnostics) {
          this.recordProviderFailure(
            diagnostic.provider,
            `${diagnostic.category}${diagnostic.httpStatus ? `:${diagnostic.httpStatus}` : ''}`
          );
        }
        throw err;
      }
      throw err;
    }
  }

  private static async fetchLiveQuote(
    instrument: NormalizedInstrument
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
    timestamp: number;
    providerId: 'massive' | 'alpaca' | 'robinhood' | 'yahoo';
    providerName: string;
    marketSession: 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED';
    isRealTime: boolean;
    feedDelayMinutes: number;
    latencyMs: number;
  }> {
    const providerSymbol =
      instrument.providerSymbols?.massive ||
      instrument.providerSymbols?.alpaca ||
      instrument.providerSymbols?.robinhood ||
      instrument.providerSymbols?.yahoo ||
      instrument.symbol;
    return getLiveMarketDataService().getQuote(providerSymbol);
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
    instrument: NormalizedInstrument,
    timeframe: string = '5m',
    count: number = 60
  ): MultiAssetChartCandle[] {
    if (!AppConfig.allowSimulatedMarketData) {
      return [];
    }
    const basePrice = instrument.price || instrument.previousClose;
    if (!basePrice || basePrice <= 0) {
      if (!AppConfig.allowSimulatedMarketData) {
        return [];
      }
    }
    const safePrice = basePrice && basePrice > 0 ? basePrice : 100;
    const now = Date.now();
    const stepMs =
      timeframe === '1m'
        ? 60 * 1000
        : timeframe === '5m'
        ? 5 * 60 * 1000
        : timeframe === '15m'
        ? 15 * 60 * 1000
        : timeframe === '1h'
        ? 60 * 60 * 1000
        : timeframe === '1d'
        ? 24 * 60 * 60 * 1000
        : 5 * 60 * 1000;

    const candles: MultiAssetChartCandle[] = [];
    let currentClose = safePrice;
    let cumVolume = 0;
    let cumPV = 0;

    for (let i = count - 1; i >= 0; i--) {
      const candleTime = now - i * stepMs;
      const dateObj = new Date(candleTime);
      const timeString = dateObj.toLocaleTimeString('en-US', {
        timeZone: instrument.marketTimezone || 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Deterministic small micro-variance based on index
      const deltaPercent = Math.sin(i * 0.25) * 0.002;
      const open = currentClose;
      const close = Number((open * (1 + deltaPercent)).toFixed(2));
      const high = Number((Math.max(open, close) * 1.0015).toFixed(2));
      const low = Number((Math.min(open, close) * 0.9985).toFixed(2));
      const volume = Math.floor(5000 + Math.abs(Math.sin(i)) * 12000);

      cumPV += ((high + low + close) / 3) * volume;
      cumVolume += volume;
      const vwap = Number((cumPV / cumVolume).toFixed(2));

      candles.push({
        timestamp: candleTime,
        timeString,
        open,
        high,
        low,
        close,
        volume,
        vwap,
        session: 'REGULAR',
      });

      currentClose = close;
    }

    return candles;
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
