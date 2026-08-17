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

export class MassiveWsMarketDataProvider implements MarketDataProvider {
  readonly id = 'massive_ws';
  readonly name = 'Massive WebSocket (Real-Time Live Feed)';
  readonly supportedAssetClasses: AssetClass[] = ['STOCK', 'ETF', 'INDEX', 'CRYPTO'];

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
    const startedAt = Date.now();
    try {
      const response = await fetch('/api/market/massive/signals');
      return {
        status: response.ok ? ('ONLINE' as const) : ('OFFLINE' as const),
        latencyMs: Date.now() - startedAt,
      };
    } catch {
      return { status: 'OFFLINE' as const, latencyMs: Date.now() - startedAt };
    }
  }
}
