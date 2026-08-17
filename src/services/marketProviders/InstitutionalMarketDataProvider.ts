import {
  AssetClass,
  ChartInterval,
  HistoricalBar,
  MarketDataProvider,
  MarketStatusInfo,
  OptionsChainData,
} from '../../types/marketProviders';
import { MarketQuote } from '../../types/market';

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
  private latestQuotesCache = new Map<string, MarketQuote>();

  async getQuote(symbol: string): Promise<MarketQuote> {
    const sym = symbol.toUpperCase().trim();
    // Check if backend API has it
    try {
      const res = await fetch(`/api/market/quote/${encodeURIComponent(sym)}`);
      if (res.ok) {
        const json = await res.json();
        if (
          json &&
          Number(json.price) > 0 &&
          Number(json.previousClose) > 0 &&
          Number(json.dayHigh) > 0 &&
          Number(json.dayLow) > 0
        ) {
          const quote: MarketQuote = {
            ticker: sym as any,
            name: json.name || `${sym} Asset`,
            price: Number(json.price),
            change: Number(json.change ?? 0),
            changePercent: Number(json.changePercent ?? 0),
            dayHigh: Number(json.dayHigh),
            dayLow: Number(json.dayLow),
            openPrice: Number(json.openPrice ?? json.previousClose),
            previousClose: Number(json.previousClose),
            preMarketPrice: Number(json.preMarketPrice ?? 0),
            preMarketChangePercent: Number(json.preMarketChangePercent ?? 0),
            volume: Number(json.volume ?? 0),
            avgVolume: Number(json.avgVolume ?? 0),
            relativeVolume: Number(json.relativeVolume ?? 0),
            fiftyTwoWeekHigh: Number(json.fiftyTwoWeekHigh ?? 0),
            fiftyTwoWeekLow: Number(json.fiftyTwoWeekLow ?? 0),
            timestamp: json.lastSyncTime || new Date().toISOString(),
            marketStatus: json.marketState === 'CLOSED' ? 'CLOSED' : 'REGULAR',
            dataStatus: json.isDelayed || json.status === 'END_OF_DAY' ? 'DELAYED' : 'REAL_TIME',
            dataSource: json.source || this.name,
            latencyMs: Number(json.latencyMs ?? 0),
          };
          this.latestQuotesCache.set(sym, quote);
          return quote;
        }
      }
    } catch (error) {
      console.warn(`[MarketDataProvider] Verified quote unavailable for ${sym}:`, error);
    }

    throw new Error(`Verified market quote for ${sym} is unavailable.`);
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
          return json.candles.map((c: any) => ({
            timestamp: typeof c.time === 'number' && c.time < 10000000000 ? c.time * 1000 : Number(c.time),
            timeString: c.timeString || new Date(c.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
            vwap: c.vwap,
          }));
        }
      }
    } catch (error) {
      console.warn(`[MarketDataProvider] Verified candles unavailable for ${sym}:`, error);
    }

    return [];
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
    const sym = symbol.toUpperCase().trim();
    throw new Error(`Verified options-chain data for ${sym} is unavailable.`);
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
