import {
  RealTimeProvider,
  ProviderCapabilities,
  ProviderConnectionStatus,
  ProviderDiagnosticMetrics,
  NormalizedQuote,
  NormalizedTrade,
} from '../../../types/realtime';

export abstract class BaseRealTimeAdapter implements RealTimeProvider {
  public abstract id: string;
  public abstract name: string;
  public abstract capabilities: ProviderCapabilities;

  protected status: ProviderConnectionStatus = 'DISCONNECTED';
  protected metrics: ProviderDiagnosticMetrics;
  protected tradeListeners = new Set<(trade: NormalizedTrade) => void>();
  protected quoteListeners = new Set<(quote: NormalizedQuote) => void>();
  protected statusListeners = new Set<(status: ProviderConnectionStatus, metrics?: Partial<ProviderDiagnosticMetrics>) => void>();

  protected reconnectAttempts = 0;
  protected maxReconnectAttempts = 8;
  protected baseReconnectDelayMs = 1000;
  protected maxReconnectDelayMs = 30000;
  protected reconnectTimer: any = null;
  protected heartbeatTimer: any = null;
  protected lastHeartbeatTimestamp = 0;

  constructor(id: string, name: string, capabilities: ProviderCapabilities) {
    this.metrics = {
      providerId: id,
      name,
      isConfigured: true,
      connectionStatus: 'DISCONNECTED',
      authStatus: 'UNAUTHENTICATED',
      webSocketStatus: 'DISCONNECTED',
      restStatus: 'HEALTHY',
      realtimeEntitlement: capabilities.realtimeStocks ? 'CONFIRMED' : 'UNKNOWN',
      extendedHoursEntitlement: Boolean(capabilities.extendedHours),
      latencyMs: 15,
      errorCount: 0,
      rateLimitStatus: 'HEALTHY',
      subscribedSymbolsCount: 0,
    };
  }

  public getStatus(): ProviderConnectionStatus {
    return this.status;
  }

  public getMetrics(): ProviderDiagnosticMetrics {
    return { ...this.metrics, connectionStatus: this.status };
  }

  public onTrade(callback: (trade: NormalizedTrade) => void): () => void {
    this.tradeListeners.add(callback);
    return () => this.tradeListeners.delete(callback);
  }

  public onQuote(callback: (quote: NormalizedQuote) => void): () => void {
    this.quoteListeners.add(callback);
    return () => this.quoteListeners.delete(callback);
  }

  public onStatus(callback: (status: ProviderConnectionStatus, metrics?: Partial<ProviderDiagnosticMetrics>) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status, this.getMetrics());
    return () => this.statusListeners.delete(callback);
  }

  protected emitTrade(trade: NormalizedTrade) {
    this.metrics.lastSuccessfulTick = Date.now();
    this.metrics.lastTickTimestamp = trade.timestamp;
    this.tradeListeners.forEach((listener) => {
      try {
        listener(trade);
      } catch (err) {
        console.error(`[${this.name}] Error in trade listener:`, err);
      }
    });
  }

  protected emitQuote(quote: NormalizedQuote) {
    this.metrics.lastSuccessfulTick = Date.now();
    this.metrics.lastTickTimestamp = quote.timestamp;
    this.quoteListeners.forEach((listener) => {
      try {
        listener(quote);
      } catch (err) {
        console.error(`[${this.name}] Error in quote listener:`, err);
      }
    });
  }

  protected setStatus(newStatus: ProviderConnectionStatus, partialMetrics?: Partial<ProviderDiagnosticMetrics>) {
    this.status = newStatus;
    this.metrics.connectionStatus = newStatus;
    if (partialMetrics) {
      Object.assign(this.metrics, partialMetrics);
    }
    if (newStatus === 'CONNECTED') {
      this.metrics.lastSuccessfulConnection = Date.now();
      this.reconnectAttempts = 0;
    }
    const fullMetrics = this.getMetrics();
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus, fullMetrics);
      } catch (err) {
        console.error(`[${this.name}] Error in status listener:`, err);
      }
    });
  }

  protected scheduleReconnect(resubscribeSymbols: string[] = []) {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('DOWN', { lastError: 'Max reconnection attempts exceeded.' });
      return;
    }

    this.reconnectAttempts++;
    this.setStatus('RECONNECTING');

    // Exponential backoff with timing jitter only (NOT price jitter)
    const baseDelay = Math.min(this.maxReconnectDelayMs, this.baseReconnectDelayMs * Math.pow(1.5, this.reconnectAttempts));
    const jitterMs = Math.floor(Math.random() * 500);
    const delay = baseDelay + jitterMs;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
        if (resubscribeSymbols.length > 0) {
          await this.subscribe(resubscribeSymbols);
        }
      } catch (err: any) {
        this.metrics.errorCount++;
        this.metrics.lastError = err?.message || String(err);
        this.scheduleReconnect(resubscribeSymbols);
      }
    }, delay);
  }

  public abstract connect(): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract subscribe(symbols: string[]): Promise<void>;
  public abstract unsubscribe(symbols: string[]): Promise<void>;
  public abstract testConnection(symbol?: string): Promise<{
    success: boolean;
    resultCode: 'PASS' | 'FAIL' | 'MARKET_CLOSED' | 'NO_ENTITLEMENT' | 'AUTH_ERROR' | 'NO_DATA_RECEIVED';
    message: string;
    latencyMs: number;
    sampleData?: any;
  }>;
}
