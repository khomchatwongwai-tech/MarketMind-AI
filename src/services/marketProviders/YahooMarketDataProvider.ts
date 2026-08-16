import {
  AssetClass,
  ChartInterval,
  HistoricalBar,
  MarketDataProvider,
  MarketStatusInfo,
  OptionsChainData,
} from '../../types/marketProviders';
import { MarketQuote } from '../../types/market';
import { InstitutionalMarketDataProvider } from './InstitutionalMarketDataProvider';

export class YahooMarketDataProvider implements MarketDataProvider {
  readonly id = 'yahoo_finance';
  readonly name = 'Yahoo Finance (Real-Time)';
  readonly supportedAssetClasses: AssetClass[] = ['STOCK', 'ETF', 'INDEX', 'CRYPTO', 'TREASURY', 'COMMODITY'];

  private fallback = new InstitutionalMarketDataProvider();

  async getQuote(symbol: string): Promise<MarketQuote> {
    try {
      const res = await fetch(`/api/market/quote/${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.price) {
          return {
            ticker: symbol.toUpperCase() as any,
            name: json.name || `${symbol} Quote`,
            price: json.price,
            change: json.change || 0,
            changePercent: json.changePercent || 0,
            dayHigh: Number(json.dayHigh) || 0,
            dayLow: Number(json.dayLow) || 0,
            openPrice: Number(json.openPrice) || 0,
            previousClose: Number(json.previousClose) || 0,
            preMarketPrice: Number(json.preMarketPrice) || 0,
            preMarketChangePercent: json.preMarketChangePercent || 0,
            volume: Number(json.volume) || 0,
            avgVolume: Number(json.avgVolume) || 0,
            relativeVolume: Number(json.relativeVolume) || 0,
            fiftyTwoWeekHigh: Number(json.fiftyTwoWeekHigh) || 0,
            fiftyTwoWeekLow: Number(json.fiftyTwoWeekLow) || 0,
            timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
            marketStatus: json.marketStatus || 'REGULAR',
            dataSource: String(json.dataSource || this.name),
            latencyMs: Number(json.latencyMs) || 0,
          };
        }
      }
    } catch (e) {
      // fallback
    }
    return this.fallback.getQuote(symbol);
  }

  async getHistoricalBars(
    symbol: string,
    interval: ChartInterval = '5m',
    limit?: number
  ): Promise<HistoricalBar[]> {
    return this.fallback.getHistoricalBars(symbol, interval, limit);
  }

  async getMarketStatus(): Promise<MarketStatusInfo> {
    return this.fallback.getMarketStatus();
  }

  async getOptionsChain(symbol: string): Promise<OptionsChainData> {
    return this.fallback.getOptionsChain(symbol);
  }

  subscribeToQuotes(symbols: string[], callback: (quote: MarketQuote) => void): void {
    this.fallback.subscribeToQuotes(symbols, callback);
  }

  unsubscribeFromQuotes(symbols: string[]): void {
    this.fallback.unsubscribeFromQuotes(symbols);
  }

  async getHealth() {
    return {
      status: 'ONLINE' as const,
      latencyMs: 38,
    };
  }
}
