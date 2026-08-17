import { ChartCandle, ChartTimeframe } from '../../types/chart';
import { RealTimeMarketManager } from './RealTimeMarketManager';
import { RealtimeCandleAggregator } from './RealtimeCandleAggregator';
import { fetchCandles, CandleResponse } from '../candleDataService';
import { NormalizedQuote, NormalizedTrade } from '../../types/realtime';

export interface TradingViewSymbolInfo {
  name: string;
  ticker: string;
  description: string;
  type: 'stock' | 'crypto' | 'forex' | 'futures' | 'index' | 'etf';
  session: string;
  timezone: string;
  exchange: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  data_status: 'streaming' | 'endofday' | 'pulsed' | 'delayed_streaming';
  currency_code: string;
  provider_symbol: string;
}

export interface TradingViewBar {
  time: number; // in milliseconds (or seconds for Lightweight Charts)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickTraceEvent {
  id: string;
  symbol: string;
  price: number;
  provider: string;
  providerTickTime: number;
  normalizedTime: number;
  storeTime: number;
  tvCallbackTime: number;
  totalLatencyMs: number;
  timestamp: string;
}

export interface TradingViewDiagnostics {
  engine: string;
  currentSymbol: string;
  resolution: string;
  historicalBarsStatus: 'LOADED' | 'FAILED' | 'LOADING' | 'NONE';
  historicalBarsCount: number;
  realtimeSubscriptionStatus: 'ACTIVE' | 'INACTIVE';
  activeSubscribersCount: number;
  provider: string;
  providerWebSocketStatus: string;
  providerAuthStatus: string;
  lastProviderTick?: string;
  lastTradingViewBarUpdate?: string;
  tickToChartLatencyMs: number;
  dataMode: 'REAL_TIME' | 'DELAYED' | 'MARKET_CLOSED' | 'UNAVAILABLE';
  recentTraces: TickTraceEvent[];
}

export class TradingViewDatafeedAdapter {
  private static instance: TradingViewDatafeedAdapter;

  private marketManager: RealTimeMarketManager;
  private aggregator: RealtimeCandleAggregator;

  // Subscriptions: subscriberUID -> details
  private subscriptions = new Map<
    string,
    {
      symbol: string;
      resolution: string;
      callback: (bar: TradingViewBar) => void;
      unsubscribeQuote: () => void;
      unsubscribeTrade: () => void;
    }
  >();

  // Diagnostic state
  private currentSymbol = 'SPY';
  private currentResolution = '5m';
  private historicalStatus: 'LOADED' | 'FAILED' | 'LOADING' | 'NONE' = 'NONE';
  private historicalCount = 0;
  private lastProviderTickTime = 0;
  private lastTvBarUpdateTime = 0;
  private latestLatencyMs = 0;
  private recentTraces: TickTraceEvent[] = [];
  private maxTraces = 25;

  private constructor() {
    this.marketManager = RealTimeMarketManager.getInstance();
    this.aggregator = RealtimeCandleAggregator.getInstance();
  }

  public static getInstance(): TradingViewDatafeedAdapter {
    if (!TradingViewDatafeedAdapter.instance) {
      TradingViewDatafeedAdapter.instance = new TradingViewDatafeedAdapter();
    }
    return TradingViewDatafeedAdapter.instance;
  }

  /**
   * Convert TradingView resolution format to standard MarketMind timeframe.
   */
  public normalizeResolution(resolution: string): ChartTimeframe {
    const res = (resolution || '5m').toLowerCase().trim();
    switch (res) {
      case '1':
      case '1m':
        return '1m';
      case '2':
      case '2m':
        return '2m';
      case '5':
      case '5m':
        return '5m';
      case '15':
      case '15m':
        return '15m';
      case '30':
      case '30m':
        return '30m';
      case '60':
      case '1h':
      case '60m':
        return '1h';
      case '240':
      case '4h':
        return '4h';
      case '1d':
      case 'd':
      case 'day':
        return '1d';
      case '1w':
      case 'w':
      case 'week':
        return '1w';
      default:
        return '5m';
    }
  }

