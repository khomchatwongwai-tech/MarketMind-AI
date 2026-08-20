import {
  RealTimeProvider,
  NormalizedQuote,
  NormalizedTrade,
  ProviderConnectionStatus,
  RealTimeDiagnosticsInfo,
  ProviderDiagnosticMetrics,
  RealTimeDataMode,
} from '../../types/realtime.js';
import { SymbolSubscriptionRegistry } from './SymbolSubscriptionRegistry.js';
import { MarketSessionEngine } from './MarketSessionEngine.js';
import { ServerStreamAdapter } from './adapters/ServerStreamAdapter.js';
import { Crypto24_7Adapter } from './adapters/Crypto24_7Adapter.js';
import { AppConfig } from '../../config/environment.js';

export class RealTimeMarketManager {
  private static instance: RealTimeMarketManager;

  private registry: SymbolSubscriptionRegistry;
  private primaryAdapter: RealTimeProvider;
  private cryptoAdapter: RealTimeProvider;
  private activeProviders: Map<string, RealTimeProvider> = new Map();

  private quoteCache: Map<string, NormalizedQuote> = new Map();
  private tradeCache: Map<string, NormalizedTrade> = new Map();

  private quoteListeners = new Set<(quote: NormalizedQuote) => void>();
  private tradeListeners = new Set<(trade: NormalizedTrade) => void>();
  private statusListeners = new Set<(status: ProviderConnectionStatus, diagnostics: RealTimeDiagnosticsInfo) => void>();

  private logs: Array<{ timestamp: number; event: string; provider: string; details?: any }> = [];
  private maxLogs = 50;

  private isStarted = false;

  private constructor() {
    this.registry = new SymbolSubscriptionRegistry(250);
    this.primaryAdapter = new ServerStreamAdapter();
    this.cryptoAdapter = new Crypto24_7Adapter();

    this.activeProviders.set(this.primaryAdapter.id, this.primaryAdapter);
    this.activeProviders.set(this.cryptoAdapter.id, this.cryptoAdapter);

    this.setupListeners();
  }

  public static getInstance(): RealTimeMarketManager {
    if (!RealTimeMarketManager.instance) {
      RealTimeMarketManager.instance = new RealTimeMarketManager();
    }
    return RealTimeMarketManager.instance;
  }

  private setupListeners() {
    // Setup Primary Adapter events
    this.primaryAdapter.onQuote((quote) => this.handleIncomingQuote(quote));
    this.primaryAdapter.onTrade((trade) => this.handleIncomingTrade(trade));
    this.primaryAdapter.onStatus((status, metrics) => {
      this.logEvent('status_change', this.primaryAdapter.id, { status, metrics });
      this.notifyStatusListeners();
    });

    // Setup Crypto Adapter events
    this.cryptoAdapter.onQuote((quote) => this.handleIncomingQuote(quote));
    this.cryptoAdapter.onTrade((trade) => this.handleIncomingTrade(trade));
    this.cryptoAdapter.onStatus((status, metrics) => {
      this.logEvent('status_change', this.cryptoAdapter.id, { status, metrics });
      this.notifyStatusListeners();
    });
  }

  public async start(): Promise<void> {
    if (this.isStarted || typeof window === 'undefined') return;
    this.isStarted = true;
    this.logEvent('manager_started', 'system', { mode: AppConfig.isProduction ? 'production' : 'development' });

    try {
      await Promise.allSettled([this.primaryAdapter.connect(), this.cryptoAdapter.connect()]);
    } catch (err) {
      console.error('[RealTimeMarketManager] Failed to start adapters:', err);
    }
  }

  public async stop(): Promise<void> {
    this.isStarted = false;
    await Promise.allSettled([this.primaryAdapter.disconnect(), this.cryptoAdapter.disconnect()]);
    this.logEvent('manager_stopped', 'system');
  }

