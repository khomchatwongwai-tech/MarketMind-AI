import { WebSocket, WebSocketServer } from 'ws';
import type { Server as HttpServer } from 'http';
import https from 'https';
import { StreamSubscriptionManager, StreamPriorityLevel } from './streamSubscriptionManager';
import { MarketDataCache } from './marketDataCache';

export interface UpstreamProviderStatus {
  id: string;
  name: string;
  isConfigured: boolean;
  wsStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'AUTH_ERROR' | 'FAILED';
  lastTickTimestamp?: number;
  tickCount: number;
  lastError?: string;
}

export class RealtimeServerManager {
  private static instance: RealtimeServerManager;
  private wss: WebSocketServer | null = null;
  private clients = new Set<WebSocket>();

  private alpacaWs: WebSocket | null = null;
  private massiveWs: WebSocket | null = null;
  private finnhubWs: WebSocket | null = null;
  private cryptoWs: WebSocket | null = null;

  private latestQuotes = new Map<string, any>();
  private upstreamStatuses: Map<string, UpstreamProviderStatus> = new Map();

  private pollingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.upstreamStatuses.set('alpaca', {
      id: 'alpaca',
      name: 'Alpaca Free IEX Feed',
      isConfigured: Boolean(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET),
      wsStatus: 'DISCONNECTED',
      tickCount: 0,
    });

    this.upstreamStatuses.set('massive', {
      id: 'massive',
      name: 'Massive / Polygon.io',
      isConfigured: Boolean(process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY),
      wsStatus: 'DISCONNECTED',
      tickCount: 0,
    });

    this.upstreamStatuses.set('finnhub', {
      id: 'finnhub',
      name: 'Finnhub Institutional',
      isConfigured: Boolean(process.env.FINNHUB_API_KEY),
      wsStatus: 'DISCONNECTED',
      tickCount: 0,
    });

    this.upstreamStatuses.set('crypto_247', {
      id: 'crypto_247',
      name: 'Crypto 24/7 Global',
      isConfigured: true,
      wsStatus: 'DISCONNECTED',
      tickCount: 0,
    });

