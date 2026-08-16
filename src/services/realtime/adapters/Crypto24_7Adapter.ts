import { BaseRealTimeAdapter } from './BaseRealTimeAdapter';
import { NormalizedQuote, NormalizedTrade } from '../../../types/realtime';

export class Crypto24_7Adapter extends BaseRealTimeAdapter {
  public id = 'crypto_247';
  public name = 'Crypto 24/7 Live Stream (Binance/Coinbase)';
  public capabilities = {
    stocks: false,
    options: false,
    crypto: true,
    forex: false,
    futures: false,
    realtimeStocks: false,
    realtimeOptions: false,
    extendedHours: true,
    entitlementTier: 'PRO' as const,
  };

  private ws: WebSocket | null = null;
  private subscribedCryptoSymbols = new Set<string>();

  constructor() {
    super('crypto_247', 'Crypto 24/7 Live Stream', {
      stocks: false,
      options: false,
      crypto: true,
      forex: false,
      futures: false,
      realtimeStocks: false,
      realtimeOptions: false,
      extendedHours: true,
      entitlementTier: 'PRO',
    });
  }

  private mapSymbolToStream(symbol: string): string {
    const clean = symbol.toUpperCase().replace('-USD', '').replace('USDT', '').replace('X:', '');
    return `${clean.toLowerCase()}usdt@ticker`;
  }

  private mapStreamToNormalizedSymbol(streamName: string): string {
    const raw = streamName.replace('@ticker', '').toUpperCase();
    if (raw.endsWith('USDT')) {
      return `${raw.replace('USDT', '')}-USD`;
    }
    return `${raw}-USD`;
  }

  public async connect(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      // Connect to public multi-stream WebSocket for crypto 24/7 diagnostic
      const wsUrl = 'wss://stream.binance.com:9443/ws';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED', {
          webSocketStatus: 'CONNECTED',
          authStatus: 'AUTHENTICATED',
        });
        if (this.subscribedCryptoSymbols.size > 0) {
          const streams = Array.from(this.subscribedCryptoSymbols).map((s) => this.mapSymbolToStream(s));
          this.sendSubscriptionPayload('SUBSCRIBE', streams);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Binance ticker stream payload has { e: '24hrTicker', s: 'BTCUSDT', c: '65230.12', ... }
          if (data && data.s && data.c) {
            const normSym = this.mapStreamToNormalizedSymbol(data.s);
            const price = Number(data.c);
            const high = Number(data.h || price);
            const low = Number(data.l || price);
            const open = Number(data.o || price);
            const volume = Number(data.v || 0);
            const change = Number(data.p || 0);
            const changePercent = Number(data.P || 0);
            const timestamp = Number(data.E || Date.now());

            const quote: NormalizedQuote = {
              symbol: normSym,
              price,
              bid: Number(data.b) || 0,
              ask: Number(data.a) || 0,
              high,
              low,
              open,
              volume,
              change,
              changePercent,
              timestamp,
              provider: 'Crypto 24/7 Global Stream',
              mode: 'REAL_TIME',
              marketStatus: '24/7',
              stale: false,
              rawPayload: data,
            };
            this.emitQuote(quote);

            const trade: NormalizedTrade = {
              symbol: normSym,
              price,
              size: Number(data.Q || 0),
              timestamp,
              provider: 'Crypto 24/7 Global Stream',
              mode: 'REAL_TIME',
            };
            this.emitTrade(trade);
          }
        } catch (err) {
          console.error('[Crypto24_7Adapter] Error parsing stream message:', err);
        }
      };

      this.ws.onerror = (e) => {
        this.metrics.errorCount++;
        this.metrics.lastError = 'Crypto WebSocket connection error';
      };

      this.ws.onclose = (e) => {
        this.setStatus('DISCONNECTED', { webSocketStatus: 'DISCONNECTED' });
        if (e.code !== 1000) {
          this.scheduleReconnect(Array.from(this.subscribedCryptoSymbols));
        }
      };
    } catch (err: any) {
      this.setStatus('DOWN', { lastError: err?.message || 'Failed to initialize crypto socket' });
      this.scheduleReconnect(Array.from(this.subscribedCryptoSymbols));
    }
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000, 'Crypto disconnect');
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  public async subscribe(symbols: string[]): Promise<void> {
    const cryptoSyms = symbols.filter((s) => {
      const u = s.toUpperCase();
      return u.includes('BTC') || u.includes('ETH') || u.includes('SOL') || u.includes('-USD') || u.includes('USDT');
    });

    const newStreams: string[] = [];
    for (const sym of cryptoSyms) {
      const clean = sym.toUpperCase();
      if (!this.subscribedCryptoSymbols.has(clean)) {
        this.subscribedCryptoSymbols.add(clean);
        newStreams.push(this.mapSymbolToStream(clean));
      }
    }

    this.metrics.subscribedSymbolsCount = this.subscribedCryptoSymbols.size;

    if (newStreams.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscriptionPayload('SUBSCRIBE', newStreams);
    }
  }

  public async unsubscribe(symbols: string[]): Promise<void> {
    const cryptoSyms = symbols.filter((s) => {
      const u = s.toUpperCase();
      return u.includes('BTC') || u.includes('ETH') || u.includes('SOL') || u.includes('-USD') || u.includes('USDT');
    });

    const removeStreams: string[] = [];
    for (const sym of cryptoSyms) {
      const clean = sym.toUpperCase();
      if (this.subscribedCryptoSymbols.has(clean)) {
        this.subscribedCryptoSymbols.delete(clean);
        removeStreams.push(this.mapSymbolToStream(clean));
      }
    }

    this.metrics.subscribedSymbolsCount = this.subscribedCryptoSymbols.size;

    if (removeStreams.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscriptionPayload('UNSUBSCRIBE', removeStreams);
    }
  }

  private sendSubscriptionPayload(method: 'SUBSCRIBE' | 'UNSUBSCRIBE', params: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          method,
          params,
          id: Date.now(),
        })
      );
    }
  }

  public async testConnection(symbol: string = 'BTC-USD'): Promise<{
    success: boolean;
    resultCode: 'PASS' | 'FAIL' | 'MARKET_CLOSED' | 'NO_ENTITLEMENT' | 'AUTH_ERROR' | 'NO_DATA_RECEIVED';
    message: string;
    latencyMs: number;
    sampleData?: any;
  }> {
    const startTime = Date.now();
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve({
            success: false,
            resultCode: 'NO_DATA_RECEIVED',
            message: 'Crypto 24/7 stream timed out waiting for tick',
            latencyMs: Date.now() - startTime,
          });
        }
      }, 5000);

      const cleanup = this.onTrade((t) => {
        if (t.symbol === symbol || t.symbol.includes('BTC')) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({
              success: true,
              resultCode: 'PASS',
              message: `Received live tick for ${t.symbol} @ $${t.price.toFixed(2)} (${Date.now() - startTime}ms latency)`,
              latencyMs: Date.now() - startTime,
              sampleData: t,
            });
          }
        }
      });

      // Ensure subscribed
      this.subscribe([symbol]);
    });
  }
}
