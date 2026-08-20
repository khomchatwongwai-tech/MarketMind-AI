export type ChartTimeframe =
  | '1m'
  | '2m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '4h'
  | '1d'
  | '1w';

export type MarketSession = 'PRE' | 'REGULAR' | 'POST';

export interface ChartCandle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  session?: MarketSession;
  vwap?: number;
  isHighVolume?: boolean;
}

export interface IndicatorSettings {
  vwap: boolean;
  ema9: boolean;
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  sma20: boolean;
  sma50: boolean;
  sma200: boolean;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
  volume: boolean;
  supportResistance: boolean;
}

export interface ChartLevels {
  pivot?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  s1?: number;
  s2?: number;
  s3?: number;
  pdh?: number;
  pdl?: number;
  pdc?: number;
  pmh?: number;
  pml?: number;
  orh?: number;
  orl?: number;
  vwap?: number;
}

export interface MarketStructureInfo {
  timeframe: string;
  trend: 'Uptrend' | 'Downtrend' | 'Sideways' | 'Consolidation' | 'Breakout' | 'Breakdown' | 'Unavailable';
  structure: 'Higher highs / higher lows' | 'Lower highs / lower lows' | 'Consolidation' | 'Breakout' | 'Breakdown' | 'Possible Reversal' | 'Unavailable';
  priceVsVwap: 'Above' | 'Below' | 'Crossing/Choppy' | 'Unavailable';
  vwapConditionText: string;
  momentum: 'Strong' | 'Moderate' | 'Weak' | 'Overextended' | 'Unavailable';
  volumeCondition: 'Above Average' | 'Normal' | 'Below Average' | 'Spike' | 'Unavailable';
  relativeVolume: number | null;
  multiTimeframeAlignment: Array<{
    timeframe: string;
    bias: 'Bullish' | 'Bearish' | 'Neutral';
    score: number;
  }>;
  overallAlignmentScore: number | null;
  overallBias: 'Bullish' | 'Bearish' | 'Neutral' | 'Unavailable';
}

export interface BreakoutAlert {
  id: string;
  timestamp: number;
  timeStr: string;
  type:
    | 'BREAKOUT_RESISTANCE'
    | 'BREAKDOWN_SUPPORT'
    | 'VWAP_RECLAIM'
    | 'VWAP_LOSS'
    | 'PDH_BREAKOUT'
    | 'PDL_BREAKDOWN'
    | 'OR_BREAKOUT'
    | 'OR_BREAKDOWN'
    | 'VOLUME_SPIKE'
    | 'HIGHER_HIGH'
    | 'LOWER_LOW';
  title: string;
  message: string;
  price: number;
  severity: 'BULLISH' | 'BEARISH' | 'WARNING';
}

export interface AIChartAnalysisResult {
  currentTrend: string;
  bullishSignals: string[];
  bearishSignals: string[];
  importantSupport: string[];
  importantResistance: string[];
  breakoutLevel: string;
  breakdownLevel: string;
  momentum: string;
  volumeConfirmation: string;
  risk: string;
  aiExplanation: string;
  timestamp: string;
  source?: string;
}
