import {
  AssetClass,
  ChartInterval,
  HistoricalBar,
  MarketDataProvider,
  MarketStatusInfo,
  OptionsChainData,
} from '../../types/marketProviders.js';
import { MarketQuote } from '../../types/market.js';
import { InstitutionalMarketDataProvider } from './InstitutionalMarketDataProvider.js';

export class YahooMarketDataProvider implements MarketDataProvider {
  readonly id = 'yahoo_finance';
  readonly name = 'Yahoo Finance';
  readonly supportedAssetClasses: AssetClass[] = ['STOCK', 'ETF', 'INDEX', 'CRYPTO', 'TREASURY', 'COMMODITY'];

  private fallback = new InstitutionalMarketDataProvider();

  async getQuote(symbol: string): Promise<MarketQuote> {
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
    const started = Date.now();
    try {
      const quote = await this.getQuote('SPY');
      return {
        status: quote.metadata?.source === 'yahoo' ? ('ONLINE' as const) : ('DEGRADED' as const),
        latencyMs: Date.now() - started,
      };
    } catch {
      return { status: 'OFFLINE' as const, latencyMs: Date.now() - started };
    }
  }
}
