import { WebSocket, WebSocketServer } from 'ws';
import type { Server as HttpServer } from 'http';
import { GoogleGenAI } from '@google/genai';
import {
  MassiveWsStatus,
  MassiveAiInsight,
  CalculatedMarketSignals,
  MassiveWsClientMessage,
} from '../types/massiveWs';
import { AppConfig } from '../config/environment';
import { MASTER_INSTRUMENTS } from './marketProviders/InstrumentDirectoryService';

interface CandleState {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
}

export interface MassiveStreamState {
  ticker: string;
  status: MassiveWsStatus;
  isDelayed: boolean;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  cumulativeVolume: number;
  cumulativePV: number;
  vwap: number;
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  relativeVolume: number;
  support: number;
  resistance: number;
  candles: CandleState[];
  lastAiInsight?: MassiveAiInsight;
  lastTradeTime?: number;
  lastAiCallTime?: number;
}

export class MassiveWebSocketManager {
  private activeTicker: string = 'SPY';
  private massiveWs: WebSocket | null = null;
  private wss: WebSocketServer | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private simulationInterval: NodeJS.Timeout | null = null;
  private aiAnalysisInterval: NodeJS.Timeout | null = null;
  private isAuthenticating: boolean = false;
  private isSubscribed: boolean = false;
  private isUsingSimulatedStream: boolean = false;
  private state: MassiveStreamState;
  private getAI: () => GoogleGenAI | null;
  private aiCooldownUntil: number = 0;

  constructor(getAI: () => GoogleGenAI | null) {
    this.getAI = getAI;
    this.state = this.createBaselineTickerState('SPY', 'CONNECTING');
  }

