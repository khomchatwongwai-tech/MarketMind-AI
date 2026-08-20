// Massive WebSocket types and event definitions
export type MassiveWsStatus =
  | 'LIVE'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'DELAYED DATA'
  | 'CONNECTING'
  | 'AUTHENTICATING'
  | 'ERROR';

export interface MassiveTradeEvent {
  ev: 'T';
  sym: string;
  p: number; // trade price
  s: number; // trade size / volume
  t: number; // timestamp ms
  c?: number[]; // conditions
  z?: number; // tape
}

export interface MassiveAggregateEvent {
  ev: 'AM' | 'A'; // AM = aggregate minute, A = aggregate second
  sym: string;
  v: number; // volume
  av?: number; // accumulated volume
  op?: number; // official open price
  vw?: number; // vwap
  o: number; // open
  c: number; // close
  h: number; // high
  l: number; // low
  a?: number; // average price
  s: number; // start timestamp ms
  e: number; // end timestamp ms
}

export interface CalculatedMarketSignals {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  cumulativeVolume: number;
  vwap: number;
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  relativeVolume: number;
  support: number;
  resistance: number;
  priceVsVwap: 'ABOVE_VWAP' | 'BELOW_VWAP' | 'AT_VWAP';
  emaStack: 'BULLISH_STACK' | 'BEARISH_STACK' | 'MIXED';
  momentum: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'NEUTRAL' | 'MODERATE_BEARISH' | 'STRONG_BEARISH';
  lastUpdated: string;
  source: string;
  isDelayed?: boolean;
}

export interface MassiveAiInsight {
  marketTrend: string;
  whyMoving: string;
  bullishFactors: string[];
  bearishFactors: string[];
  breakoutConfirmation: string;
  invalidationLevel: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE';
  confidence: number;
  summary: string;
  keyLevels: {
    vwap: number | null;
    ema9: number | null;
    ema20: number | null;
    support: number | null;
    resistance: number | null;
  };
  timestamp: string;
  provenance?: {
    status: 'SUCCESS' | 'UNAVAILABLE' | 'INSUFFICIENT_DATA';
    fieldsUsed: string[];
    sourcesUsed: string[];
    generatedAt: string;
    confidence: number;
    omittedFields: string[];
  };
}

export interface MassiveWsClientMessage {
  type: 'STATUS' | 'TRADE' | 'AGGREGATE' | 'SIGNALS' | 'AI_INSIGHT' | 'ERROR';
  status?: MassiveWsStatus;
  ticker?: string;
  isDelayed?: boolean;
  trade?: {
    price: number;
    size: number;
    time: number;
    formattedTime: string;
  };
  aggregate?: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap: number;
  };
  signals?: CalculatedMarketSignals;
  aiInsight?: MassiveAiInsight;
  error?: string;
}
