import {
  AssetClass,
  ChartInterval,
  HistoricalBar,
  MarketDataProvider,
  MarketStatusInfo,
  OptionsChainData,
} from '../../types/marketProviders.js';
import { MarketQuote } from '../../types/market.js';
import { AppConfig } from '../../config/environment.js';
import { CapacitorPlatform } from '../mobile/capacitorPlatform.js';

export class InstitutionalMarketDataProvider implements MarketDataProvider {
  readonly id = 'institutional_multi_provider';
  readonly name = 'MarketMind Institutional Multi-Asset Feed';
  readonly supportedAssetClasses: AssetClass[] = [
    'STOCK',
    'ETF',
    'INDEX',
    'CRYPTO',
    'TREASURY',
    'COMMODITY',
    'OPTION',
  ];

  private quoteSubscriptions = new Map<string, Set<(quote: MarketQuote) => void>>();
  private pollingInterval: NodeJS.Timeout | null = null;
  private latestQuotesCache = new Map<string, MarketQuote>();

  constructor() {
    this.startLiveStreamSimulation();
  }

  private startLiveStreamSimulation() {
    if (typeof window === 'undefined') return;
    this.pollingInterval = setInterval(() => {
      // Only simulate if demo / simulated market data is explicitly authorized
      if (!AppConfig.allowSimulatedMarketData) {
        return;
      }
      this.quoteSubscriptions.forEach((callbacks, symbol) => {
        const cached = this.latestQuotesCache.get(symbol);
        if (cached) {
          const deltaPct = ((cached.price % 7) - 3.5) * 0.005;
          const newPrice = Number((cached.price * (1 + deltaPct / 100)).toFixed(2));
          const change = Number((newPrice - cached.previousClose).toFixed(2));
          const changePercent = Number(((change / cached.previousClose) * 100).toFixed(2));
          const updated: MarketQuote = {
            ...cached,
            price: newPrice,
            change,
            changePercent,
            dayHigh: Math.max(cached.dayHigh, newPrice),
            dayLow: Math.min(cached.dayLow, newPrice),
            volume: cached.volume + 5000,
            timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
          };
          this.latestQuotesCache.set(symbol, updated);
          callbacks.forEach((cb) => cb(updated));
        }
      });
    }, 2500);
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const sym = symbol.toUpperCase().trim();
    // Check if backend API has it
    try {
      const baseUrl = CapacitorPlatform.getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/market/quote/${encodeURIComponent(sym)}`);
      if (res.ok) {
        const json = await res.json();
        const providerQuote = json?.quote;
        const instrument = json?.instrument;
        const required = [
          providerQuote?.price,
          providerQuote?.change,
          providerQuote?.changePercent,
          providerQuote?.dayHigh,
          providerQuote?.dayLow,
          providerQuote?.openPrice,
          providerQuote?.previousClose,
          providerQuote?.volume,
        ];
        if (
          json?.entitlementStatus?.isAvailable &&
          providerQuote?.metadata?.validationStatus === 'VALID' &&
          providerQuote?.metadata?.stale === false &&
          required.every((value) => typeof value === 'number' && Number.isFinite(value))
        ) {
          const quote: MarketQuote = {
            ticker: sym as any,
            name: instrument?.name || `${sym} Asset`,
            price: providerQuote.price,
            change: providerQuote.change,
            changePercent: providerQuote.changePercent,
            dayHigh: providerQuote.dayHigh,
            dayLow: providerQuote.dayLow,
            openPrice: providerQuote.openPrice,
            previousClose: providerQuote.previousClose,
            preMarketPrice: null as any,
            preMarketChangePercent: null as any,
            volume: providerQuote.volume,
            avgVolume: null as any,
            relativeVolume: null as any,
            fiftyTwoWeekHigh: null as any,
            fiftyTwoWeekLow: null as any,
            timestamp: providerQuote.timestamp,
            marketStatus: providerQuote.marketState,
            dataStatus: providerQuote.metadata.mode,
            dataSource: providerQuote.dataSource,
            latencyMs: providerQuote.latencyMs,
            currency: providerQuote.currency,
            exchange: instrument?.exchange,
            bid: providerQuote.bid,
            ask: providerQuote.ask,
            metadata: providerQuote.metadata,
          };
          this.latestQuotesCache.set(sym, quote);
          return quote;
        }
      }
    } catch {
      // fallback to generated asset quote only in demo mode
    }

    if (!AppConfig.allowSimulatedMarketData) {
      throw new Error(`Real-time quote for ${sym} is temporarily unavailable.`);
    }

    // Default Multi-Asset Catalog for explicit DEMO/SIMULATION mode only
    const assetCatalog: Record<string, { name: string; price: number; prevClose: number; vol: number }> = {
      SPY: { name: 'SPDR S&P 500 ETF Trust', price: 512.48, prevClose: 508.28, vol: 48200000 },
      QQQ: { name: 'Invesco QQQ Trust (Nasdaq 100)', price: 442.35, prevClose: 438.10, vol: 36500000 },
      DIA: { name: 'SPDR Dow Jones Industrial Average ETF', price: 389.80, prevClose: 388.50, vol: 3200000 },
      IWM: { name: 'iShares Russell 2000 ETF', price: 214.80, prevClose: 212.10, vol: 24500000 },
      NVDA: { name: 'NVIDIA Corporation', price: 128.60, prevClose: 124.90, vol: 62000000 },
      TSLA: { name: 'Tesla, Inc.', price: 218.40, prevClose: 212.80, vol: 54000000 },
      AAPL: { name: 'Apple Inc.', price: 224.20, prevClose: 221.50, vol: 38000000 },
      MSFT: { name: 'Microsoft Corporation', price: 428.90, prevClose: 425.10, vol: 21000000 },
      AMZN: { name: 'Amazon.com, Inc.', price: 186.75, prevClose: 184.20, vol: 28000000 },
      META: { name: 'Meta Platforms, Inc.', price: 514.30, prevClose: 506.80, vol: 14500000 },
      AMD: { name: 'Advanced Micro Devices, Inc.', price: 154.20, prevClose: 150.80, vol: 32000000 },
      BTC: { name: 'Bitcoin (USD Spot)', price: 67820.00, prevClose: 66200.00, vol: 245000 },
      ETH: { name: 'Ethereum (USD Spot)', price: 3510.50, prevClose: 3420.00, vol: 185000 },
      SOL: { name: 'Solana (USD Spot)', price: 152.40, prevClose: 146.80, vol: 420000 },
      US10Y: { name: 'U.S. 10-Year Treasury Yield', price: 4.22, prevClose: 4.25, vol: 0 },
      US02Y: { name: 'U.S. 2-Year Treasury Yield', price: 4.45, prevClose: 4.48, vol: 0 },
      CL: { name: 'WTI Crude Oil Futures', price: 78.45, prevClose: 79.15, vol: 320000 },
      XAU: { name: 'Gold Spot (USD / Troy Oz)', price: 2342.10, prevClose: 2321.50, vol: 140000 },
      XAG: { name: 'Silver Spot (USD / Troy Oz)', price: 28.60, prevClose: 27.90, vol: 85000 },
      VIX: { name: 'CBOE Volatility Index', price: 14.28, prevClose: 14.89, vol: 0 },
    };

    const entry = assetCatalog[sym] || {
      name: `${sym} Security`,
      price: 100.00,
      prevClose: 98.50,
      vol: 1000000,
    };

    const change = Number((entry.price - entry.prevClose).toFixed(2));
    const changePercent = Number(((change / entry.prevClose) * 100).toFixed(2));

    const quote: MarketQuote = {
      ticker: sym as any,
      name: entry.name,
      price: entry.price,
      change,
      changePercent,
      dayHigh: Number((entry.price * 1.008).toFixed(2)),
      dayLow: Number((entry.price * 0.992).toFixed(2)),
      openPrice: Number((entry.price * 0.998).toFixed(2)),
      previousClose: entry.prevClose,
      preMarketPrice: Number((entry.price * 1.001).toFixed(2)),
      preMarketChangePercent: 0.1,
      volume: entry.vol,
      avgVolume: Math.floor(entry.vol * 1.05),
      relativeVolume: 1.15,
      fiftyTwoWeekHigh: Number((entry.price * 1.25).toFixed(2)),
      fiftyTwoWeekLow: Number((entry.price * 0.75).toFixed(2)),
      timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
      marketStatus: 'REGULAR',
      dataSource: this.name,
      latencyMs: 12,
    };

    this.latestQuotesCache.set(sym, quote);
    return quote;
  }

  async getHistoricalBars(
    symbol: string,
    interval: ChartInterval = '5m',
    limit: number = 100
  ): Promise<HistoricalBar[]> {
    const sym = symbol.toUpperCase().trim();
    try {
      const res = await fetch(`/api/market/candles/${encodeURIComponent(sym)}?timeframe=${interval}&limit=${limit}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.candles) && json.candles.length > 0) {
          return json.candles
            .filter((c: any) => {
              const timestamp = Number(c.time);
              const values = [c.open, c.high, c.low, c.close, c.volume].map(Number);
              return (
                Number.isFinite(timestamp) &&
                timestamp > 0 &&
                values.every(Number.isFinite) &&
                values.slice(0, 4).every((value) => value > 0) &&
                values[4] >= 0
              );
            })
            .map((c: any) => ({
              timestamp: Number(c.time) < 10000000000 ? Number(c.time) * 1000 : Number(c.time),
              timeString:
                c.timeString ||
                new Date(Number(c.time) < 10000000000 ? Number(c.time) * 1000 : Number(c.time)).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
              volume: Number(c.volume),
              vwap: Number.isFinite(Number(c.vwap)) ? Number(c.vwap) : undefined,
            }));
        }
      }
    } catch {
      // fallback
    }

    if (!AppConfig.allowSimulatedMarketData) {
      return [];
    }

    const quote = await this.getQuote(sym);
    const bars: HistoricalBar[] = [];
    const now = Date.now();
    const stepMs =
      interval === '1m' ? 60000 :
      interval === '5m' ? 300000 :
      interval === '15m' ? 900000 :
      interval === '30m' ? 1800000 :
      interval === '1h' ? 3600000 :
      interval === '4h' ? 14400000 :
      interval === '1d' ? 86400000 : 604800000;

    let p = quote.previousClose;
    let cumV = 0;
    let cumPV = 0;

    for (let i = limit; i >= 0; i--) {
      const t = now - i * stepMs;
      const o = p;
      const wave = Math.sin((i + sym.charCodeAt(0)) / 5) * (quote.price * 0.003);
      const harmonicNoise = Math.cos((i * 2 + sym.charCodeAt(sym.length - 1)) / 7) * (quote.price * 0.002);
      const c = Number((o + wave + harmonicNoise).toFixed(2));
      const h = Number((Math.max(o, c) + Math.abs(wave) * 0.5).toFixed(2));
      const l = Number((Math.min(o, c) - Math.abs(harmonicNoise) * 0.5).toFixed(2));
      const v = Math.floor(25000 + Math.abs(Math.sin(i / 3)) * 35000);
      const typ = (h + l + c) / 3;
      cumV += v;
      cumPV += typ * v;
      const vwap = Number((cumPV / cumV).toFixed(2));

      bars.push({
        timestamp: t,
        timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
        vwap,
      });
      p = c;
    }
    return bars;
  }

  async getMarketStatus(): Promise<MarketStatusInfo> {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const etHours = (utcHours - 4 + 24) % 24; // EDT offset approximation

    let status: MarketStatusInfo['status'] = 'REGULAR';
    let sessionName = 'Regular Trading Hours (US Cash)';
    let isOpen = true;

    if (etHours < 4) {
      status = 'CLOSED';
      sessionName = 'Overnight Market Closed';
      isOpen = false;
    } else if (etHours >= 4 && (etHours < 9 || (etHours === 9 && utcMinutes < 30))) {
      status = 'PRE_MARKET';
      sessionName = 'Pre-Market Session';
      isOpen = true;
    } else if (etHours >= 16 && etHours < 20) {
      status = 'AFTER_HOURS';
      sessionName = 'After-Hours Session';
      isOpen = true;
    } else if (etHours >= 20) {
      status = 'CLOSED';
      sessionName = 'Market Closed';
      isOpen = false;
    }

    return {
      status,
      sessionName,
      isOpen,
      nextOpen: '09:30 AM ET',
      nextClose: '04:00 PM ET',
      serverTimeET: now.toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
    };
  }

  async getOptionsChain(symbol: string): Promise<OptionsChainData> {
    if (!AppConfig.allowSimulatedMarketData) {
      throw new Error(`Verified options data for ${symbol.toUpperCase().trim()} is unavailable.`);
    }
    const sym = symbol.toUpperCase().trim();
    let p = 100;
    try {
      const quote = await this.getQuote(sym);
      p = quote.price;
    } catch {
      // Deterministic anchor reference when real-time quote is unavailable in unit test or offline
      const standardAnchors: Record<string, number> = {
        SPY: 512.48,
        QQQ: 442.35,
        DIA: 389.80,
        IWM: 214.80,
        NVDA: 128.60,
        TSLA: 218.40,
        AAPL: 224.20,
        MSFT: 428.90,
      };
      p = standardAnchors[sym] || 100.0;
    }

    const expirations = ['0DTE', '1W (Next Friday)', '2W', '1M', '3M', '6M'];
    const strikes: number[] = [];
    const step = p > 300 ? 5 : p > 100 ? 2.5 : 1;
    for (let i = -6; i <= 6; i++) {
      strikes.push(Number((Math.round(p / step) * step + i * step).toFixed(2)));
    }

    const calls = strikes.map((strike) => {
      const itm = p > strike;
      const intrinsic = Math.max(0, p - strike);
      const timeVal = Math.max(0.2, (10 - Math.abs(p - strike)) * 0.15);
      const mid = Number((intrinsic + timeVal).toFixed(2));
      const iv = Number((0.24 + Math.abs(p - strike) * 0.001).toFixed(2));
      const delta = Number((itm ? 0.5 + (p - strike) / (p * 0.2) : 0.5 - (strike - p) / (p * 0.2)).toFixed(2));

      const dist = Math.abs(p - strike);
      const vol = Math.max(0, Math.round(5000 * Math.exp(-dist / (p * 0.02))));
      const oi = Math.max(0, Math.round(8000 * Math.exp(-dist / (p * 0.02))));

      return {
        contractSymbol: `${sym}_${strike}_C`,
        strike,
        expiration: 'Weekly 0DTE',
        type: 'CALL' as const,
        bid: Number(Math.max(0.01, mid - 0.05).toFixed(2)),
        ask: Number((mid + 0.05).toFixed(2)),
        last: mid,
        volume: vol,
        openInterest: oi,
        impliedVolatility: iv,
        delta: Math.min(0.99, Math.max(0.01, delta)),
        gamma: 0.04,
        theta: -0.18,
        vega: 0.12,
        inTheMoney: itm,
      };
    });

    const puts = strikes.map((strike) => {
      const itm = p < strike;
      const intrinsic = Math.max(0, strike - p);
      const timeVal = Math.max(0.2, (10 - Math.abs(p - strike)) * 0.15);
      const mid = Number((intrinsic + timeVal).toFixed(2));
      const iv = Number((0.25 + Math.abs(p - strike) * 0.001).toFixed(2));
      const delta = Number((itm ? -0.5 - (strike - p) / (p * 0.2) : -0.5 + (p - strike) / (p * 0.2)).toFixed(2));
      const dist = Math.abs(p - strike);
      const vol = Math.max(0, Math.round(4500 * Math.exp(-dist / (p * 0.02))));
      const oi = Math.max(0, Math.round(7500 * Math.exp(-dist / (p * 0.02))));

      return {
        contractSymbol: `${sym}_${strike}_P`,
        strike,
        expiration: 'Weekly 0DTE',
        type: 'PUT' as const,
        bid: Number(Math.max(0.01, mid - 0.05).toFixed(2)),
        ask: Number((mid + 0.05).toFixed(2)),
        last: mid,
        volume: vol,
        openInterest: oi,
        impliedVolatility: iv,
        delta: Math.min(-0.01, Math.max(-0.99, delta)),
        gamma: 0.04,
        theta: -0.17,
        vega: 0.12,
        inTheMoney: itm,
      };
    });

    const totalCallVol = calls.reduce((acc, c) => acc + c.volume, 0);
    const totalPutVol = puts.reduce((acc, c) => acc + c.volume, 0);

    return {
      ticker: sym,
      underlyingPrice: p,
      expirations,
      calls,
      puts,
      putCallRatio: Number((totalPutVol / (totalCallVol || 1)).toFixed(2)),
      totalCallVolume: totalCallVol,
      totalPutVolume: totalPutVol,
      totalCallOpenInterest: calls.reduce((acc, c) => acc + c.openInterest, 0),
      totalPutOpenInterest: puts.reduce((acc, c) => acc + c.openInterest, 0),
      impliedVolatilityRank: 42,
      historicalVolatility: 18.5,
    };
  }

  subscribeToQuotes(symbols: string[], callback: (quote: MarketQuote) => void): void {
    symbols.forEach((sym) => {
      const s = sym.toUpperCase().trim();
      if (!this.quoteSubscriptions.has(s)) {
        this.quoteSubscriptions.set(s, new Set());
      }
      this.quoteSubscriptions.get(s)!.add(callback);
      // Immediately push cached if available
      const cached = this.latestQuotesCache.get(s);
      if (cached) callback(cached);
      else this.getQuote(s).then(callback);
    });
  }

  unsubscribeFromQuotes(symbols: string[]): void {
    symbols.forEach((sym) => {
      const s = sym.toUpperCase().trim();
      this.quoteSubscriptions.delete(s);
    });
  }

  async getHealth() {
    return {
      status: 'ONLINE' as const,
      latencyMs: 14,
    };
  }
}
