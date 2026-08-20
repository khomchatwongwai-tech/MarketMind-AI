import { RealTimeMarketManager } from './RealTimeMarketManager.js';
import { NormalizedQuote, NormalizedTrade, ProviderConnectionStatus, RealTimeDiagnosticsInfo } from '../../types/realtime.js';

export type StoreListener = () => void;

export class RealTimeMarketStore {
  private static instance: RealTimeMarketStore;
  private manager: RealTimeMarketManager;

  private quotes: Map<string, NormalizedQuote> = new Map();
  private trades: Map<string, NormalizedTrade> = new Map();
  private flashStates: Map<string, 'UP' | 'DOWN' | null> = new Map();
  private flashTimers: Map<string, any> = new Map();

  private symbolListeners: Map<string, Set<StoreListener>> = new Map();
  private globalListeners: Set<StoreListener> = new Set();
  private diagnosticsListeners: Set<(diag: RealTimeDiagnosticsInfo) => void> = new Set();

  private currentDiagnostics: RealTimeDiagnosticsInfo;
  private currentStatus: ProviderConnectionStatus = 'DISCONNECTED';

  private constructor() {
    this.manager = RealTimeMarketManager.getInstance();
    this.currentDiagnostics = this.manager.getDiagnostics();
    this.currentStatus = this.manager.getGlobalStatus();

    this.setupSubscriptions();
    if (typeof window !== 'undefined') {
      this.manager.start();
    }
  }

  public static getInstance(): RealTimeMarketStore {
    if (!RealTimeMarketStore.instance) {
      RealTimeMarketStore.instance = new RealTimeMarketStore();
    }
    return RealTimeMarketStore.instance;
  }

  private setupSubscriptions() {
    this.manager.onQuote((quote) => {
      const prev = this.quotes.get(quote.symbol);
      this.quotes.set(quote.symbol, quote);

      // Determine price flash
      if (prev && prev.price !== quote.price) {
        const direction = quote.price > prev.price ? 'UP' : 'DOWN';
        this.flashStates.set(quote.symbol, direction);

        if (this.flashTimers.has(quote.symbol)) {
          clearTimeout(this.flashTimers.get(quote.symbol));
        }

        const timer = setTimeout(() => {
          this.flashStates.set(quote.symbol, null);
          this.notifySymbol(quote.symbol);
        }, 800);
        this.flashTimers.set(quote.symbol, timer);
      }

      this.notifySymbol(quote.symbol);
      this.notifyGlobal();
    });

    this.manager.onTrade((trade) => {
      this.trades.set(trade.symbol, trade);
      this.notifySymbol(trade.symbol);
    });

    this.manager.onStatus((status, diag) => {
      this.currentStatus = status;
      this.currentDiagnostics = diag;
      this.diagnosticsListeners.forEach((listener) => {
        try {
          listener(diag);
        } catch (err) {
          console.error('[RealTimeMarketStore] Diagnostics listener error:', err);
        }
      });
      this.notifyGlobal();
    });
  }

  private notifySymbol(symbol: string) {
    const listeners = this.symbolListeners.get(symbol);
    if (listeners) {
      listeners.forEach((l) => {
        try {
          l();
        } catch (err) {
          console.error(`[RealTimeMarketStore] Error notifying listener for ${symbol}:`, err);
        }
      });
    }
  }

  private notifyGlobal() {
    this.globalListeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('[RealTimeMarketStore] Global listener error:', err);
      }
    });
  }

  public subscribeSymbol(symbol: string, consumerId: string, listener?: StoreListener): () => void {
    const clean = (symbol || '').toUpperCase().trim();
    if (!clean) return () => {};

    this.manager.subscribe(clean, consumerId);

    if (listener) {
      if (!this.symbolListeners.has(clean)) {
        this.symbolListeners.set(clean, new Set());
      }
      this.symbolListeners.get(clean)!.add(listener);
    }

    return () => {
      if (listener && this.symbolListeners.has(clean)) {
        this.symbolListeners.get(clean)!.delete(listener);
      }
      this.manager.unsubscribe(clean, consumerId);
    };
  }

  public subscribeGlobal(listener: StoreListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  public subscribeDiagnostics(listener: (diag: RealTimeDiagnosticsInfo) => void): () => void {
    this.diagnosticsListeners.add(listener);
    listener(this.currentDiagnostics);
    return () => this.diagnosticsListeners.delete(listener);
  }

  public getQuote(symbol: string): NormalizedQuote | null {
    const clean = (symbol || '').toUpperCase().trim();
    return this.quotes.get(clean) || this.manager.getLatestQuote(clean);
  }

  public getTrade(symbol: string): NormalizedTrade | null {
    return this.trades.get((symbol || '').toUpperCase().trim()) || null;
  }

  public getPriceFlash(symbol: string): 'UP' | 'DOWN' | null {
    return this.flashStates.get((symbol || '').toUpperCase().trim()) || null;
  }

  public getStatus(): ProviderConnectionStatus {
    return this.currentStatus;
  }

  public getDiagnostics(): RealTimeDiagnosticsInfo {
    return this.currentDiagnostics;
  }

  public getManager(): RealTimeMarketManager {
    return this.manager;
  }
}
