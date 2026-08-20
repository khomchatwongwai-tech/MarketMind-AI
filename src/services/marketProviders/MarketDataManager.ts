import {
  ChartInterval,
  HistoricalBar,
  MarketDataProvider,
  MarketStatusInfo,
  OptionsChainData,
} from '../../types/marketProviders.js';
import { MarketQuote } from '../../types/market.js';
import { InstitutionalMarketDataProvider } from './InstitutionalMarketDataProvider.js';
import { YahooMarketDataProvider } from './YahooMarketDataProvider.js';
import { MassiveWsMarketDataProvider } from './MassiveWsMarketDataProvider.js';

export class MarketDataManager {
  private static instance: MarketDataManager;
  private providers = new Map<string, MarketDataProvider>();
  private activeProviderId: string = 'institutional_multi_provider';

  private constructor() {
    const inst = new InstitutionalMarketDataProvider();
    const yahoo = new YahooMarketDataProvider();
    const massive = new MassiveWsMarketDataProvider();

    this.registerProvider(inst);
    this.registerProvider(yahoo);
    this.registerProvider(massive);
  }

  public static getInstance(): MarketDataManager {
    if (!MarketDataManager.instance) {
      MarketDataManager.instance = new MarketDataManager();
    }
    return MarketDataManager.instance;
  }

  public registerProvider(provider: MarketDataProvider) {
    this.providers.set(provider.id, provider);
  }

  public getAvailableProviders(): { id: string; name: string }[] {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }

  public setActiveProvider(providerId: string) {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
    }
  }

  public getActiveProvider(): MarketDataProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('institutional_multi_provider')!;
  }

  // Facade convenience methods
  public async getQuote(symbol: string): Promise<MarketQuote> {
    return this.getActiveProvider().getQuote(symbol);
  }

  public async getHistoricalBars(
    symbol: string,
    interval: ChartInterval = '5m',
    limit?: number
  ): Promise<HistoricalBar[]> {
    return this.getActiveProvider().getHistoricalBars(symbol, interval, limit);
  }

  public async getMarketStatus(): Promise<MarketStatusInfo> {
    return this.getActiveProvider().getMarketStatus();
  }

  public async getOptionsChain(symbol: string): Promise<OptionsChainData> {
    return this.getActiveProvider().getOptionsChain(symbol);
  }

  public subscribeToQuotes(symbols: string[], callback: (quote: MarketQuote) => void) {
    this.getActiveProvider().subscribeToQuotes(symbols, callback);
  }

  public unsubscribeFromQuotes(symbols: string[]) {
    this.getActiveProvider().unsubscribeFromQuotes(symbols);
  }
}

export const marketDataManager = MarketDataManager.getInstance();
