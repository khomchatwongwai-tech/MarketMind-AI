import { BaseRealTimeAdapter } from './BaseRealTimeAdapter.js';
import { NormalizedQuote, NormalizedTrade, ProviderConnectionStatus } from '../../../types/realtime.js';
import { MarketSessionEngine } from '../MarketSessionEngine.js';

export class ServerStreamAdapter extends BaseRealTimeAdapter {
  public id = 'marketmind_stream';
  public name = 'MarketMind Unified Server Stream';
  public capabilities = {
    stocks: true,
    options: true,
    crypto: true,
    forex: true,
    futures: true,
    realtimeStocks: true,
    realtimeOptions: true,
    extendedHours: true,
    entitlementTier: 'PRO' as const,
  };

  private ws: WebSocket | null = null;
  private subscribedSymbols = new Set<string>();
  private pingInterval: any = null;

  constructor() {
    super('marketmind_stream', 'MarketMind Unified Server Stream', {
      stocks: true,
      options: true,
      crypto: true,
      forex: true,
      futures: true,
      realtimeStocks: true,
      realtimeOptions: true,
      extendedHours: true,
      entitlementTier: 'PRO',
    });
  }

  public async connect(): Promise<void> {
    if (typeof window === 'undefined') return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/market-stream`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED', {
          webSocketStatus: 'CONNECTED',
          authStatus: 'AUTHENTICATED',
        });
        this.startHeartbeat();

        // Resubscribe active symbols
        if (this.subscribedSymbols.size > 0) {
          this.sendPayload({
            action: 'subscribe',
            symbols: Array.from(this.subscribedSymbols),
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
        } catch (err) {
          console.error('[ServerStreamAdapter] Failed to parse message:', err);
        }
      };

      this.ws.onerror = (event) => {
        this.metrics.errorCount++;
        this.metrics.lastError = 'WebSocket connection error';
        console.warn('[ServerStreamAdapter] WebSocket error:', event);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.setStatus('DISCONNECTED', { webSocketStatus: 'DISCONNECTED' });
        if (event.code !== 1000) {
          // Non-clean close -> reconnect
          this.scheduleReconnect(Array.from(this.subscribedSymbols));
        }
      };
    } catch (err: any) {
      this.setStatus('DOWN', { lastError: err?.message || 'Failed to initialize WebSocket' });
      this.scheduleReconnect(Array.from(this.subscribedSymbols));
    }
  }

  public async disconnect(): Promise<void> {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
    this.setStatus('DISCONNECTED', { webSocketStatus: 'DISCONNECTED' });
  }

  public async subscribe(symbols: string[]): Promise<void> {
    const toSub: string[] = [];
    for (const sym of symbols) {
      const clean = sym.toUpperCase().trim();
      if (clean && !this.subscribedSymbols.has(clean)) {
        this.subscribedSymbols.add(clean);
        toSub.push(clean);
      }
    }

    this.metrics.subscribedSymbolsCount = this.subscribedSymbols.size;

    if (toSub.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendPayload({
        action: 'subscribe',
        symbols: toSub,
      });
    }
  }

  public async unsubscribe(symbols: string[]): Promise<void> {
    const toUnsub: string[] = [];
    for (const sym of symbols) {
      const clean = sym.toUpperCase().trim();
      if (this.subscribedSymbols.has(clean)) {
        this.subscribedSymbols.delete(clean);
        toUnsub.push(clean);
      }
    }

    this.metrics.subscribedSymbolsCount = this.subscribedSymbols.size;

    if (toUnsub.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendPayload({
        action: 'unsubscribe',
        symbols: toUnsub,
      });
    }
  }

  private sendPayload(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendPayload({
          action: 'ping',
          timestamp: Date.now(),
        });
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleIncomingMessage(msg: any) {
    if (msg.type === 'PONG' || msg.action === 'pong') {
      const now = Date.now();
      const sentTime = msg.timestamp || now;
      this.metrics.latencyMs = Math.max(1, now - sentTime);
      return;
    }

    if (msg.type === 'STATUS') {
      if (msg.status === 'AUTH_ERROR') {
        this.setStatus('AUTH_ERROR', {
          authStatus: 'AUTH_ERROR',
          lastError: msg.message || 'Provider Authentication Failed',
        });
      } else if (msg.status === 'CONNECTED' || msg.status === 'LIVE') {
        this.setStatus('CONNECTED', {
          authStatus: 'AUTHENTICATED',
        });
      } else if (msg.status === 'DEGRADED') {
        this.setStatus('DEGRADED');
      }
      return;
    }

    if (msg.type === 'QUOTE' || msg.type === 'Q') {
      const quote = this.normalizeQuote(msg);
      if (quote) {
        this.emitQuote(quote);
      }
      return;
    }

    if (msg.type === 'TRADE' || msg.type === 'T') {
      const trade = this.normalizeTrade(msg);
      if (trade) {
        this.emitTrade(trade);
      }
      return;
    }
  }

  private normalizeQuote(msg: any): NormalizedQuote | null {
    const symbol = (msg.symbol || msg.ticker || msg.s || '').toUpperCase();
    if (!symbol) return null;

    const price = Number(msg.price ?? msg.last ?? msg.p ?? msg.close ?? 0);
    if (isNaN(price) || price <= 0) return null;

    const timestamp = Number(msg.timestamp || msg.t || Date.now());
    const session = MarketSessionEngine.getSessionForSymbol(symbol, new Date(timestamp));
    const freshness = MarketSessionEngine.evaluateFreshness(symbol, timestamp, Date.now(), 'REAL_TIME');

    return {
      symbol,
      price,
      bid: msg.bid != null ? Number(msg.bid) : undefined,
      ask: msg.ask != null ? Number(msg.ask) : undefined,
      bidSize: msg.bidSize != null ? Number(msg.bidSize) : undefined,
      askSize: msg.askSize != null ? Number(msg.askSize) : undefined,
      change: msg.change != null ? Number(msg.change) : undefined,
      changePercent: msg.changePercent != null ? Number(msg.changePercent) : undefined,
      high: msg.high != null ? Number(msg.high) : undefined,
      low: msg.low != null ? Number(msg.low) : undefined,
      open: msg.open != null ? Number(msg.open) : undefined,
      previousClose: msg.previousClose != null ? Number(msg.previousClose) : undefined,
      volume: msg.volume != null ? Number(msg.volume) : undefined,
      vwap: msg.vwap != null ? Number(msg.vwap) : undefined,
      timestamp,
      provider: msg.provider || 'MarketMind Provider Gateway',
      mode: freshness.mode,
      marketStatus: session.session,
      stale: freshness.stale,
      rawPayload: msg,
    };
  }

  private normalizeTrade(msg: any): NormalizedTrade | null {
    const symbol = (msg.symbol || msg.ticker || msg.s || '').toUpperCase();
    if (!symbol) return null;

    const price = Number(msg.price ?? msg.p ?? 0);
    if (isNaN(price) || price <= 0) return null;

    const timestamp = Number(msg.timestamp || msg.t || Date.now());

    return {
      symbol,
      price,
      size: msg.size != null ? Number(msg.size) : undefined,
      timestamp,
      provider: msg.provider || 'MarketMind Provider Gateway',
      mode: 'REAL_TIME',
      exchange: msg.exchange || msg.x,
      conditions: msg.conditions || msg.c,
    };
  }

  public async testConnection(symbol: string = 'BTC-USD'): Promise<{
    success: boolean;
    resultCode: 'PASS' | 'FAIL' | 'MARKET_CLOSED' | 'NO_ENTITLEMENT' | 'AUTH_ERROR' | 'NO_DATA_RECEIVED';
    message: string;
    latencyMs: number;
    sampleData?: any;
  }> {
    const startTime = Date.now();
    try {
      const resp = await fetch(`/api/realtime/test-connection?symbol=${encodeURIComponent(symbol)}`);
      const data = await resp.json();
      const latencyMs = Date.now() - startTime;
      return {
        success: Boolean(data.success),
        resultCode: data.resultCode || (data.success ? 'PASS' : 'FAIL'),
        message: data.message || (data.success ? 'Real-time test succeeded' : 'Test failed'),
        latencyMs,
        sampleData: data.sampleData,
      };
    } catch (err: any) {
      return {
        success: false,
        resultCode: 'FAIL',
        message: err?.message || 'Failed to reach diagnostic endpoint',
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