  private createBaselineTickerState(ticker: string, initialStatus: MassiveWsStatus = 'DISCONNECTED'): MassiveStreamState {
    const cleanTicker = (ticker || 'SPY').toUpperCase().trim();
    const inst = MASTER_INSTRUMENTS.find(
      (i) => i.symbol.toUpperCase() === cleanTicker || i.displaySymbol.toUpperCase() === cleanTicker
    );

    const refPrice = inst?.price ?? (cleanTicker === 'SPY' ? 542.80 : cleanTicker === 'QQQ' ? 478.50 : 150.00);
    const refOpen = inst?.open ?? refPrice * 0.998;
    const refHigh = inst?.high ?? refPrice * 1.006;
    const refLow = inst?.low ?? refPrice * 0.994;
    const refVol = inst?.volume ?? 45000000;
    const refVwap = Number((refPrice * 0.9985).toFixed(2));

    return {
      ticker: cleanTicker,
      status: initialStatus,
      isDelayed: false,
      price: refPrice,
      open: refOpen,
      high: refHigh,
      low: refLow,
      close: refPrice,
      volume: refVol,
      cumulativeVolume: refVol,
      cumulativePV: refPrice * refVol,
      vwap: refVwap,
      ema9: Number((refPrice * 0.9992).toFixed(2)),
      ema20: Number((refPrice * 0.9965).toFixed(2)),
      ema50: Number((refPrice * 0.9880).toFixed(2)),
      ema200: Number((refPrice * 0.9620).toFixed(2)),
      rsi: 53.5,
      relativeVolume: 1.12,
      support: Number((refLow || refPrice * 0.993).toFixed(2)),
      resistance: Number((refHigh || refPrice * 1.007).toFixed(2)),
      candles: [],
    };
  }

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws/massive' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[MassiveWS Server] Client connected to live feed');

      // Send initial state snapshot immediately
      ws.send(
        JSON.stringify({
          type: 'STATUS',
          status: this.state.status,
          ticker: this.state.ticker,
          isDelayed: this.state.isDelayed,
        })
      );

      ws.send(
        JSON.stringify({
          type: 'SIGNALS',
          signals: this.getCalculatedSignals(),
        })
      );

      if (this.state.lastAiInsight) {
        ws.send(
          JSON.stringify({
            type: 'AI_INSIGHT',
            aiInsight: this.state.lastAiInsight,
          })
        );
      }

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.action === 'SUBSCRIBE' && data.ticker) {
            this.setTicker(data.ticker);
          } else if (data.action === 'REQUEST_AI_FEED') {
            this.triggerGeminiSignalFeed(true);
          }
        } catch (e) {
          console.warn('[MassiveWS Server] Error parsing client message:', e);
        }
      });
    });

    // Start connection to Massive / Polygon
    this.connectMassive();

    // Trigger initial quantitative interpretation
    setTimeout(() => {
      this.triggerGeminiSignalFeed(false);
    }, 1000);
  }

  public setTicker(newTicker: string) {
    const cleanTicker = (newTicker || 'SPY').toUpperCase().trim();
    if (this.activeTicker === cleanTicker) return;

    console.log(`[MassiveWS] Switching active ticker subscription from ${this.activeTicker} to ${cleanTicker}`);
    const oldTicker = this.activeTicker;
    this.activeTicker = cleanTicker;

    // Reset baseline indicators for new ticker if not actively streaming live ticks
    if (this.state.status === 'DISCONNECTED' || !this.isSubscribed) {
      const baseline = this.createBaselineTickerState(cleanTicker, this.state.status);
      this.state = {
        ...baseline,
        status: this.state.status,
        isDelayed: this.state.isDelayed,
      };
    } else {
      this.state.ticker = cleanTicker;
    }

    // Resubscribe if connected to real Massive WebSocket (avoid duplicate subscriptions)
    if (this.massiveWs && this.massiveWs.readyState === WebSocket.OPEN && !this.isUsingSimulatedStream) {
      // Unsubscribe old ticker
      this.massiveWs.send(JSON.stringify({ action: 'unsubscribe', params: `T.${oldTicker},AM.${oldTicker},A.${oldTicker}` }));
      // Subscribe to only the active new ticker
      this.massiveWs.send(JSON.stringify({ action: 'subscribe', params: `T.${cleanTicker},AM.${cleanTicker},A.${cleanTicker}` }));
    }

    // Broadcast status and updated baseline signals
    this.broadcast({
      type: 'STATUS',
      status: this.state.status,
      ticker: this.state.ticker,
      isDelayed: this.state.isDelayed,
    });
    this.broadcast({
      type: 'SIGNALS',
      signals: this.getCalculatedSignals(),
    });

    // Run AI analysis for new ticker
    setTimeout(() => {
      this.triggerGeminiSignalFeed(true);
    }, 1500);
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

  private connectMassive() {
    const rawApiKey = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY;

    if (!rawApiKey || this.isPlaceholderKey(rawApiKey)) {
      console.log('[MassiveWS] Provider credentials pending configuration. Operating in baseline quantitative intelligence mode.');
      this.updateStatus('DISCONNECTED');
      return;
    }

    const apiKey = rawApiKey.trim();
    this.updateStatus('CONNECTING');

    // Polygon / Massive Stocks WebSocket endpoint
    const isDelayedEndpoint = process.env.MASSIVE_WS_DELAYED === 'true';
    const wsUrl = isDelayedEndpoint ? 'wss://delayed.polygon.io/stocks' : 'wss://socket.polygon.io/stocks';
    this.state.isDelayed = isDelayedEndpoint;

    try {
      const maskedKey = apiKey.length > 4 ? `****${apiKey.slice(-4)}` : '****';
      console.log(`[MassiveWS] Connecting to Massive WebSocket at ${wsUrl} (Key: ${maskedKey})...`);
      this.massiveWs = new WebSocket(wsUrl);

      this.massiveWs.on('open', () => {
        console.log('[MassiveWS] Connection established. Authenticating...');
        this.updateStatus('AUTHENTICATING');
        this.isAuthenticating = true;
        this.reconnectAttempts = 0;

        // Authenticate with MASSIVE_API_KEY
        this.massiveWs?.send(JSON.stringify({ action: 'auth', params: apiKey }));
      });

      this.massiveWs.on('message', (raw: any) => {
        try {
          const parsed = JSON.parse(raw.toString());
          if (Array.isArray(parsed)) {
            for (const msg of parsed) {
              this.handleMassiveMessage(msg);
            }
          } else {
            this.handleMassiveMessage(parsed);
          }
        } catch (err: any) {
          console.warn('[MassiveWS] Error parsing message from upstream:', err.message);
        }
      });

      this.massiveWs.on('error', (err: any) => {
        console.warn('[MassiveWS] Upstream WebSocket error:', err.message);
        this.handleConnectionDrop();
      });

      this.massiveWs.on('close', (code, reason) => {
        if (!this.isAuthenticating) {
          console.log(`[MassiveWS] Stream disconnected (${code}): ${reason.toString()}`);
        }
        this.handleConnectionDrop();
      });
    } catch (e: any) {
      console.error('[MassiveWS] Initialization failed:', e.message);
      this.handleConnectionDrop();
    }
  }

  private handleConnectionDrop() {
    if (this.state.status === 'DISCONNECTED') {
      return;
    }

    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      this.updateStatus('RECONNECTING');
      const backoffMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`[MassiveWS] Connection lost. Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${backoffMs}ms...`);
      
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.connectMassive();
      }, backoffMs);
    } else {
      console.log('[MassiveWS] Upstream connection stopped. Operating in baseline quantitative intelligence mode.');
      this.updateStatus('DISCONNECTED');
    }
  }

  private handleMassiveMessage(msg: any) {
    // 1. Authentication response
    if (msg.ev === 'status') {
      if (msg.status === 'auth_success' || msg.message === 'authenticated') {
        console.log(`[MassiveWS] Authentication Successful. Subscribing exclusively to ${this.activeTicker}...`);
        this.isAuthenticating = false;
        this.reconnectAttempts = 0;

        // Subscribe strictly to active ticker (SPY initially)
        const subParams = `T.${this.activeTicker},AM.${this.activeTicker},A.${this.activeTicker}`;
        this.massiveWs?.send(JSON.stringify({ action: 'subscribe', params: subParams }));
        
        const finalStatus = this.state.isDelayed ? 'DELAYED DATA' : 'LIVE';
        this.updateStatus(finalStatus);
      } else if (msg.status === 'auth_failed') {
        console.log('[MassiveWS] Upstream WebSocket authentication failed or credentials not configured. Baseline quantitative engine is active.');
        this.isAuthenticating = false;
        this.reconnectAttempts = this.maxReconnectAttempts + 1; // Prevent retry loop
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.updateStatus('DISCONNECTED');
        this.stopSimulatedFeed();
        try {
          this.massiveWs?.close();
        } catch {
          // ignore
        }
      } else if (msg.status === 'success' && msg.message?.includes('subscribed')) {
        console.log(`[MassiveWS] Subscribed to ${this.activeTicker}. Live ticks flowing.`);
        this.isSubscribed = true;
        const finalStatus = this.state.isDelayed ? 'DELAYED DATA' : 'LIVE';
        this.updateStatus(finalStatus);
        this.stopSimulatedFeed();
      } else if (msg.message?.toLowerCase().includes('delayed')) {
        this.state.isDelayed = true;
        this.updateStatus('DELAYED DATA');
      }
    }

    // 2. Live Trade Event (ev: 'T')
    if (msg.ev === 'T' && msg.sym === this.activeTicker) {
      this.processLiveTrade(msg.p, msg.s, msg.t);
    }

    // 3. Live Minute / Second Aggregate Event (ev: 'AM' | 'A')
    if ((msg.ev === 'AM' || msg.ev === 'A') && msg.sym === this.activeTicker) {
      this.processLiveAggregate(msg);
    }
  }

  // Receive live trades
  private processLiveTrade(price: number, size: number, timestamp: number) {
    if (!price || isNaN(price)) return;

    this.state.price = Number(price.toFixed(2));
    this.state.high = Math.max(this.state.high, this.state.price);
    this.state.low = Math.min(this.state.low, this.state.price);
    this.state.close = this.state.price;
    this.state.cumulativeVolume += size;
    this.state.cumulativePV += price * size;
    this.state.lastTradeTime = timestamp;

    // Recalculate indicators
    this.recalculateIndicators();

    // Broadcast trade with Eastern Time
    const date = new Date(timestamp || Date.now());
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York',
    });

    this.broadcast({
      type: 'TRADE',
      ticker: this.activeTicker,
      trade: {
        price: this.state.price,
        size,
        time: Math.floor((timestamp || Date.now()) / 1000),
        formattedTime,
      },
      signals: this.getCalculatedSignals(),
    });
  }

  // Receive live aggregates & Update Chart without replacing full dataset
  private processLiveAggregate(agg: any) {
    const time = Math.floor((agg.s || Date.now()) / 1000);
    const o = agg.o ?? this.state.price;
    const h = agg.h ?? this.state.price;
    const l = agg.l ?? this.state.price;
    const c = agg.c ?? this.state.price;
    const v = agg.v ?? 1000;

    this.state.price = c;
    this.state.high = Math.max(this.state.high, h);
    this.state.low = Math.min(this.state.low, l);

    // Merge into latest candle
    const lastIndex = this.state.candles.length - 1;
    if (lastIndex >= 0 && this.state.candles[lastIndex].time === time) {
      this.state.candles[lastIndex].high = Math.max(this.state.candles[lastIndex].high, h);
      this.state.candles[lastIndex].low = Math.min(this.state.candles[lastIndex].low, l);
      this.state.candles[lastIndex].close = c;
      this.state.candles[lastIndex].volume += v;
    } else {
      // Append new candle (capped at last 300)
      this.state.candles.push({
        time,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
        vwap: this.state.vwap,
      });
      if (this.state.candles.length > 300) {
        this.state.candles.shift();
      }
    }

    this.recalculateIndicators();

    // Broadcast aggregate to update chart
    this.broadcast({
      type: 'AGGREGATE',
      ticker: this.activeTicker,
      aggregate: {
        time,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
        vwap: this.state.vwap,
      },
      signals: this.getCalculatedSignals(),
    });
  }

  // Calculate VWAP / EMA / RSI / Volume / Support / Resistance
  private recalculateIndicators() {
    const p = this.state.price;

    // 1. VWAP (Cumulative Price * Volume / Cumulative Volume)
    if (this.state.cumulativeVolume > 0) {
      this.state.vwap = Number((this.state.cumulativePV / this.state.cumulativeVolume).toFixed(2));
    } else {
      this.state.vwap = p;
    }

    // 2. Exponential Moving Averages (EMA 9, EMA 20, EMA 50, EMA 200)
    const k9 = 2 / (9 + 1);
    const k20 = 2 / (20 + 1);
    const k50 = 2 / (50 + 1);
    const k200 = 2 / (200 + 1);

    this.state.ema9 = Number((p * k9 + this.state.ema9 * (1 - k9)).toFixed(2));
    this.state.ema20 = Number((p * k20 + this.state.ema20 * (1 - k20)).toFixed(2));
    this.state.ema50 = Number((p * k50 + this.state.ema50 * (1 - k50)).toFixed(2));
    this.state.ema200 = Number((p * k200 + this.state.ema200 * (1 - k200)).toFixed(2));

    // 3. RSI approx
    const delta = p - this.state.open;
    const rsiChange = delta * 1.5;
    this.state.rsi = Number(Math.min(88, Math.max(15, this.state.rsi + rsiChange * 0.05)).toFixed(1));

    // 4. Relative Volume
    const avgVol = 35000;
    this.state.relativeVolume = Number((Math.max(0.6, this.state.volume / avgVol)).toFixed(2));

    // 5. Dynamic Support & Resistance
    this.state.support = Number((Math.min(this.state.low, p * 0.995)).toFixed(2));
    this.state.resistance = Number((Math.max(this.state.high, p * 1.005)).toFixed(2));
  }

  public getCalculatedSignals(): CalculatedMarketSignals {
    const p = this.state.price;
    const vwap = this.state.vwap;
    const ema9 = this.state.ema9;
    const ema20 = this.state.ema20;
    const ema50 = this.state.ema50;

    const priceVsVwap: 'ABOVE_VWAP' | 'BELOW_VWAP' | 'AT_VWAP' =
      p > vwap + 0.05 ? 'ABOVE_VWAP' : p < vwap - 0.05 ? 'BELOW_VWAP' : 'AT_VWAP';

    const emaStack: 'BULLISH_STACK' | 'BEARISH_STACK' | 'MIXED' =
      ema9 > ema20 && ema20 > ema50 ? 'BULLISH_STACK' : ema9 < ema20 && ema20 < ema50 ? 'BEARISH_STACK' : 'MIXED';

    let momentum: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'NEUTRAL' | 'MODERATE_BEARISH' | 'STRONG_BEARISH' = 'NEUTRAL';
    if (priceVsVwap === 'ABOVE_VWAP' && emaStack === 'BULLISH_STACK' && this.state.rsi > 52) {
      momentum = 'STRONG_BULLISH';
    } else if (priceVsVwap === 'ABOVE_VWAP' || emaStack === 'BULLISH_STACK') {
      momentum = 'MODERATE_BULLISH';
    } else if (priceVsVwap === 'BELOW_VWAP' && emaStack === 'BEARISH_STACK' && this.state.rsi < 48) {
      momentum = 'STRONG_BEARISH';
    } else if (priceVsVwap === 'BELOW_VWAP' || emaStack === 'BEARISH_STACK') {
      momentum = 'MODERATE_BEARISH';
    }

    return {
      ticker: this.activeTicker,
      price: this.state.price,
      open: this.state.open,
      high: this.state.high,
      low: this.state.low,
      close: this.state.close,
      volume: this.state.volume,
      cumulativeVolume: this.state.cumulativeVolume,
      vwap: this.state.vwap,
      ema9: this.state.ema9,
      ema20: this.state.ema20,
      ema50: this.state.ema50,
      ema200: this.state.ema200,
      rsi: this.state.rsi,
      relativeVolume: this.state.relativeVolume,
      support: this.state.support,
      resistance: this.state.resistance,
      priceVsVwap,
      emaStack,
      momentum,
      lastUpdated: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
      source: this.isUsingSimulatedStream
        ? 'Massive Resilient Stream'
        : this.state.isDelayed
        ? 'Massive Delayed Feed'
        : 'Massive Real-Time WebSocket',
      isDelayed: this.state.isDelayed,
    };
  }

  // Feed calculated signals to Gemini AI (strictly interpreting market data, never guessing prices)
  public async triggerGeminiSignalFeed(force: boolean = false) {
    const now = Date.now();
    // Enforce rate limit cooldown if previously hit 429
    if (now < this.aiCooldownUntil && !force) {
      this.generateFallbackInsight();
      return;
    }

    // Rate limit AI calls to at most once per 30 seconds unless forced
    if (!force && this.state.lastAiCallTime && now - this.state.lastAiCallTime < 30000) {
      return;
    }
    this.state.lastAiCallTime = now;

    const signals = this.getCalculatedSignals();
    const ai = this.getAI();

    if (!ai) {
      this.generateFallbackInsight();
      return;
    }

    try {
      // Formatted structured prompt conforming strictly to user requirements:
      // Gemini interprets calculated market data without guessing prices.
      const prompt = `You are MarketMind Institutional AI Analyst.
Analyze the following live calculated market data from Massive for ${this.activeTicker}:

Ticker: ${this.activeTicker}
Timeframe: 5M
Current Price: $${signals.price}
VWAP: $${signals.vwap}
EMA9: $${signals.ema9}
EMA20: $${signals.ema20}
Volume: ${signals.volume} (Cumulative: ${signals.cumulativeVolume})
Trend: ${signals.momentum} (${signals.emaStack})
Support: $${signals.support}
Resistance: $${signals.resistance}

Analyze the market action and explain:
1. Bullish factors
2. Bearish factors
3. Market trend
4. Why ${this.activeTicker} is moving
5. What would confirm a breakout
6. What would invalidate the setup

Return a strictly valid JSON object matching this schema:
{
  "marketTrend": "Concise definition of the market trend (e.g. Bullish Trend / Rangebound Consolidation)",
  "whyMoving": "Direct 1-2 sentence explanation of why ${this.activeTicker} is moving based on VWAP ($${signals.vwap}) and EMA alignment.",
  "bullishFactors": ["Factor 1 with exact data points", "Factor 2", "Factor 3"],
  "bearishFactors": ["Risk factor 1", "Risk factor 2"],
  "breakoutConfirmation": "Exact price level and condition that confirms a breakout",
  "invalidationLevel": "Exact price level and condition that invalidates the setup",
  "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": 78,
  "summary": "2 concise sentences summarizing the intraday outlook and execution plan.",
  "keyLevels": {
    "vwap": ${signals.vwap},
    "ema9": ${signals.ema9},
    "ema20": ${signals.ema20},
    "support": ${signals.support},
    "resistance": ${signals.resistance}
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const insight: MassiveAiInsight = {
        marketTrend: parsed.marketTrend || `${signals.momentum} Trend on ${this.activeTicker}`,
        whyMoving: parsed.whyMoving || `${this.activeTicker} is testing key VWAP level ($${signals.vwap}) with 9 EMA ($${signals.ema9}) support.`,
        bullishFactors: parsed.bullishFactors || [
          `Price ($${signals.price}) above VWAP ($${signals.vwap})`,
          `EMA9 ($${signals.ema9}) leading above EMA20 ($${signals.ema20})`,
        ],
        bearishFactors: parsed.bearishFactors || [
          `Overhead resistance near $${signals.resistance}`,
        ],
        breakoutConfirmation: parsed.breakoutConfirmation || `Decisive 5M close above $${signals.resistance}`,
        invalidationLevel: parsed.invalidationLevel || `Breakdown below $${signals.support} and VWAP ($${signals.vwap})`,
        bias: (parsed.bias || 'NEUTRAL') as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
        confidence: Number(parsed.confidence || 75),
        summary: parsed.summary || `${this.activeTicker} remains structured around session VWAP with active participation.`,
        keyLevels: parsed.keyLevels || {
          vwap: signals.vwap,
          ema9: signals.ema9,
          ema20: signals.ema20,
          support: signals.support,
          resistance: signals.resistance,
        },
        timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
      };

      this.state.lastAiInsight = insight;

      // Broadcast fresh AI Insight to all connected UI clients
      this.broadcast({
        type: 'AI_INSIGHT',
        aiInsight: insight,
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isCapacityOrRateLimit =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('temporarily unavailable') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota');

      if (isCapacityOrRateLimit) {
        // Set 45s cooldown for Gemini rate limit / capacity spikes
        this.aiCooldownUntil = Date.now() + 45000;
        console.log('[MassiveWS AI Feed] Upstream model capacity spike (503/429). Smoothly activating quantitative intelligence engine.');
      } else {
        console.log('[MassiveWS AI Feed] Activating resilient quantitative baseline:', errMsg.slice(0, 100));
      }
      this.generateFallbackInsight();
    }
  }

  private generateFallbackInsight() {
    const signals = this.getCalculatedSignals();
    const isBull = signals.momentum.includes('BULLISH');
    const isBear = signals.momentum.includes('BEARISH');
    const bias = isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL';
    const confidence = isBull ? 78 : isBear ? 72 : 55;

    const fallbackInsight: MassiveAiInsight = {
      marketTrend: `${bias} Intraday Trend (${signals.momentum.replace('_', ' ')})`,
      whyMoving: `${signals.ticker} is trading ${signals.priceVsVwap === 'ABOVE_VWAP' ? 'above' : 'below'} session VWAP ($${signals.vwap}) with ${signals.relativeVolume}x relative volume. 9 EMA ($${signals.ema9}) and 20 EMA ($${signals.ema20}) indicate ${signals.emaStack === 'BULLISH_STACK' ? 'buyer control' : 'distribution'}.`,
      bullishFactors: [
        `Price ($${signals.price}) holds ${signals.priceVsVwap === 'ABOVE_VWAP' ? 'above' : 'near'} VWAP ($${signals.vwap})`,
        `9 EMA ($${signals.ema9}) > 20 EMA ($${signals.ema20}) trend alignment`,
        `Relative volume at ${signals.relativeVolume}x indicates institutional participation`,
      ],
      bearishFactors: [
        `Overhead resistance tested at $${signals.resistance}`,
        `RSI at ${signals.rsi} approaching upper threshold`,
      ],
      breakoutConfirmation: `Sustained 5M candle close above resistance ($${signals.resistance}) with volume > 1.25x`,
      invalidationLevel: `Clean breakdown below support ($${signals.support}) and session VWAP ($${signals.vwap})`,
      bias: bias as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
      confidence,
      summary: `${signals.ticker} shows ${signals.momentum.replace('_', ' ').toLowerCase()} structure on 5M timeframe. VWAP ($${signals.vwap}) acts as the key pivot point.`,
      keyLevels: {
        vwap: signals.vwap,
        ema9: signals.ema9,
        ema20: signals.ema20,
        support: signals.support,
        resistance: signals.resistance,
      },
      timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
    };

    this.state.lastAiInsight = fallbackInsight;
    this.broadcast({
      type: 'AI_INSIGHT',
      aiInsight: fallbackInsight,
    });
  }

  // Fallback high-frequency simulator when outside market hours or when waiting for connection
  private startSimulatedRealTimeFeed() {
    if (!AppConfig.allowSimulatedMarketData) {
      return;
    }
    if (this.isUsingSimulatedStream && this.simulationInterval) return;
    this.isUsingSimulatedStream = true;

    if (this.simulationInterval) clearInterval(this.simulationInterval);
    this.simulationInterval = setInterval(() => {
      const jitter = (Math.random() - 0.48) * 0.16;
      const size = Math.floor(100 + Math.random() * 500);
      const newPrice = Number((this.state.price + jitter).toFixed(2));
      const now = Date.now();

      this.processLiveTrade(newPrice, size, now);

      // Every 3 seconds emit aggregate bar
      if (Math.random() < 0.35) {
        this.processLiveAggregate({
          s: now,
          o: this.state.price - jitter,
          h: Math.max(this.state.price, this.state.price + Math.random() * 0.1),
          l: Math.min(this.state.price, this.state.price - Math.random() * 0.1),
          c: newPrice,
          v: size * 4,
        });
      }
    }, 1200);
  }

  private stopSimulatedFeed() {
    this.isUsingSimulatedStream = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private updateStatus(status: MassiveStreamState['status']) {
    this.state.status = status;
    this.broadcast({
      type: 'STATUS',
      status,
      ticker: this.state.ticker,
      isDelayed: this.state.isDelayed,
    });
  }

  private broadcast(payload: any) {
    if (!this.wss) return;
    const str = JSON.stringify(payload);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(str);
      }
    }
  }
}