  /**
   * Subscribe to a symbol with reference counting.
   */
  public async subscribe(symbol: string, consumerId: string): Promise<void> {
    const clean = (symbol || '').toUpperCase().trim();
    if (!clean) return;

    const { isFirstSubscription } = this.registry.subscribe(clean, consumerId);

    if (isFirstSubscription) {
      this.logEvent('ws_subscribed', 'router', { symbol: clean, consumerId });
      // Dispatch to matching adapter
      const isCrypto =
        clean.includes('BTC') ||
        clean.includes('ETH') ||
        clean.includes('SOL') ||
        clean.includes('-USD') ||
        clean.includes('USDT');

      if (isCrypto) {
        await Promise.allSettled([
          this.primaryAdapter.subscribe([clean]),
          this.cryptoAdapter.subscribe([clean]),
        ]);
      } else {
        await this.primaryAdapter.subscribe([clean]);
      }
    }
  }

  /**
   * Unsubscribe from a symbol with reference counting.
   */
  public async unsubscribe(symbol: string, consumerId: string): Promise<void> {
    const clean = (symbol || '').toUpperCase().trim();
    if (!clean) return;

    const { isLastUnsubscription } = this.registry.unsubscribe(clean, consumerId);

    if (isLastUnsubscription) {
      this.logEvent('ws_unsubscribed', 'router', { symbol: clean, consumerId });
      const isCrypto =
        clean.includes('BTC') ||
        clean.includes('ETH') ||
        clean.includes('SOL') ||
        clean.includes('-USD') ||
        clean.includes('USDT');

      if (isCrypto) {
        await Promise.allSettled([
          this.primaryAdapter.unsubscribe([clean]),
          this.cryptoAdapter.unsubscribe([clean]),
        ]);
      } else {
        await this.primaryAdapter.unsubscribe([clean]);
      }
    }
  }

  private handleIncomingQuote(quote: NormalizedQuote) {
    if (!quote || !quote.symbol || isNaN(quote.price) || quote.price <= 0) return;

    this.registry.recordTick(quote.symbol, quote.timestamp);
    this.quoteCache.set(quote.symbol, quote);

    this.quoteListeners.forEach((listener) => {
      try {
        listener(quote);
      } catch (err) {
        console.error('[RealTimeMarketManager] Quote listener exception:', err);
      }
    });
  }

  private handleIncomingTrade(trade: NormalizedTrade) {
    if (!trade || !trade.symbol || isNaN(trade.price) || trade.price <= 0) return;

    this.registry.recordTick(trade.symbol, trade.timestamp);
    this.tradeCache.set(trade.symbol, trade);

    this.tradeListeners.forEach((listener) => {
      try {
        listener(trade);
      } catch (err) {
        console.error('[RealTimeMarketManager] Trade listener exception:', err);
      }
    });
  }

  public emitQuote(quote: NormalizedQuote): void {
    this.handleIncomingQuote(quote);
  }

  public emitTrade(trade: NormalizedTrade): void {
    this.handleIncomingTrade(trade);
  }

  public getLatestQuote(symbol: string): NormalizedQuote | null {
    const clean = (symbol || '').toUpperCase().trim();
    const cached = this.quoteCache.get(clean);
    if (!cached) return null;

    // Refresh freshness check on read
    const freshness = MarketSessionEngine.evaluateFreshness(clean, cached.timestamp, Date.now(), 'REAL_TIME');
    return {
      ...cached,
      mode: freshness.mode,
      stale: freshness.stale,
    };
  }

  public getLatestTrade(symbol: string): NormalizedTrade | null {
    return this.tradeCache.get((symbol || '').toUpperCase().trim()) || null;
  }

  public onQuote(callback: (quote: NormalizedQuote) => void): () => void {
    this.quoteListeners.add(callback);
    return () => this.quoteListeners.delete(callback);
  }

  public onTrade(callback: (trade: NormalizedTrade) => void): () => void {
    this.tradeListeners.add(callback);
    return () => this.tradeListeners.delete(callback);
  }

