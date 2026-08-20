export type TickerSymbol =
  | 'SPY'
  | 'QQQ'
  | 'NVDA'
  | 'TSLA'
  | 'AAPL'
  | 'MSFT'
  | 'AMZN'
  | 'META'
  | 'AMD'
  | 'IWM'
  | (string & {});

export type MarketDataMode =
  | 'REAL_TIME'
  | 'LIVE'
  | 'DELAYED'
  | 'CACHED'
  | 'UNKNOWN'
  | 'DEMO'
  | 'SIMULATED'
  | 'UNAVAILABLE';

export interface MarketDataMetadata {
  provider: string;
  source: string;
  timestamp: number;
  receivedAt: number;
  mode: MarketDataMode;
  delayMinutes?: number;
  stale: boolean;
  marketStatus?: 'PRE' | 'OPEN' | 'AFTER' | 'CLOSED';
  outlierFlag?: boolean;
  validationStatus?: 'VALID' | 'SUSPECT_DATA' | 'MALFORMED' | 'UNAVAILABLE';
  liveStatus?: 'live' | 'delayed' | 'unknown';
  sourceType?: string;
  entitlementStatus?: string;
}

export type LiveMarketDataSource =
  | 'Massive WebSocket (Real-Time Live Feed)'
  | 'Massive / Polygon.io'
  | 'Finnhub Institutional'
  | 'Alpaca Market Data v2'
  | 'CME Group Direct'
  | 'FRED Economic Data'
  | 'Yahoo Finance'
  | 'Google Finance Feed'
  | 'Robinhood Multi-Feed';

export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type RiskLevel = 'LOWER RISK' | 'MODERATE RISK' | 'HIGHER RISK' | 'EXTREME RISK';
export type SetupQuality =
  | 'Exceptional setup'
  | 'Strong setup'
  | 'Good setup'
  | 'Moderate setup'
  | 'NO TRADE / WAIT FOR CONFIRMATION';

export interface MarketQuote {
  ticker: TickerSymbol;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  openPrice: number;
  previousClose: number;
  preMarketPrice: number;
  preMarketChangePercent: number;
  afterHoursPrice?: number;
  afterHoursChangePercent?: number;
  volume: number;
  avgVolume: number;
  relativeVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  timestamp: string;
  marketStatus: 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED';
  dataStatus?: 'LIVE' | 'REAL_TIME' | 'DELAYED' | 'DEMO' | 'SIMULATED' | 'FALLBACK' | 'UNAVAILABLE' | 'CACHED';
  dataSource?: string;
  latencyMs?: number;
  currency?: string;
  exchange?: string;
  bid?: number;
  ask?: number;
  metadata?: MarketDataMetadata;
}

export interface TechnicalIndicators {
  vwap: number;
  rsi14: number;
  rsiStatus: 'Oversold' | 'Neutral' | 'Overbought';
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  macdTrend: 'Bullish Crossover' | 'Bearish Crossover' | 'Neutral';
  ema9: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  sma20: number;
  sma50: number;
  sma200: number;
  atr14: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  bollingerBandwidth: number;
  momentum: number;
  rateOfChange: number;
  adx: number;
  adxStrength: 'Weak' | 'Moderate' | 'Strong';
  stochRsiK: number;
  stochRsiD: number;
  prevDayHigh: number;
  prevDayLow: number;
  prevDayClose: number;
  preMarketHigh: number;
  preMarketLow: number;
  openingRangeHigh: number;
  openingRangeLow: number;
}

export interface SupportResistanceLevels {
  pivot?: number;
  r3: number;
  r2: number;
  r1: number;
  current: number;
  s1: number;
  s2: number;
  s3: number;
  keyResistance: number;
  keySupport: number;
  breakoutStatus: string;
  breakoutType: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKDOWN' | 'TESTING_RESISTANCE' | 'TESTING_SUPPORT' | 'CONSOLIDATING';
}

export type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | 'Daily' | 'Weekly';

export interface TrendTimeframe {
  timeframe: Timeframe;
  trend: MarketBias;
  strength: number; // 0 - 100
  keyCondition: string;
}

export interface MarketBreadth {
  sp500Adv: number;
  sp500Dec: number;
  sp500AdvDecRatio: number;
  nasdaqAdv: number;
  nasdaqDec: number;
  nyseAdv: number;
  nyseDec: number;
  pctAbove20SMA: number;
  pctAbove50SMA: number;
  pctAbove200SMA: number;
  newHighs: number;
  newLows: number;
  upVolumeRatio: number; // 0 - 100%
  breadthScore: number; // 0 - 100
  breadthStatus: 'Strong Breadth' | 'Moderate Breadth' | 'Weak Breadth' | 'Bearish Breadth';
}

export interface IntermarketAsset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  correlationWithSPY: number; // -1.0 to 1.0
  impactOnSPY: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  notes: string;
}

export interface SectorData {
  symbol: string;
  name: string;
  changePercent: number;
  weight: number; // % in SPY
  sentiment: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  volumeRelative: number;
}

