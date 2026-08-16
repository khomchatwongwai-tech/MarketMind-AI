import { WebSocket, WebSocketServer } from 'ws';
import type { Server as HttpServer } from 'http';
import https from 'https';

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

  private massiveWs: WebSocket | null = null;
  private finnhubWs: WebSocket | null = null;
  private alpacaWs: WebSocket | null = null;
  private cryptoWs: WebSocket | null = null;

  private activeSymbols = new Set<string>(['SPY', 'QQQ', 'NVDA', 'AAPL', 'BTC-USD', 'ETH-USD']);
  private latestQuotes = new Map<string, any>();
  private upstreamStatuses: Map<string, UpstreamProviderStatus> = new Map();

  private pollingTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
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

    this.upstreamStatuses.set('alpaca_iex', {
      id: 'alpaca_iex', name: 'Alpaca IEX Market Data',
      isConfigured: Boolean(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET),
      wsStatus: 'DISCONNECTED', tickCount: 0,
    });

    this.upstreamStatuses.set('crypto_247', {
      id: 'crypto_247',
      name: 'Crypto 24/7 Global',
      isConfigured: true,
      wsStatus: 'DISCONNECTED',
      tickCount: 0,
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
      console.log(`[Realtime Server] Client connected. Active clients: ${this.clients.size}`);

      // Send initial status & cached quotes
      ws.send(
        JSON.stringify({
          type: 'STATUS',
          status: 'CONNECTED_TO_SERVER',
          marketDataStatus: this.getAvailableUpstreamCount() > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
          timestamp: Date.now(),
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
        console.log(`[Realtime Server] Client disconnected. Active clients: ${this.clients.size}`);
      });
    });

    // Connect to upstreams
    this.initCryptoStream();
    const massiveStatus = this.upstreamStatuses.get('massive');
    if (massiveStatus) {
      massiveStatus.isConfigured = Boolean(process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY);
      massiveStatus.wsStatus = 'DISCONNECTED';
      massiveStatus.lastError = 'Massive equities are served by the canonical /ws/massive server gateway.';
    }
    this.initFinnhubStream();
    this.initAlpacaStream();
    this.startVerifiedPolling();
  }

  private handleClientMessage(ws: WebSocket, msg: any) {
    if (msg.action === 'ping') {
      ws.send(JSON.stringify({ type: 'PONG', timestamp: msg.timestamp, serverTime: Date.now() }));
      return;
    }

    if (msg.action === 'subscribe' && Array.isArray(msg.symbols)) {
      msg.symbols.forEach((s: string) => {
        const sym = (s || '').toUpperCase();
        if (sym) {
          this.activeSymbols.add(sym);
          // If we already have a cached quote, emit immediately
          if (this.latestQuotes.has(sym)) {
            ws.send(JSON.stringify(this.latestQuotes.get(sym)));
          }
        }
      });
      this.resubscribeUpstreams();
      return;
    }

    if (msg.action === 'unsubscribe' && Array.isArray(msg.symbols)) {
      msg.symbols.forEach((s: string) => {
        this.activeSymbols.delete((s || '').toUpperCase());
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

  private getAvailableUpstreamCount(): number {
    return Array.from(this.upstreamStatuses.values()).filter(
      (provider) => provider.wsStatus === 'CONNECTED'
    ).length;
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
            const bid = Number(data.b);
            const ask = Number(data.a);
            if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(bid) || bid <= 0 || !Number.isFinite(ask) || ask <= 0) {
              return;
            }
            const quote = {
              type: 'QUOTE',
              symbol: sym,
              price,
              bid,
              ask,
              high: Number(data.h),
              low: Number(data.l),
              open: Number(data.o),
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

  // --- Upstream 2: Polygon / Massive Stream ---
  private initMassiveStream() {
    const rawApiKey = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY;
    const status = this.upstreamStatuses.get('massive')!;
    if ((process.env.MARKET_DATA_MODE || 'end_of_day') === 'end_of_day') {
      status.wsStatus = 'DISCONNECTED';
      status.isConfigured = Boolean(rawApiKey && !this.isPlaceholderKey(rawApiKey));
      status.lastError = 'End-of-day mode enabled; real-time WebSocket is intentionally disabled.';
      return;
    }
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
        // Authenticate
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
                  console.log('[Realtime Server] Massive/Polygon authentication unverified; holding in safe baseline mode.');
                  try {
                    this.massiveWs?.close();
                  } catch {
                    // ignore
                  }
                }
              } else if (ev.ev === 'T') {
                // Trade
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
                // Quote
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
        if (status.wsStatus === 'AUTH_ERROR') {
          // Do not retry if credentials rejected
          return;
        }
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
    this.resubscribePolygon();
    this.resubscribeFinnhub();
    this.resubscribeAlpaca();
  }

  // --- Upstream 4: Alpaca IEX equities stream (not consolidated SIP) ---
  private initAlpacaStream() {
    const key = process.env.ALPACA_API_KEY;
    const secret = process.env.ALPACA_API_SECRET;
    const status = this.upstreamStatuses.get('alpaca_iex')!;
    if (this.isPlaceholderKey(key) || this.isPlaceholderKey(secret)) {
      status.isConfigured = false; status.wsStatus = 'DISCONNECTED'; return;
    }
    status.isConfigured = true;
    try {
      status.wsStatus = 'CONNECTING';
      this.alpacaWs = new WebSocket('wss://stream.data.alpaca.markets/v2/iex');
      this.alpacaWs.on('open', () => this.alpacaWs?.send(JSON.stringify({ action: 'auth', key, secret })));
      this.alpacaWs.on('message', (raw: any) => {
        try {
          const events = JSON.parse(raw.toString());
          for (const event of Array.isArray(events) ? events : [events]) {
            if (event.T === 'success' && event.msg === 'authenticated') { status.wsStatus = 'CONNECTED'; this.resubscribeAlpaca(); continue; }
            if (event.T === 'error') {
              status.wsStatus = event.code === 402 || event.code === 404 ? 'AUTH_ERROR' : 'FAILED';
              status.lastError = `Alpaca stream error ${event.code || 'unknown'}`;
              if (status.wsStatus === 'AUTH_ERROR') this.alpacaWs?.close();
              continue;
            }
            if (!['t', 'q', 'b'].includes(event.T)) continue;
            status.tickCount++; status.lastTickTimestamp = Date.now();
            const timestamp = Date.parse(event.t) || Date.now();
            if (event.T === 't' && Number(event.p) > 0) this.broadcast({ type: 'TRADE', symbol: event.S, price: Number(event.p), size: Number(event.s || 0), timestamp, provider: 'Alpaca IEX', feed: 'iex', isConsolidated: false, mode: 'REAL_TIME' });
            if (event.T === 'q' && Number(event.bp) > 0 && Number(event.ap) > 0) {
              const quote = { type: 'QUOTE', symbol: event.S, price: (Number(event.bp) + Number(event.ap)) / 2, bid: Number(event.bp), ask: Number(event.ap), bidSize: Number(event.bs || 0), askSize: Number(event.as || 0), timestamp, provider: 'Alpaca IEX', feed: 'iex', isConsolidated: false, mode: 'REAL_TIME' };
              this.latestQuotes.set(event.S, quote); this.broadcast(quote);
            }
            if (event.T === 'b') this.broadcast({ type: 'BAR', symbol: event.S, open: Number(event.o), high: Number(event.h), low: Number(event.l), close: Number(event.c), volume: Number(event.v || 0), timestamp, provider: 'Alpaca IEX', feed: 'iex', isConsolidated: false, mode: 'REAL_TIME' });
          }
        } catch { status.lastError = 'Alpaca stream returned malformed data'; }
      });
      this.alpacaWs.on('error', () => { status.wsStatus = 'FAILED'; status.lastError = 'Alpaca stream connection failed'; });
      this.alpacaWs.on('close', () => { if (status.wsStatus === 'AUTH_ERROR') return; status.wsStatus = 'DISCONNECTED'; setTimeout(() => this.initAlpacaStream(), 10000); });
    } catch { status.wsStatus = 'FAILED'; status.lastError = 'Alpaca stream initialization failed'; }
  }

  private resubscribeAlpaca() {
    if (this.alpacaWs?.readyState !== WebSocket.OPEN) return;
    const symbols = Array.from(this.activeSymbols).filter((symbol) => !symbol.includes('-USD'));
    if (symbols.length) this.alpacaWs.send(JSON.stringify({ action: 'subscribe', trades: symbols, quotes: symbols, bars: symbols }));
  }

  private resubscribePolygon() {
    if (this.massiveWs && this.massiveWs.readyState === WebSocket.OPEN) {
      const symbols = Array.from(this.activeSymbols).filter((s) => !s.includes('-USD'));
      for (const sym of symbols) {
        this.massiveWs.send(JSON.stringify({ action: 'subscribe', params: `T.${sym},Q.${sym}` }));
      }
    }
  }

  private resubscribeFinnhub() {
    if (this.finnhubWs && this.finnhubWs.readyState === WebSocket.OPEN) {
      const symbols = Array.from(this.activeSymbols).filter((s) => !s.includes('-USD'));
      for (const sym of symbols) {
        this.finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
      }
    }
  }

  /**
   * Fast verified REST polling fallback (strictly real quotes, never simulated)
   */
  private startVerifiedPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);

    this.pollingTimer = setInterval(async () => {
      const stockSymbols = Array.from(this.activeSymbols).filter((s) => !s.includes('-USD')).slice(0, 10);
      if (stockSymbols.length === 0) return;

      try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(stockSymbols.join(','))}`;
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 4000 }, (res) => {
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
        }).on('error', () => {
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

    return {
      connectedClients: this.clients.size,
      activeSubscribedSymbols: Array.from(this.activeSymbols),
      cachedQuotesCount: this.latestQuotes.size,
      upstreams: statuses,
    };
  }
}