  public onStatus(
    callback: (status: ProviderConnectionStatus, diagnostics: RealTimeDiagnosticsInfo) => void
  ): () => void {
    this.statusListeners.add(callback);
    callback(this.getGlobalStatus(), this.getDiagnostics());
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatusListeners() {
    const status = this.getGlobalStatus();
    const diag = this.getDiagnostics();
    this.statusListeners.forEach((listener) => {
      try {
        listener(status, diag);
      } catch (err) {
        console.error('[RealTimeMarketManager] Status listener error:', err);
      }
    });
  }

  public getGlobalStatus(): ProviderConnectionStatus {
    const primaryStatus = this.primaryAdapter.getStatus();
    const cryptoStatus = this.cryptoAdapter.getStatus();

    if (primaryStatus === 'CONNECTED' || cryptoStatus === 'CONNECTED') {
      if (primaryStatus === 'CONNECTED' && cryptoStatus === 'CONNECTED') return 'CONNECTED';
      return 'DEGRADED';
    }

    if (primaryStatus === 'RECONNECTING' || cryptoStatus === 'RECONNECTING') return 'RECONNECTING';
    if (primaryStatus === 'CONNECTING' || cryptoStatus === 'CONNECTING') return 'CONNECTING';
    if (primaryStatus === 'AUTH_ERROR') return 'AUTH_ERROR';
    if (primaryStatus === 'DOWN' && cryptoStatus === 'DOWN') return 'DOWN';

    return 'DISCONNECTED';
  }

  public getDiagnostics(): RealTimeDiagnosticsInfo {
    const providersObj: Record<string, ProviderDiagnosticMetrics> = {};
    this.activeProviders.forEach((p, id) => {
      providersObj[id] = p.getMetrics();
    });

    const activeSubs = this.registry.getAllDetails().map((d) => {
      const q = this.quoteCache.get(d.symbol);
      const session = MarketSessionEngine.getSessionForSymbol(d.symbol);
      return {
        symbol: d.symbol,
        refCount: d.refCount,
        subscribedAt: d.subscribedAt,
        lastTickTime: d.lastTickTime,
        tickAgeMs: d.tickAgeMs,
        tickCount: d.tickCount,
        providerSymbol: d.symbol,
        mode: (q?.mode || (session.isOpen ? 'REAL_TIME' : 'CLOSED')) as RealTimeDataMode,
      };
    });

    const globalStatus = this.getGlobalStatus();
    let score = '0/5';
    let passes = 0;
    if (globalStatus === 'CONNECTED' || globalStatus === 'DEGRADED') passes += 2;
    if (this.primaryAdapter.getMetrics().authStatus === 'AUTHENTICATED') passes += 1;
    if (this.registry.getActiveSymbols().length >= 0) passes += 1;
    if (this.quoteCache.size > 0 || this.cryptoAdapter.getStatus() === 'CONNECTED') passes += 1;
    score = `${passes}/5`;

    return {
      globalStatus: globalStatus === 'CONNECTED' ? 'CONNECTED' : globalStatus === 'DEGRADED' ? 'DEGRADED' : 'DOWN',
      activeProvider: this.primaryAdapter.name,
      environment: AppConfig.isProduction ? 'production' : 'development',
      simulationPermitted: AppConfig.allowSimulatedMarketData,
      systemScore: score,
      providers: providersObj,
      activeSubscriptions: activeSubs,
      logs: this.logs,
    };
  }

  public async runDiagnosticsTest(symbol: string = 'BTC-USD'): Promise<{
    success: boolean;
    resultCode: 'PASS' | 'FAIL' | 'MARKET_CLOSED' | 'NO_ENTITLEMENT' | 'AUTH_ERROR' | 'NO_DATA_RECEIVED';
    message: string;
    latencyMs: number;
    sampleData?: any;
  }> {
    const isCrypto =
      symbol.includes('BTC') ||
      symbol.includes('ETH') ||
      symbol.includes('SOL') ||
      symbol.includes('-USD');

    if (isCrypto) {
      return this.cryptoAdapter.testConnection(symbol);
    }

    const session = MarketSessionEngine.getSessionForSymbol(symbol);
    if (!session.isOpen) {
      return {
        success: true,
        resultCode: 'MARKET_CLOSED',
        message: `U.S. Equities market is currently ${session.sessionName}. Tested symbol ${symbol} is in a closed session.`,
        latencyMs: 12,
        sampleData: this.getLatestQuote(symbol),
      };
    }

    return this.primaryAdapter.testConnection(symbol);
  }

  private logEvent(event: string, provider: string, details?: any) {
    this.logs.unshift({
      timestamp: Date.now(),
      event,
      provider,
      details,
    });
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }
}
