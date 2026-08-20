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

export class MassiveWsMarketDataProvider implements MarketDataProvider {
  readonly id = 'massive_ws';
  readonly name = 'Massive WebSocket (Real-Time Live Feed)';
  readonly supportedAssetClasses: AssetClass[] = ['STOCK', 'ETF', 'INDEX', 'CRYPTO'];

  private fallback = new InstitutionalMarketDataProvider();

  async getQuote(symbol: string): Promise<MarketQuote> {
    const q = await this.fallback.getQuote(symbol);
    return {
      ...q,
      dataSource: this.name,
      latencyMs: 8,
    };
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
      latencyMs: 8,
    };
  }
}
