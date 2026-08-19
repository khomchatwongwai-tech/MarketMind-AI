import { WebSocketConnectionState, WebSocketMetrics } from '../types/marketProviders';
import { MarketQuote } from '../types/market';
import { CapacitorPlatform } from './mobile/capacitorPlatform';

export type QuoteUpdateCallback = (quote: MarketQuote) => void;
export type StateChangeCallback = (state: WebSocketConnectionState, metrics: WebSocketMetrics) => void;

export class MarketWebSocketManagerClient {
  private static instance: MarketWebSocketManagerClient;
  private ws: WebSocket | null = null;
  private state: WebSocketConnectionState = 'OFFLINE';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelayMs = 1000;
  private maxReconnectDelayMs = 16000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastMessageTimestamp = 0;
  private messageCount = 0;
  private lastLatencyMs = 12;
  private activeSubscriptions = new Set<string>();
  private quoteCallbacks = new Map<string, Set<QuoteUpdateCallback>>();
  private stateListeners = new Set<StateChangeCallback>();
  private quoteCache = new Map<string, MarketQuote>();

  private constructor() {}

  public static getInstance(): MarketWebSocketManagerClient {
    if (!MarketWebSocketManagerClient.instance) {
      MarketWebSocketManagerClient.instance = new MarketWebSocketManagerClient();
    }
    return MarketWebSocketManagerClient.instance;
  }

  public getState(): WebSocketConnectionState {
    return this.state;
  }

  public getMetrics(): WebSocketMetrics {
    return {
      state: this.state,
      latencyMs: this.lastLatencyMs,
      reconnectAttempts: this.reconnectAttempts,
      subscribedSymbols: Array.from(this.activeSubscriptions),
      lastMessageTimestamp: this.lastMessageTimestamp,
      messagesPerSecond: this.messageCount,
    };
  }

  public subscribeStateChange(listener: StateChangeCallback): () => void {
    this.stateListeners.add(listener);
    listener(this.state, this.getMetrics());
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setState(newState: WebSocketConnectionState) {
    this.state = newState;
    const metrics = this.getMetrics();
    this.stateListeners.forEach((fn) => {
      try {
        fn(newState, metrics);
      } catch (err) {
        console.error('[MarketWebSocketManager] Listener error:', err);
      }
    });
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setState(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'OFFLINE');

    const wsUrl = CapacitorPlatform.getWebSocketUrl('/ws/massive');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('LIVE');
        this.startHeartbeat();
        // Resubscribe to all active symbols
        if (this.activeSubscriptions.size > 0) {
          this.sendSubscriptionPayload(Array.from(this.activeSubscriptions));
        }
      };

      this.ws.onmessage = (event) => {
        this.lastMessageTimestamp = Date.now();
        this.messageCount++;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') {
            this.lastLatencyMs = Math.max(4, Date.now() - data.clientTime);
          } else if (data.type === 'QUOTE' || data.type === 'TRADE' || data.type === 'TICK') {
            const ticker = (data.ticker || data.symbol || 'SPY').toUpperCase();
            const quote: MarketQuote = {
              ticker: ticker as any,
              name: data.name || `${ticker} Stock`,
              price: data.price || data.close || 500,
              change: data.change || 0,
              changePercent: data.changePercent || 0,
              dayHigh: data.high || data.price,
              dayLow: data.low || data.price,
              openPrice: data.open || data.price,
              previousClose: data.previousClose || data.price,
              preMarketPrice: data.preMarketPrice || data.price,
              preMarketChangePercent: data.preMarketChangePercent || 0,
              volume: data.volume || data.cumulativeVolume || 1000000,
              avgVolume: data.avgVolume || 1500000,
              relativeVolume: data.relativeVolume || 1.1,
              fiftyTwoWeekHigh: data.fiftyTwoWeekHigh || data.price * 1.25,
              fiftyTwoWeekLow: data.fiftyTwoWeekLow || data.price * 0.75,
              timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
              marketStatus: data.marketStatus || (data.isDelayed ? 'REGULAR' : 'REGULAR'),
              dataSource: 'Massive Real-Time WebSocket',
              latencyMs: this.lastLatencyMs,
            };

            this.quoteCache.set(ticker, quote);
            const listeners = this.quoteCallbacks.get(ticker);
            if (listeners) {
              listeners.forEach((cb) => cb(quote));
            }
          }
        } catch {
          // non-json message
        }
      };

      this.ws.onerror = () => {
        this.setState('DELAYED');
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setState('OFFLINE');
        this.scheduleReconnect();
      };
    } catch {
      this.setState('OFFLINE');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('OFFLINE');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.maxReconnectDelayMs,
      this.baseReconnectDelayMs * Math.pow(2, this.reconnectAttempts - 1)
    );

    this.setState('RECONNECTING');
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING', clientTime: Date.now() }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendSubscriptionPayload(symbols: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          action: 'subscribe',
          symbols: symbols.map((s) => s.toUpperCase()),
          extended: true,
        })
      );
    }
  }

  public subscribe(symbol: string, callback: QuoteUpdateCallback): () => void {
    const sym = symbol.toUpperCase().trim();
    if (!this.quoteCallbacks.has(sym)) {
      this.quoteCallbacks.set(sym, new Set());
    }
    this.quoteCallbacks.get(sym)!.add(callback);

    if (!this.activeSubscriptions.has(sym)) {
      this.activeSubscriptions.add(sym);
      this.sendSubscriptionPayload([sym]);
    }

    // Return cached quote immediately if present
    const cached = this.quoteCache.get(sym);
    if (cached) {
      callback(cached);
    }

    return () => this.unsubscribe(sym, callback);
  }

  public unsubscribe(symbol: string, callback: QuoteUpdateCallback) {
    const sym = symbol.toUpperCase().trim();
    const cbs = this.quoteCallbacks.get(sym);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) {
        this.quoteCallbacks.delete(sym);
        this.activeSubscriptions.delete(sym);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              action: 'unsubscribe',
              symbols: [sym],
            })
          );
        }
      }
    }
  }

  public getCachedQuote(symbol: string): MarketQuote | null {
    return this.quoteCache.get(symbol.toUpperCase().trim()) || null;
  }
}

export const marketWebSocketManager = MarketWebSocketManagerClient.getInstance();