export interface OptionsData {
  callVolume: number;
  putVolume: number;
  totalVolume: number;
  putCallRatio: number;
  totalOpenInterest: number;
  impliedVolatility: number;
  ivPercentile: number;
  ivRank: number;
  expectedDailyMove: {
    low: number;
    high: number;
    rangePoints: number;
  };
  largestCallOIStrike: number;
  largestPutOIStrike: number;
  gammaResistance: number;
  gammaSupport: number;
  sentiment: 'Bullish' | 'Slightly Bullish' | 'Neutral' | 'Slightly Bearish' | 'Bearish';
  hedgingContext: string;
  unusualSweeps: {
    type: 'CALL' | 'PUT';
    strike: number;
    exp: string;
    premium: string;
    action: string;
    sentiment: MarketBias;
  }[];
}

export interface EconomicEvent {
  id: string;
  time: string;
  event: string;
  importance: 'Low' | 'Medium' | 'High' | 'Extreme';
  previous: string;
  consensus: string;
  actual?: string;
  marketImpact: string;
  isApproachingHighVol: boolean;
}

export interface NewsItem {
  id: string;
  ticker: string;
  headline: string;
  source: string;
  publishedTime: string;
  sentiment: MarketBias;
  impactScore: number; // 1 to 10
  sectorsAffected: string[];
  potentialSPYImpact: string;
  aiExplanation: string;
  url?: string;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'UNKNOWN';
}

export type MarketNewsItem = NewsItem;

export interface FedDashboard {
  targetRange: string;
  nextMeetingDate: string;
  daysUntilMeeting: number;
  cutProbability: number;
  holdProbability: number;
  hikeProbability: number;
  recentCommentary: string;
  hawkishDovishStance: 'Dovish' | 'Neutral-Dovish' | 'Neutral' | 'Hawkish-Leaning' | 'Aggressive Hawkish';
  fedSentimentScore: number; // 0 (Dovish) to 100 (Hawkish)
  treasury10Y: number;
  treasury2Y: number;
  yieldCurveInversion: number;
}

export interface ScenarioPlan {
  probability: number;
  confirmationPrice: number;
  target1: number;
  target2: number;
  target3: number;
  invalidationLevel: number;
  requiredVolume: string;
  reasoning: string;
}

export interface Probabilities {
  bullish: number;
  bearish: number;
  neutral: number;
  aiConfidence: number; // 0 - 100
  setupScore: number; // 0 - 100
  setupQuality: SetupQuality;
  riskLevel: RiskLevel;
  primaryDriver: string;
  secondaryDriver: string;
  mainRisk: string;
  bullishConfirmation: string;
  bearishInvalidation: string;
  aiSummary: string;
}

export interface PredictionRecord {
  id: string;
  date?: string;
  time?: string;
  timestamp?: string;
  ticker: TickerSymbol | string;
  tickerPrice?: number;
  timeframe?: string;
  direction?: MarketBias;
  predictedBias?: MarketBias | string;
  bullishProb?: number;
  bearishProb?: number;
  neutralProb?: number;
  statedProbability?: number;
  confidence?: number;
  technicalScore?: number;
  newsScore?: number;
  optionsScore?: number;
  horizon?: '15m' | '30m' | '1h' | 'Rest of Day' | 'Next Day' | '5 Days' | string;
  targetPrice?: number;
  targetLevel?: number;
  invalidationLevel?: number;
  actualPrice?: number;
  actualOutcome?: string;
  status?: 'PENDING' | 'CORRECT' | 'INCORRECT';
  result?: 'CORRECT' | 'INCORRECT' | 'PENDING';
  returnPercent?: number;
}

export interface BacktestMetrics {
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  accuracy: number;
  bullishAccuracy: number;
  bearishAccuracy: number;
  neutralAccuracy: number;
  fifteenMinAccuracy: number;
  oneHourAccuracy: number;
  dailyAccuracy: number;
  weeklyAccuracy: number;
  avgPredictedProbability: number;
  actualSuccessRate: number;
  calibrationAdjustment: number;
}

export interface MarketAlert {
  id: string;
  time: string;
  ticker: string;
  type: 'RESISTANCE_BREAK' | 'SUPPORT_BREAK' | 'VWAP_CROSS' | 'VWAP_LOSS' | 'OPTIONS_SWEEP' | 'VIX_SPIKE' | 'HIGH_VOL_NEWS' | 'PROB_SHIFT';
  title: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  read: boolean;
}

export interface MLFeatureRow {
  timestamp: string;
  ticker: string;
  price: number;
  rsi: number;
  macd: number;
  vwapDistancePct: number;
  volume: number;
  relativeVolume: number;
  vix: number;
  yield10Y: number;
  qqqPerformancePct: number;
  iwmPerformancePct: number;
  leadSectorScore: number;
  optionsPutCall: number;
  newsSentimentScore: number;
  gapPct: number;
  marketBreadthScore: number;
  return15m?: number;
  return30m?: number;
  return1h?: number;
  return4h?: number;
  return1d?: number;
  return5d?: number;
}