    // Register initial core symbols in StreamSubscriptionManager
    const initialSymbols = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'IWM'];
    const manager = StreamSubscriptionManager.getInstance();
    for (const sym of initialSymbols) {
      manager.subscribe(sym, 'ACTIVE_VIEW');
    }

    manager.setStreamChangeHandler((action, symbol) => {
      if (action === 'SUBSCRIBE') {
        this.resubscribeSingleSymbol(symbol);
      } else if (action === 'UNSUBSCRIBE') {
        this.unsubscribeSingleSymbol(symbol);
      }
    });
  }

  public static getInstance(): RealtimeServerManager {
    if (!RealtimeServerManager.instance) {
      RealtimeServerManager.instance = new RealtimeServerManager();
    }
    return RealtimeServerManager.instance;
  }

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws/market-stream' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial status
      ws.send(
        JSON.stringify({
          type: 'STATUS',
          status: 'CONNECTED',
          timestamp: Date.now(),
          subscriptionStats: StreamSubscriptionManager.getInstance().getStats(),
        })
      );

      // Send current quote snapshots
      this.latestQuotes.forEach((quote) => {
        ws.send(JSON.stringify(quote));
      });

      ws.on('message', (data: any) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleClientMessage(ws, msg);
        } catch (err) {
          console.error('[Realtime Server] Error parsing client message:', err);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    // Connect to upstreams
    this.initCryptoStream();
    this.initAlpacaStream();
    this.initMassiveStream();
    this.initFinnhubStream();
    this.startVerifiedPolling();
  }

  private handleClientMessage(ws: WebSocket, msg: any) {
    if (msg.action === 'ping') {
      ws.send(JSON.stringify({ type: 'PONG', timestamp: msg.timestamp, serverTime: Date.now() }));
      return;
    }

    if (msg.action === 'subscribe' && Array.isArray(msg.symbols)) {
      const priority: StreamPriorityLevel = msg.priority || 'ACTIVE_VIEW';
      const manager = StreamSubscriptionManager.getInstance();

      msg.symbols.forEach((s: string) => {
        const sym = (s || '').toUpperCase().trim();
        if (sym) {
          const result = manager.subscribe(sym, priority);
          if (this.latestQuotes.has(sym)) {
            ws.send(JSON.stringify(this.latestQuotes.get(sym)));
          }
        }
      });
      this.resubscribeUpstreams();
      return;
    }

    if (msg.action === 'unsubscribe' && Array.isArray(msg.symbols)) {
      const manager = StreamSubscriptionManager.getInstance();
      msg.symbols.forEach((s: string) => {
        manager.unsubscribe(s);
      });
      return;
    }
  }

  private broadcast(data: any) {
    const payload = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          console.error('[Realtime Server] Broadcast error:', err);
        }
      }
    });
  }

  private isPlaceholderKey(key: string | undefined): boolean {
    if (!key) return true;
    const trimmed = key.trim();
    if (trimmed.length < 8) return true;
    const lower = trimmed.toLowerCase();
    return (
      lower.startsWith('my_') ||
      lower.startsWith('your_') ||
      lower.startsWith('placeholder') ||
      lower.startsWith('example') ||
      lower.startsWith('api_key') ||
      lower.startsWith('dummy') ||
      lower.startsWith('test_') ||
      lower.includes('placeholder') ||
      lower.includes('example') ||
      lower.includes('api_key') ||
      lower === 'undefined' ||
      lower === 'null'
    );
  }

  // --- Upstream 0: Alpaca Free IEX WebSocket Stream ---
  private initAlpacaStream() {
    const key = process.env.ALPACA_API_KEY;
    const secret = process.env.ALPACA_API_SECRET;
    const status = this.upstreamStatuses.get('alpaca')!;

    if (!key || !secret || this.isPlaceholderKey(key) || this.isPlaceholderKey(secret)) {
      status.wsStatus = 'DISCONNECTED';
      status.isConfigured = false;
      return;
    }

    status.isConfigured = true;

    try {
      status.wsStatus = 'CONNECTING';
      const streamUrl = process.env.ALPACA_STREAM_BASE_URL || 'wss://stream.data.alpaca.markets/v2/iex';
      this.alpacaWs = new WebSocket(streamUrl);

      this.alpacaWs.on('open', () => {
        // Authenticate
        this.alpacaWs?.send(
          JSON.stringify({
            action: 'auth',
            key: key.trim(),
            secret: secret.trim(),
          })
        );
      });

      this.alpacaWs.on('message', (raw: any) => {
        try {
          const events = JSON.parse(raw.toString());
          if (Array.isArray(events)) {
            for (const ev of events) {
              if (ev.T === 'success' && ev.msg === 'authenticated') {
                status.wsStatus = 'CONNECTED';
                this.resubscribeAlpaca();
              } else if (ev.T === 'error') {
                status.lastError = ev.msg;
                if (ev.code === 402 || ev.msg?.includes('auth')) {
                  status.wsStatus = 'AUTH_ERROR';
                  try {
                    this.alpacaWs?.close();
                  } catch {}
                }
              } else if (ev.T === 't') {
                // Alpaca Trade: { T: 't', S: 'AAPL', p: 150.25, s: 100, t: '...' }
                status.tickCount++;
                status.lastTickTimestamp = Date.now();
                const trade = {
                  type: 'TRADE',
                  symbol: ev.S,
                  price: ev.p,
                  size: ev.s,
                  timestamp: Date.parse(ev.t) || Date.now(),
                  provider: 'Alpaca Free IEX',
                  mode: 'REAL_TIME',
                };
                MarketDataCache.getInstance().setTrade(ev.S, trade);
                this.broadcast(trade);
              } else if (ev.T === 'q') {
                // Alpaca Quote: { T: 'q', S: 'AAPL', bp: 150.2, bs: 5, ap: 150.3, as: 10, t: '...' }
                status.tickCount++;
                status.lastTickTimestamp = Date.now();
                const mid = (ev.bp + ev.ap) / 2;
                const quote = {
                  type: 'QUOTE',
                  symbol: ev.S,
                  price: mid,
                  bid: ev.bp,
                  ask: ev.ap,
                  bidSize: ev.bs,
                  askSize: ev.as,
                  timestamp: Date.parse(ev.t) || Date.now(),
                  provider: 'Alpaca Free IEX',
                  mode: 'REAL_TIME',
                };
                this.latestQuotes.set(ev.S, quote);
                this.broadcast(quote);
              } else if (ev.T === 'b') {
                // Alpaca 1-min Bar
                status.tickCount++;
                status.lastTickTimestamp = Date.now();
                const quote = {
                  type: 'QUOTE',
                  symbol: ev.S,
                  price: ev.c,
                  open: ev.o,
                  high: ev.h,
                  low: ev.l,
                  volume: ev.v,
                  timestamp: Date.parse(ev.t) || Date.now(),
                  provider: 'Alpaca Free IEX',
                  mode: 'REAL_TIME',
                };
                this.latestQuotes.set(ev.S, quote);
                this.broadcast(quote);
              }
            }
          }
        } catch (err) {
          console.error('[Realtime Server] Alpaca message parse error:', err);
        }
      });

      this.alpacaWs.on('error', (err) => {
        status.wsStatus = 'FAILED';
        status.lastError = err.message;
      });

      this.alpacaWs.on('close', () => {
        if (status.wsStatus === 'AUTH_ERROR') return;
        status.wsStatus = 'DISCONNECTED';
        setTimeout(() => this.initAlpacaStream(), 10000);
      });
    } catch (err: any) {
      status.wsStatus = 'FAILED';
      status.lastError = err?.message;
    }
  }

  // --- Upstream 1: 24/7 Crypto Stream ---
  private initCryptoStream() {
    try {
      const status = this.upstreamStatuses.get('crypto_247')!;
      status.wsStatus = 'CONNECTING';

      this.cryptoWs = new WebSocket('wss://stream.binance.com:9443/ws');

      this.cryptoWs.on('open', () => {
        status.wsStatus = 'CONNECTED';
        const streams = ['btcusdt@ticker', 'ethusdt@ticker', 'solusdt@ticker'];
        this.cryptoWs?.send(
          JSON.stringify({
            method: 'SUBSCRIBE',
            params: streams,
            id: 1,
          })
        );
      });

      this.cryptoWs.on('message', (raw: any) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data && data.s && data.c) {
            status.tickCount++;
            status.lastTickTimestamp = Date.now();

            const sym = data.s.replace('USDT', '') + '-USD';
            const price = Number(data.c);
            const quote = {
              type: 'QUOTE',
              symbol: sym,
              price,
              bid: Number(data.b || price * 0.9999),
              ask: Number(data.a || price * 1.0001),
              high: Number(data.h || price),
              low: Number(data.l || price),
              open: Number(data.o || price),
              volume: Number(data.v || 0),
              change: Number(data.p || 0),
              changePercent: Number(data.P || 0),
              timestamp: Number(data.E || Date.now()),
              provider: 'Crypto 24/7 Global',
              mode: 'REAL_TIME',
              marketStatus: '24/7',
            };

            this.latestQuotes.set(sym, quote);
            this.broadcast(quote);

            const trade = {
              type: 'TRADE',
              symbol: sym,
              price,
              size: Number(data.Q || 0),
              timestamp: Number(data.E || Date.now()),
              provider: 'Crypto 24/7 Global',
              mode: 'REAL_TIME',
            };
            this.broadcast(trade);
          }
        } catch (err) {
          console.error('[Realtime Server] Crypto stream error:', err);
        }
      });

      this.cryptoWs.on('error', (err) => {
        status.wsStatus = 'FAILED';
        status.lastError = err.message;
      });

      this.cryptoWs.on('close', () => {
        status.wsStatus = 'DISCONNECTED';
        setTimeout(() => this.initCryptoStream(), 5000);
      });
    } catch (err: any) {
      console.warn('[Realtime Server] Crypto WS failed to init:', err?.message);
    }
  }

  // --- Upstream 2: Polygon / Massive Stream ---
  private initMassiveStream() {
    const rawApiKey = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY;
    const status = this.upstreamStatuses.get('massive')!;
    if (!rawApiKey || this.isPlaceholderKey(rawApiKey)) {
      status.wsStatus = 'DISCONNECTED';
      status.isConfigured = false;
      return;
    }
    const apiKey = rawApiKey.trim();
    status.isConfigured = true;

    try {
      status.wsStatus = 'CONNECTING';
      this.massiveWs = new WebSocket('wss://socket.polygon.io/stocks');

      this.massiveWs.on('open', () => {
        this.massiveWs?.send(JSON.stringify({ action: 'auth', params: apiKey }));
      });

      this.massiveWs.on('message', (raw: any) => {
        try {
          const events = JSON.parse(raw.toString());
          if (Array.isArray(events)) {
            for (const ev of events) {
              if (ev.ev === 'status') {
                if (ev.status === 'auth_success') {
                  status.wsStatus = 'CONNECTED';
                  this.resubscribePolygon();
                } else if (ev.status === 'auth_failed') {
                  status.wsStatus = 'AUTH_ERROR';
                  status.lastError = ev.message;
                  try {
                    this.massiveWs?.close();
                  } catch {}
                }
              } else if (ev.ev === 'T') {
                status.tickCount++;
                status.lastTickTimestamp = Date.now();
                const trade = {
                  type: 'TRADE',
                  symbol: ev.sym,
                  price: ev.p,
                  size: ev.s,
                  timestamp: ev.t || Date.now(),
                  provider: 'Polygon / Massive',
                  mode: 'REAL_TIME',
                };
                this.broadcast(trade);
              } else if (ev.ev === 'Q') {
                status.tickCount++;
                status.lastTickTimestamp = Date.now();
                const mid = (ev.bp + ev.ap) / 2;
                const quote = {
                  type: 'QUOTE',
                  symbol: ev.sym,
                  price: mid,
                  bid: ev.bp,
                  ask: ev.ap,
                  bidSize: ev.bs,
                  askSize: ev.as,
                  timestamp: ev.t || Date.now(),
                  provider: 'Polygon / Massive',
                  mode: 'REAL_TIME',
                };
                this.latestQuotes.set(ev.sym, quote);
                this.broadcast(quote);
              }
            }
          }
        } catch (err) {
          console.error('[Realtime Server] Polygon message parse error:', err);
        }
      });

      this.massiveWs.on('error', (err) => {
        status.wsStatus = 'FAILED';
        status.lastError = err.message;
      });

      this.massiveWs.on('close', () => {
        if (status.wsStatus === 'AUTH_ERROR') return;
        status.wsStatus = 'DISCONNECTED';
        setTimeout(() => this.initMassiveStream(), 10000);
      });
    } catch (err: any) {
      status.wsStatus = 'FAILED';
      status.lastError = err?.message;
    }
  }

  // --- Upstream 3: Finnhub Stream ---
  private initFinnhubStream() {
    const rawApiKey = process.env.FINNHUB_API_KEY;
    const status = this.upstreamStatuses.get('finnhub')!;
    if (!rawApiKey || this.isPlaceholderKey(rawApiKey)) {
      status.wsStatus = 'DISCONNECTED';
      status.isConfigured = false;
      return;
    }
    const apiKey = rawApiKey.trim();
    status.isConfigured = true;

    try {
      status.wsStatus = 'CONNECTING';
      this.finnhubWs = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

      this.finnhubWs.on('open', () => {
        status.wsStatus = 'CONNECTED';
        this.resubscribeFinnhub();
      });

      this.finnhubWs.on('message', (raw: any) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'trade' && Array.isArray(msg.data)) {
            status.tickCount += msg.data.length;
            status.lastTickTimestamp = Date.now();
            for (const item of msg.data) {
              const trade = {
                type: 'TRADE',
                symbol: item.s,
                price: item.p,
                volume: item.v,
                timestamp: item.t,
                provider: 'Finnhub Institutional',
                mode: 'REAL_TIME',
              };
              this.broadcast(trade);

              const quote = {
                type: 'QUOTE',
                symbol: item.s,
                price: item.p,
                timestamp: item.t,
                provider: 'Finnhub Institutional',
                mode: 'REAL_TIME',
              };
              this.latestQuotes.set(item.s, quote);
              this.broadcast(quote);
            }
          }
        } catch (err) {
          console.error('[Realtime Server] Finnhub parse error:', err);
        }
      });

      this.finnhubWs.on('error', (err) => {
        status.wsStatus = 'FAILED';
        status.lastError = err.message;
      });

      this.finnhubWs.on('close', () => {
        status.wsStatus = 'DISCONNECTED';
        setTimeout(() => this.initFinnhubStream(), 10000);
      });
    } catch (err: any) {
      status.wsStatus = 'FAILED';
      status.lastError = err?.message;
    }
  }

  private resubscribeUpstreams() {
    this.resubscribeAlpaca();
    this.resubscribePolygon();
    this.resubscribeFinnhub();
  }

  private resubscribeAlpaca() {
    if (this.alpacaWs && this.alpacaWs.readyState === WebSocket.OPEN) {
      const symbols = StreamSubscriptionManager.getInstance()
        .getActiveStreamSymbols()
        .filter((s) => !s.includes('-USD') && !s.includes('='));
      if (symbols.length > 0) {
        this.alpacaWs.send(
          JSON.stringify({
            action: 'subscribe',
            trades: symbols,
            quotes: symbols,
            bars: symbols,
          })
        );
      }
    }
  }

  private resubscribeSingleSymbol(symbol: string) {
    if (symbol.includes('-USD') || symbol.includes('=')) return;

    if (this.alpacaWs && this.alpacaWs.readyState === WebSocket.OPEN) {
      this.alpacaWs.send(
        JSON.stringify({
          action: 'subscribe',
          trades: [symbol],
          quotes: [symbol],
          bars: [symbol],
        })
      );
    }
    if (this.massiveWs && this.massiveWs.readyState === WebSocket.OPEN) {
      this.massiveWs.send(JSON.stringify({ action: 'subscribe', params: `T.${symbol},Q.${symbol}` }));
    }
    if (this.finnhubWs && this.finnhubWs.readyState === WebSocket.OPEN) {
      this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol }));
    }
  }

  private unsubscribeSingleSymbol(symbol: string) {
    if (symbol.includes('-USD') || symbol.includes('=')) return;

    if (this.alpacaWs && this.alpacaWs.readyState === WebSocket.OPEN) {
      this.alpacaWs.send(
        JSON.stringify({
          action: 'unsubscribe',
          trades: [symbol],
          quotes: [symbol],
          bars: [symbol],
        })
      );
    }
    if (this.massiveWs && this.massiveWs.readyState === WebSocket.OPEN) {
      this.massiveWs.send(JSON.stringify({ action: 'unsubscribe', params: `T.${symbol},Q.${symbol}` }));
    }
    if (this.finnhubWs && this.finnhubWs.readyState === WebSocket.OPEN) {
      this.finnhubWs.send(JSON.stringify({ type: 'unsubscribe', symbol }));
    }
  }

  private resubscribePolygon() {
    if (this.massiveWs && this.massiveWs.readyState === WebSocket.OPEN) {
      const symbols = StreamSubscriptionManager.getInstance()
        .getActiveStreamSymbols()
        .filter((s) => !s.includes('-USD') && !s.includes('='));
      for (const sym of symbols) {
        this.massiveWs.send(JSON.stringify({ action: 'subscribe', params: `T.${sym},Q.${sym}` }));
      }
    }
  }

  private resubscribeFinnhub() {
    if (this.finnhubWs && this.finnhubWs.readyState === WebSocket.OPEN) {
      const symbols = StreamSubscriptionManager.getInstance()
        .getActiveStreamSymbols()
        .filter((s) => !s.includes('-USD') && !s.includes('='));
      for (const sym of symbols) {
        this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
      }
    }
  }

  /**
   * Fast verified REST polling fallback (strictly real quotes, never simulated)
   * Polls active stream symbols and rest-fallback symbols on a staggered cadence
   */
  private startVerifiedPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);

    this.pollingTimer = setInterval(async () => {
      const manager = StreamSubscriptionManager.getInstance();
      const activeSymbols = manager.getActiveStreamSymbols();
      const fallbackSymbols = manager.getRestFallbackSymbols();
      const allToPoll = [...activeSymbols, ...fallbackSymbols]
        .filter((s) => !s.includes('-USD') && !s.includes('='))
        .slice(0, 15);

      if (allToPoll.length === 0) return;

      try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
          allToPoll.join(',')
        )}`;
        https
          .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 }, (res) => {
            let body = '';
            res.on('data', (c) => (body += c));
            res.on('end', () => {
              try {
                const data = JSON.parse(body);
                const results = data?.quoteResponse?.result || [];
                for (const r of results) {
                  const sym = r.symbol?.toUpperCase();
                  if (sym && r.regularMarketPrice) {
                    const quote = {
                      type: 'QUOTE',
                      symbol: sym,
                      price: r.regularMarketPrice,
                      bid: r.bid,
                      ask: r.ask,
                      high: r.regularMarketDayHigh,
                      low: r.regularMarketDayLow,
                      open: r.regularMarketOpen,
                      previousClose: r.regularMarketPreviousClose,
                      change: r.regularMarketChange,
                      changePercent: r.regularMarketChangePercent,
                      volume: r.regularMarketVolume,
                      timestamp: (r.regularMarketTime || Math.floor(Date.now() / 1000)) * 1000,
                      provider: 'Yahoo Finance Real-Time Gateway',
                      mode: r.marketState === 'REGULAR' ? 'REAL_TIME' : 'CLOSED',
                    };
                    this.latestQuotes.set(sym, quote);
                    this.broadcast(quote);
                  }
                }
              } catch (e) {
                // ignore parse errors
              }
            });
          })
          .on('error', () => {
            // ignore network errors
          });
      } catch (err) {
        // quiet fallback
      }
    }, 4000);
  }

  public getDiagnostics() {
    const statuses: any[] = [];
    this.upstreamStatuses.forEach((st) => {
      statuses.push({
        provider: st.name,
        isConfigured: st.isConfigured,
        wsStatus: st.wsStatus,
        lastTickTimestamp: st.lastTickTimestamp,
        tickCount: st.tickCount,
        lastError: st.lastError,
      });
    });

    const subManager = StreamSubscriptionManager.getInstance();

    return {
      connectedClients: this.clients.size,
      activeSubscribedSymbols: subManager.getActiveStreamSymbols(),
      restFallbackSymbols: subManager.getRestFallbackSymbols(),
      subscriptionStats: subManager.getStats(),
      cachedQuotesCount: this.latestQuotes.size,
      upstreams: statuses,
    };
  }
}
