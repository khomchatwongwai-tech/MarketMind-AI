import { MarketQuote } from './market';

export type AssetClass =
  | 'STOCK'
  | 'ETF'
  | 'INDEX'
  | 'CRYPTO'
  | 'TREASURY'
  | 'COMMODITY'
  | 'OPTION';

export type ChartInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface HistoricalBar {
  timestamp: number; // Unix epoch ms
  timeString?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface MarketStatusInfo {
  status: 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED';
  sessionName: string;
  isOpen: boolean;
  nextOpen?: string;
  nextClose?: string;
  serverTimeET: string;
}

export interface OptionContractQuote {
  contractSymbol: string;
  strike: number;
  expiration: string;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  inTheMoney: boolean;
}

export interface OptionsChainData {
  ticker: string;
  underlyingPrice: number;
  expirations: string[];
  calls: OptionContractQuote[];
  puts: OptionContractQuote[];
  putCallRatio: number;
  totalCallVolume: number;
  totalPutVolume: number;
  totalCallOpenInterest: number;
  totalPutOpenInterest: number;
  impliedVolatilityRank: number; // 0-100
  historicalVolatility: number;
}

export type WebSocketConnectionState = 'LIVE' | 'RECONNECTING' | 'DELAYED' | 'OFFLINE';

export interface WebSocketMetrics {
  state: WebSocketConnectionState;
  latencyMs: number;
  reconnectAttempts: number;
  subscribedSymbols: string[];
  lastMessageTimestamp: number;
  messagesPerSecond: number;
}

export interface MarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedAssetClasses: AssetClass[];
  
  getQuote(symbol: string): Promise<MarketQuote>;
  getHistoricalBars(
    symbol: string,
    interval: ChartInterval,
    limit?: number
  ): Promise<HistoricalBar[]>;
  getMarketStatus(): Promise<MarketStatusInfo>;
  getOptionsChain(symbol: string): Promise<OptionsChainData>;
  
  subscribeToQuotes(
    symbols: string[],
    callback: (quote: MarketQuote) => void
  ): void;
  unsubscribeFromQuotes(symbols: string[]): void;
  
  getHealth(): Promise<{
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    latencyMs: number;
  }>;
}

export interface MarketMindScoreBreakdown {
  score: number; // 0 - 100
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: 'LOW' | 'MEDIUM' | 'MEDIUM_HIGH' | 'HIGH' | 'EXCEPTIONAL';
  momentum: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'NEUTRAL' | 'MODERATE_BEARISH' | 'STRONG_BEARISH';
  technicalStructure: string;
  newsSentiment: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE';
  volumeConfirmation: 'STRONG' | 'MODERATE' | 'WEAK' | 'DIVERGENT';
  macroRisk: 'LOW' | 'MEDIUM' | 'ELEVATED' | 'HIGH';
  disclaimer: string;
  factors: {
    trendScore: number; // 0-100
    momentumScore: number; // 0-100
    rsiScore: number; // 0-100
    macdScore: number; // 0-100
    movingAverageScore: number; // 0-100
    vwapScore: number; // 0-100
    relativeVolumeScore: number; // 0-100
    volatilityScore: number; // 0-100
    supportResistanceScore: number; // 0-100
    newsSentimentScore: number; // 0-100
    sectorStrengthScore: number; // 0-100
    marketBreadthScore: number; // 0-100
    macroEnvironmentScore: number; // 0-100
    optionsActivityScore: number; // 0-100
  };
}