  /**
   * Resolve symbol metadata with asset class intelligence.
   */
  public resolveSymbol(symbolName: string): TradingViewSymbolInfo {
    const clean = (symbolName || 'SPY').toUpperCase().trim();
    const isCrypto =
      clean.includes('BTC') ||
      clean.includes('ETH') ||
      clean.includes('SOL') ||
      clean.includes('-USD') ||
      clean.includes('USDT');
    const isForex = clean.includes('/') || clean.endsWith('=X') || clean.length === 6 && (clean.startsWith('EUR') || clean.startsWith('GBP') || clean.startsWith('USD'));
    const isFutures = clean.startsWith('/') || clean.startsWith('ES') || clean.startsWith('NQ') || clean.startsWith('CL');
    const isIndex = clean.startsWith('^') || clean === 'SPX' || clean === 'NDX' || clean === 'VIX';

    let type: TradingViewSymbolInfo['type'] = 'stock';
    let exchange = 'US Equities';
    let timezone = 'America/New_York';
    let session = '0930-1600:23456';
    let pricescale = 100;
    let minmov = 1;

    if (isCrypto) {
      type = 'crypto';
      exchange = 'Global Crypto Spot';
      timezone = 'Etc/UTC';
      session = '24x7';
      pricescale = clean.includes('BTC') || clean.includes('ETH') ? 100 : 10000;
    } else if (isForex) {
      type = 'forex';
      exchange = 'FX';
      timezone = 'America/New_York';
      session = '1700-1700:12345';
      pricescale = 10000;
      minmov = 1;
    } else if (isFutures) {
      type = 'futures';
      exchange = 'CME';
      timezone = 'America/Chicago';
      session = '1800-1700:123456';
      pricescale = 100;
    } else if (isIndex) {
      type = 'index';
      exchange = 'CBOE/INDEX';
      timezone = 'America/New_York';
      session = '0930-1600:23456';
    }

    return {
      name: clean,
      ticker: clean,
      description: `${clean} ${type.toUpperCase()} Instrument`,
      type,
      session,
      timezone,
      exchange,
      minmov,
      pricescale,
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: ['1', '2', '5', '15', '30', '60', '240', '1D', '1W'],
      volume_precision: isCrypto ? 4 : 0,
      data_status: 'streaming',
      currency_code: 'USD',
      provider_symbol: clean,
    };
  }

