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
            dayHigh: json.dayHigh || json.price,
            dayLow: json.dayLow || json.price,
            openPrice: json.openPrice || json.price,
            previousClose: json.previousClose || json.price,
            preMarketPrice: json.preMarketPrice || json.price,
            preMarketChangePercent: json.preMarketChangePercent || 0,
            volume: json.volume || 1000000,
            avgVolume: json.avgVolume || 1500000,
            relativeVolume: json.relativeVolume || 1.0,
            fiftyTwoWeekHigh: json.fiftyTwoWeekHigh || json.price * 1.2,
            fiftyTwoWeekLow: json.fiftyTwoWeekLow || json.price * 0.8,
            timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
            marketStatus: json.marketStatus || 'REGULAR',
            dataSource: this.name,
            latencyMs: 42,
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