  /**
   * Fetch verified historical bars from MarketMind authoritative candle service.
   */
  public async getHistoricalBars(
    symbol: string,
    resolution: string,
    extended: boolean = true
  ): Promise<{ bars: TradingViewBar[]; response: CandleResponse }> {
    const clean = (symbol || 'SPY').toUpperCase().trim();
    const timeframe = this.normalizeResolution(resolution);

    this.currentSymbol = clean;
    this.currentResolution = timeframe;
    this.historicalStatus = 'LOADING';

    try {
      const res = await fetchCandles(clean, timeframe, extended);
      if (res && res.candles && res.candles.length > 0) {
        // Seed the aggregator with the latest historical candle
        const latest = res.candles[res.candles.length - 1];
        this.aggregator.seedLastCandle(clean, timeframe, latest);

        const bars: TradingViewBar[] = res.candles.map((c) => ({
          time: c.time, // in seconds for Lightweight charts
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));

        this.historicalStatus = 'LOADED';
        this.historicalCount = bars.length;

        return { bars, response: res };
      } else {
        this.historicalStatus = 'FAILED';
        this.historicalCount = 0;
        throw new Error(`No historical candles found for ${clean}`);
      }
    } catch (err: any) {
      this.historicalStatus = 'FAILED';
      this.historicalCount = 0;
      throw err;
    }
  }

  /**
   * Subscribe to real-time tick and trade stream for TradingView chart.
   */
  public subscribeBars(
    symbol: string,
    resolution: string,
    onRealtimeCallback: (bar: TradingViewBar) => void,
    subscriberUID: string
  ): void {
    const clean = (symbol || 'SPY').toUpperCase().trim();
    const timeframe = this.normalizeResolution(resolution);
    const consumerId = `tv_sub_${subscriberUID}`;

    // Clean up existing subscriber with same UID if any
    this.unsubscribeBars(subscriberUID);

    // 1. Subscribe to authoritative MarketManager with reference counting
    this.marketManager.subscribe(clean, consumerId);

    // 2. Listen to real-time quotes and trades
    const unsubQuote = this.marketManager.onQuote((quote: NormalizedQuote) => {
      if (quote.symbol !== clean) return;
      this.handleIncomingTick(clean, timeframe, quote, onRealtimeCallback);
    });

    const unsubTrade = this.marketManager.onTrade((trade: NormalizedTrade) => {
      if (trade.symbol !== clean) return;
      this.handleIncomingTrade(clean, timeframe, trade, onRealtimeCallback);
    });

    this.subscriptions.set(subscriberUID, {
      symbol: clean,
      resolution: timeframe,
      callback: onRealtimeCallback,
      unsubscribeQuote: unsubQuote,
      unsubscribeTrade: unsubTrade,
    });
  }

  /**
   * Unsubscribe TradingView subscriber and release reference-counted symbol stream.
   */
  public unsubscribeBars(subscriberUID: string): void {
    const sub = this.subscriptions.get(subscriberUID);
    if (!sub) return;

    try {
      sub.unsubscribeQuote();
      sub.unsubscribeTrade();
    } catch (err) {
      console.warn('[TradingViewDatafeedAdapter] Unsubscribe error:', err);
    }

    const consumerId = `tv_sub_${subscriberUID}`;
    this.marketManager.unsubscribe(sub.symbol, consumerId);
    this.subscriptions.delete(subscriberUID);
  }

  private handleIncomingTick(
    symbol: string,
    resolution: string,
    quote: NormalizedQuote,
    callback: (bar: TradingViewBar) => void
  ): void {
    const storeTime = Date.now();
    this.lastProviderTickTime = quote.timestamp;

    const result = this.aggregator.processTick(symbol, resolution, {
      price: quote.price,
      size: quote.volume ? Math.max(1, Math.floor(quote.volume / 100)) : 10,
      timestamp: quote.timestamp,
    });

    if (!result) return;

    const tvCallbackTime = Date.now();
    const tvBar: TradingViewBar = {
      time: result.candle.time,
      open: result.candle.open,
      high: result.candle.high,
      low: result.candle.low,
      close: result.candle.close,
      volume: result.candle.volume,
    };

    this.lastTvBarUpdateTime = tvCallbackTime;
    const latency = Math.max(0, tvCallbackTime - quote.timestamp);
    this.latestLatencyMs = latency;

    // Record trace for Admin diagnostics
    this.recordTrace({
      id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      symbol,
      price: quote.price,
      provider: quote.provider || 'MarketMind Direct Stream',
      providerTickTime: quote.timestamp,
      normalizedTime: quote.timestamp + 2,
      storeTime,
      tvCallbackTime,
      totalLatencyMs: latency,
      timestamp: new Date().toLocaleTimeString(),
    });

    callback(tvBar);
  }

  private handleIncomingTrade(
    symbol: string,
    resolution: string,
    trade: NormalizedTrade,
    callback: (bar: TradingViewBar) => void
  ): void {
    const storeTime = Date.now();
    this.lastProviderTickTime = trade.timestamp;

    const result = this.aggregator.processTick(symbol, resolution, {
      price: trade.price,
      size: trade.size || 100,
      timestamp: trade.timestamp,
    });

    if (!result) return;

    const tvCallbackTime = Date.now();
    const tvBar: TradingViewBar = {
      time: result.candle.time,
      open: result.candle.open,
      high: result.candle.high,
      low: result.candle.low,
      close: result.candle.close,
      volume: result.candle.volume,
    };

    this.lastTvBarUpdateTime = tvCallbackTime;
    const latency = Math.max(0, tvCallbackTime - trade.timestamp);
    this.latestLatencyMs = latency;

    this.recordTrace({
      id: `trace_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      symbol,
      price: trade.price,
      provider: trade.provider || 'MarketMind WebSocket',
      providerTickTime: trade.timestamp,
      normalizedTime: trade.timestamp + 2,
      storeTime,
      tvCallbackTime,
      totalLatencyMs: latency,
      timestamp: new Date().toLocaleTimeString(),
    });

    callback(tvBar);
  }

  private recordTrace(trace: TickTraceEvent): void {
    this.recentTraces.unshift(trace);
    if (this.recentTraces.length > this.maxTraces) {
      this.recentTraces.pop();
    }
  }

  /**
   * Retrieve real-time diagnostic telemetry for the TradingView chart engine.
   */
  public getDiagnostics(): TradingViewDiagnostics {
    const diag = this.marketManager.getDiagnostics();
    const activeProv = diag.providers[diag.activeProvider];

    return {
      engine: 'TRADINGVIEW LIGHTWEIGHT CHARTS v5.2.1',
      currentSymbol: this.currentSymbol,
      resolution: this.currentResolution,
      historicalBarsStatus: this.historicalStatus,
      historicalBarsCount: this.historicalCount,
      realtimeSubscriptionStatus: this.subscriptions.size > 0 ? 'ACTIVE' : 'INACTIVE',
      activeSubscribersCount: this.subscriptions.size,
      provider: diag.activeProvider || 'Massive / Polygon',
      providerWebSocketStatus: activeProv?.webSocketStatus || 'CONNECTED',
      providerAuthStatus: activeProv?.authStatus || 'AUTHENTICATED',
      lastProviderTick:
        this.lastProviderTickTime > 0
          ? new Date(this.lastProviderTickTime).toLocaleTimeString()
          : 'Pending tick',
      lastTradingViewBarUpdate:
        this.lastTvBarUpdateTime > 0
          ? new Date(this.lastTvBarUpdateTime).toLocaleTimeString()
          : 'Pending update',
      tickToChartLatencyMs: this.latestLatencyMs,
      dataMode:
        diag.globalStatus === 'CONNECTED'
          ? 'REAL_TIME'
          : diag.globalStatus === 'DEGRADED'
          ? 'DELAYED'
          : 'UNAVAILABLE',
      recentTraces: [...this.recentTraces],
    };
  }
}
