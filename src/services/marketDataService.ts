import {
  BacktestMetrics,
  EconomicEvent,
  FedDashboard,
  IntermarketAsset,
  MarketAlert,
  MarketBreadth,
  MarketQuote,
  MLFeatureRow,
  NewsItem,
  OptionsData,
  PredictionRecord,
  Probabilities,
  ScenarioPlan,
  SectorData,
  SupportResistanceLevels,
  TechnicalIndicators,
  TickerSymbol,
  TrendTimeframe,
} from '../types/market.js';
import { calculateWeightedProbability, FactorScores, FactorWeights } from './probabilityEngine.js';
import { AppConfig } from '../config/environment.js';

export interface ComprehensiveMarketData {
  quote: MarketQuote;
  technicals: TechnicalIndicators;
  supportResistance: SupportResistanceLevels;
  trends: TrendTimeframe[];
  trendAlignmentScore: number; // e.g. 78% Bullish
  breadth: MarketBreadth;
  intermarket: IntermarketAsset[];
  sectors: SectorData[];
  strongestSector: SectorData;
  weakestSector: SectorData;
  options: OptionsData;
  economicEvents: EconomicEvent[];
  news: NewsItem[];
  fed: FedDashboard;
  scenarios: {
    bullish: ScenarioPlan;
    bearish: ScenarioPlan;
    neutral: ScenarioPlan;
  };
  predictions: PredictionRecord[];
  backtest: BacktestMetrics;
  alerts: MarketAlert[];
  mlFeatures: MLFeatureRow[];
  factorScores: FactorScores;
  probabilities: Probabilities;
}

// Initial Base Quotes for Tickers
const TICKER_DEFAULTS: Record<TickerSymbol, { name: string; basePrice: number; prevClose: number }> = {
  SPY: { name: 'SPDR S&P 500 ETF Trust', basePrice: 512.48, prevClose: 508.28 },
  QQQ: { name: 'Invesco QQQ Trust (Nasdaq 100)', basePrice: 442.35, prevClose: 438.10 },
  NVDA: { name: 'NVIDIA Corporation', basePrice: 128.60, prevClose: 124.90 },
  TSLA: { name: 'Tesla, Inc.', basePrice: 218.40, prevClose: 212.80 },
  AAPL: { name: 'Apple Inc.', basePrice: 224.20, prevClose: 221.50 },
  MSFT: { name: 'Microsoft Corporation', basePrice: 428.90, prevClose: 425.10 },
  AMZN: { name: 'Amazon.com, Inc.', basePrice: 186.75, prevClose: 184.20 },
  META: { name: 'Meta Platforms, Inc.', basePrice: 514.30, prevClose: 506.80 },
  AMD: { name: 'Advanced Micro Devices, Inc.', basePrice: 154.20, prevClose: 150.80 },
  IWM: { name: 'iShares Russell 2000 ETF', basePrice: 214.80, prevClose: 212.10 },
};

export function generateEmptyMarketData(ticker: TickerSymbol = 'SPY'): ComprehensiveMarketData {
  const meta = TICKER_DEFAULTS[ticker] || TICKER_DEFAULTS.SPY;
  const unavailable = null as any;

  const technicals: TechnicalIndicators = {
    vwap: unavailable,
    rsi14: unavailable,
    rsiStatus: 'DATA UNAVAILABLE' as any,
    macd: unavailable,
    macdSignal: unavailable,
    macdHistogram: unavailable,
    macdTrend: 'DATA UNAVAILABLE' as any,
    ema9: unavailable,
    ema20: unavailable,
    ema50: unavailable,
    ema100: unavailable,
    ema200: unavailable,
    sma20: unavailable,
    sma50: unavailable,
    sma200: unavailable,
    atr14: unavailable,
    bollingerUpper: unavailable,
    bollingerMiddle: unavailable,
    bollingerLower: unavailable,
    bollingerBandwidth: unavailable,
    momentum: unavailable,
    rateOfChange: unavailable,
    adx: unavailable,
    adxStrength: 'DATA UNAVAILABLE' as any,
    stochRsiK: unavailable,
    stochRsiD: unavailable,
    prevDayHigh: unavailable,
    prevDayLow: unavailable,
    prevDayClose: unavailable,
    preMarketHigh: unavailable,
    preMarketLow: unavailable,
    openingRangeHigh: unavailable,
    openingRangeLow: unavailable,
  };

  const supportResistance: SupportResistanceLevels = {
    current: unavailable,
    pivot: unavailable,
    r1: unavailable,
    r2: unavailable,
    r3: unavailable,
    s1: unavailable,
    s2: unavailable,
    s3: unavailable,
    keyResistance: unavailable,
    keySupport: unavailable,
    breakoutStatus: 'DATA UNAVAILABLE',
    breakoutType: 'CONSOLIDATING',
  };

  const quote: MarketQuote = {
    ticker,
    name: meta.name,
    price: unavailable,
    change: unavailable,
    changePercent: unavailable,
    dayHigh: unavailable,
    dayLow: unavailable,
    openPrice: unavailable,
    previousClose: unavailable,
    preMarketPrice: unavailable,
    preMarketChangePercent: unavailable,
    afterHoursPrice: unavailable,
    afterHoursChangePercent: unavailable,
    volume: unavailable,
    avgVolume: unavailable,
    relativeVolume: unavailable,
    fiftyTwoWeekHigh: unavailable,
    fiftyTwoWeekLow: unavailable,
    timestamp: new Date().toISOString(),
    marketStatus: 'LIVE DATA UNAVAILABLE' as any,
    dataStatus: 'UNAVAILABLE',
    dataSource: 'DATA UNAVAILABLE',
  };

  const factorScores: FactorScores = {
    technicals: unavailable,
    priceAction: unavailable,
    marketBreadth: unavailable,
    optionsSentiment: unavailable,
    macroEconomics: unavailable,
    newsSentiment: unavailable,
    intermarket: unavailable,
  };

  const probabilities: Probabilities = {
    bullish: unavailable,
    bearish: unavailable,
    neutral: unavailable,
    aiConfidence: unavailable,
    setupScore: unavailable,
    setupQuality: 'DATA UNAVAILABLE' as any,
    riskLevel: 'DATA UNAVAILABLE' as any,
    primaryDriver: 'DATA UNAVAILABLE',
    secondaryDriver: 'DATA UNAVAILABLE',
    mainRisk: 'Verified market data is unavailable.',
    bullishConfirmation: 'DATA UNAVAILABLE',
    bearishInvalidation: 'DATA UNAVAILABLE',
    aiSummary: 'Verified market data is unavailable.',
  };

  const unavailableSector: SectorData = { symbol: 'N/A', name: 'DATA UNAVAILABLE', changePercent: unavailable, weight: unavailable, sentiment: 'Neutral', volumeRelative: unavailable };

  return {
    quote,
    technicals,
    supportResistance,
    trends: [],
    trendAlignmentScore: unavailable,
    breadth: { sp500Adv: unavailable, sp500Dec: unavailable, sp500AdvDecRatio: unavailable, nasdaqAdv: unavailable, nasdaqDec: unavailable, nyseAdv: unavailable, nyseDec: unavailable, pctAbove20SMA: unavailable, pctAbove50SMA: unavailable, pctAbove200SMA: unavailable, newHighs: unavailable, newLows: unavailable, upVolumeRatio: unavailable, breadthScore: unavailable, breadthStatus: 'DATA UNAVAILABLE' as any },
    intermarket: [],
    sectors: [],
    strongestSector: unavailableSector,
    weakestSector: unavailableSector,
    options: { callVolume: unavailable, putVolume: unavailable, totalVolume: unavailable, putCallRatio: unavailable, totalOpenInterest: unavailable, impliedVolatility: unavailable, ivPercentile: unavailable, ivRank: unavailable, expectedDailyMove: { low: unavailable, high: unavailable, rangePoints: unavailable }, largestCallOIStrike: unavailable, largestPutOIStrike: unavailable, gammaResistance: unavailable, gammaSupport: unavailable, sentiment: 'Neutral', hedgingContext: 'DATA UNAVAILABLE', unusualSweeps: [] },
    economicEvents: [],
    news: [],
    fed: { targetRange: 'DATA UNAVAILABLE', nextMeetingDate: 'DATA UNAVAILABLE', daysUntilMeeting: unavailable, cutProbability: unavailable, holdProbability: unavailable, hikeProbability: unavailable, recentCommentary: 'DATA UNAVAILABLE', hawkishDovishStance: 'Neutral', fedSentimentScore: unavailable, treasury10Y: unavailable, treasury2Y: unavailable, yieldCurveInversion: unavailable },
    scenarios: { bullish: { probability: unavailable, confirmationPrice: unavailable, target1: unavailable, target2: unavailable, target3: unavailable, invalidationLevel: unavailable, requiredVolume: 'DATA UNAVAILABLE', reasoning: 'DATA UNAVAILABLE' }, bearish: { probability: unavailable, confirmationPrice: unavailable, target1: unavailable, target2: unavailable, target3: unavailable, invalidationLevel: unavailable, requiredVolume: 'DATA UNAVAILABLE', reasoning: 'DATA UNAVAILABLE' }, neutral: { probability: unavailable, confirmationPrice: unavailable, target1: unavailable, target2: unavailable, target3: unavailable, invalidationLevel: unavailable, requiredVolume: 'DATA UNAVAILABLE', reasoning: 'DATA UNAVAILABLE' } },
    predictions: [],
    backtest: { totalPredictions: unavailable, correctPredictions: unavailable, incorrectPredictions: unavailable, accuracy: unavailable, bullishAccuracy: unavailable, bearishAccuracy: unavailable, neutralAccuracy: unavailable, fifteenMinAccuracy: unavailable, oneHourAccuracy: unavailable, dailyAccuracy: unavailable, weeklyAccuracy: unavailable, avgPredictedProbability: unavailable, actualSuccessRate: unavailable, calibrationAdjustment: unavailable },
    alerts: [],
    mlFeatures: [],
    factorScores,
    probabilities,
  };
}

export function generateMarketData(
  ticker: TickerSymbol = 'SPY',
  priceDeltaPercent: number = 0,
  factorWeights?: FactorWeights
): ComprehensiveMarketData {
  if (!AppConfig.allowSimulatedMarketData) {
    return generateEmptyMarketData(ticker);
  }
  const meta = TICKER_DEFAULTS[ticker] || TICKER_DEFAULTS.SPY;
  const currentPrice = Number((meta.basePrice * (1 + priceDeltaPercent / 100)).toFixed(2));
  const change = Number((currentPrice - meta.prevClose).toFixed(2));
  const changePercent = Number(((change / meta.prevClose) * 100).toFixed(2));

  const dayHigh = Number((Math.max(currentPrice, meta.basePrice * 1.008)).toFixed(2));
  const dayLow = Number((Math.min(currentPrice, meta.basePrice * 0.992)).toFixed(2));
  const vwap = Number((meta.prevClose * 1.0035).toFixed(2));
  const rsi = Number(Math.min(88, Math.max(18, 50 + changePercent * 12)).toFixed(1));

  // Technical Indicators
  const technicals: TechnicalIndicators = {
    vwap,
    rsi14: rsi,
    rsiStatus: rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral',
    macd: Number((0.45 + changePercent * 0.3).toFixed(2)),
    macdSignal: 0.22,
    macdHistogram: Number((0.23 + changePercent * 0.2).toFixed(2)),
    macdTrend: changePercent >= 0 ? 'Bullish Crossover' : 'Bearish Crossover',
    ema9: Number((currentPrice * 0.998).toFixed(2)),
    ema20: Number((currentPrice * 0.994).toFixed(2)),
    ema50: Number((currentPrice * 0.988).toFixed(2)),
    ema100: Number((currentPrice * 0.975).toFixed(2)),
    ema200: Number((currentPrice * 0.952).toFixed(2)),
    sma20: Number((currentPrice * 0.993).toFixed(2)),
    sma50: Number((currentPrice * 0.986).toFixed(2)),
    sma200: Number((currentPrice * 0.950).toFixed(2)),
    atr14: Number((currentPrice * 0.008).toFixed(2)),
    bollingerUpper: Number((currentPrice * 1.012).toFixed(2)),
    bollingerMiddle: Number((currentPrice * 0.995).toFixed(2)),
    bollingerLower: Number((currentPrice * 0.978).toFixed(2)),
    bollingerBandwidth: 3.4,
    momentum: Number((change * 1.2).toFixed(2)),
    rateOfChange: changePercent,
    adx: 24.8,
    adxStrength: 'Moderate',
    stochRsiK: Number(Math.min(99, Math.max(1, rsi * 1.1)).toFixed(1)),
    stochRsiD: Number(Math.min(99, Math.max(1, rsi * 0.95)).toFixed(1)),
    prevDayHigh: Number((meta.prevClose * 1.006).toFixed(2)),
    prevDayLow: Number((meta.prevClose * 0.991).toFixed(2)),
    prevDayClose: meta.prevClose,
    preMarketHigh: Number((meta.basePrice * 1.004).toFixed(2)),
    preMarketLow: Number((meta.basePrice * 0.996).toFixed(2)),
    openingRangeHigh: Number((meta.basePrice * 1.005).toFixed(2)),
    openingRangeLow: Number((meta.basePrice * 0.994).toFixed(2)),
  };

  // Support & Resistance (Pivot Calculation)
  const pivot = (technicals.prevDayHigh + technicals.prevDayLow + technicals.prevDayClose) / 3;
  const r1 = Number((2 * pivot - technicals.prevDayLow).toFixed(2));
  const s1 = Number((2 * pivot - technicals.prevDayHigh).toFixed(2));
  const r2 = Number((pivot + (technicals.prevDayHigh - technicals.prevDayLow)).toFixed(2));
  const s2 = Number((pivot - (technicals.prevDayHigh - technicals.prevDayLow)).toFixed(2));
  const r3 = Number((technicals.prevDayHigh + 2 * (pivot - technicals.prevDayLow)).toFixed(2));
  const s3 = Number((technicals.prevDayLow - 2 * (technicals.prevDayHigh - pivot)).toFixed(2));

  let breakoutStatus = 'SPY is testing resistance near R1.';
  let breakoutType: SupportResistanceLevels['breakoutType'] = 'TESTING_RESISTANCE';
  if (currentPrice > r1) {
    breakoutStatus = `${ticker} broke above R1 resistance ($${r1}) with active momentum.`;
    breakoutType = 'BULLISH_BREAKOUT';
  } else if (currentPrice < s1) {
    breakoutStatus = `${ticker} broke below S1 support ($${s1}) under distribution.`;
    breakoutType = 'BEARISH_BREAKDOWN';
  } else if (currentPrice >= vwap) {
    breakoutStatus = `${ticker} is maintaining intraday support above VWAP ($${vwap}).`;
    breakoutType = 'CONSOLIDATING';
  }

  const supportResistance: SupportResistanceLevels = {
    r3,
    r2,
    r1,
    current: currentPrice,
    s1,
    s2,
    s3,
    keyResistance: r1,
    keySupport: s1,
    breakoutStatus,
    breakoutType,
  };

  // Multi-Timeframe Trend Engine
  const trends: TrendTimeframe[] = [
    { timeframe: '1M', trend: changePercent >= 0 ? 'BULLISH' : 'BEARISH', strength: 75, keyCondition: 'Above Micro-VWAP' },
    { timeframe: '5M', trend: currentPrice > technicals.ema9 ? 'BULLISH' : 'BEARISH', strength: 80, keyCondition: '9 EMA Expansion' },
    { timeframe: '15M', trend: currentPrice > technicals.ema20 ? 'BULLISH' : 'NEUTRAL', strength: 78, keyCondition: 'Holding 20 EMA' },
    { timeframe: '30M', trend: currentPrice > vwap ? 'BULLISH' : 'NEUTRAL', strength: 70, keyCondition: 'VWAP Baseline Support' },
    { timeframe: '1H', trend: changePercent > 0.3 ? 'BULLISH' : 'NEUTRAL', strength: 65, keyCondition: 'Ascending Channel' },
    { timeframe: '4H', trend: 'BULLISH', strength: 82, keyCondition: 'Above 50 EMA Support' },
    { timeframe: 'Daily', trend: 'BULLISH', strength: 88, keyCondition: 'Golden Cross Regime (50/200 SMA)' },
    { timeframe: 'Weekly', trend: 'BULLISH', strength: 85, keyCondition: 'Primary Structural Uptrend' },
  ];

  const bullishCount = trends.filter((t) => t.trend === 'BULLISH').length;
  const trendAlignmentScore = Math.round((bullishCount / trends.length) * 100);

  // Market Breadth
  const breadth: MarketBreadth = {
    sp500Adv: 342,
    sp500Dec: 158,
    sp500AdvDecRatio: 2.16,
    nasdaqAdv: 2680,
    nasdaqDec: 1520,
    nyseAdv: 1950,
    nyseDec: 980,
    pctAbove20SMA: 72.4,
    pctAbove50SMA: 68.1,
    pctAbove200SMA: 64.5,
    newHighs: 142,
    newLows: 18,
    upVolumeRatio: 74.2,
    breadthScore: 76,
    breadthStatus: 'Strong Breadth',
  };

  // Intermarket Assets
  const intermarket: IntermarketAsset[] = [
    {
      symbol: 'QQQ',
      name: 'Nasdaq 100 ETF',
      price: 442.35,
      changePercent: +1.15,
      correlationWithSPY: 0.92,
      impactOnSPY: 'BULLISH',
      notes: 'Tech leadership is strong, providing momentum to S&P 500 index weightings.',
    },
    {
      symbol: 'IWM',
      name: 'Russell 2000 Small Cap',
      price: 214.8,
      changePercent: +0.65,
      correlationWithSPY: 0.78,
      impactOnSPY: 'BULLISH',
      notes: 'Small-cap participation confirms broad risk appetite rather than mega-cap only rally.',
    },
    {
      symbol: 'DIA',
      name: 'Dow Jones Industrial',
      price: 398.2,
      changePercent: +0.42,
      correlationWithSPY: 0.81,
      impactOnSPY: 'BULLISH',
      notes: 'Value and industrials holding positive territory.',
    },
    {
      symbol: 'VIX',
      name: 'CBOE Volatility Index',
      price: 14.15,
      changePercent: -4.8,
      correlationWithSPY: -0.74,
      impactOnSPY: 'BULLISH',
      notes: 'VIX falling below 15 indicates calm implied volatility and reduced hedging demand.',
    },
    {
      symbol: 'US10Y',
      name: '10-Year Treasury Yield',
      price: 4.28,
      changePercent: -1.6,
      correlationWithSPY: -0.62,
      impactOnSPY: 'BULLISH',
      notes: 'Yield easing lowers discount rate for long-duration growth assets.',
    },
    {
      symbol: 'US02Y',
      name: '2-Year Treasury Yield',
      price: 4.62,
      changePercent: -1.1,
      correlationWithSPY: -0.55,
      impactOnSPY: 'BULLISH',
      notes: 'Short-term rate expectations softening slightly.',
    },
    {
      symbol: 'DXY',
      name: 'US Dollar Index',
      price: 104.2,
      changePercent: -0.28,
      correlationWithSPY: -0.48,
      impactOnSPY: 'BULLISH',
      notes: 'Weaker dollar provides tailwind for multinational earnings.',
    },
    {
      symbol: 'GLD',
      name: 'Gold Trust',
      price: 218.4,
      changePercent: +0.35,
      correlationWithSPY: 0.12,
      impactOnSPY: 'NEUTRAL',
      notes: 'Gold steady amid currency moderation.',
    },
    {
      symbol: 'CL',
      name: 'WTI Crude Oil',
      price: 78.5,
      changePercent: -0.75,
      correlationWithSPY: -0.32,
      impactOnSPY: 'BULLISH',
      notes: 'Declining energy inputs alleviates headline CPI inflation pressure.',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin USD',
      price: 64200,
      changePercent: +2.4,
      correlationWithSPY: 0.58,
      impactOnSPY: 'BULLISH',
      notes: 'High beta liquidity sentiment remains positive across digital assets.',
    },
  ];

  // 11 S&P 500 Sectors
  const sectors: SectorData[] = [
    { symbol: 'XLK', name: 'Technology', changePercent: +1.45, weight: 31.2, sentiment: 'Strong Bullish', volumeRelative: 1.35 },
    { symbol: 'XLC', name: 'Communication Services', changePercent: +1.12, weight: 8.9, sentiment: 'Strong Bullish', volumeRelative: 1.18 },
    { symbol: 'XLF', name: 'Financials', changePercent: +0.82, weight: 13.1, sentiment: 'Bullish', volumeRelative: 1.05 },
    { symbol: 'XLI', name: 'Industrials', changePercent: +0.64, weight: 8.4, sentiment: 'Bullish', volumeRelative: 0.98 },
    { symbol: 'XLY', name: 'Consumer Discretionary', changePercent: +0.55, weight: 10.2, sentiment: 'Bullish', volumeRelative: 1.02 },
    { symbol: 'XLB', name: 'Materials', changePercent: +0.32, weight: 2.3, sentiment: 'Neutral', volumeRelative: 0.85 },
    { symbol: 'XLV', name: 'Healthcare', changePercent: +0.18, weight: 12.0, sentiment: 'Neutral', volumeRelative: 0.92 },
    { symbol: 'XLRE', name: 'Real Estate', changePercent: -0.15, weight: 2.2, sentiment: 'Bearish', volumeRelative: 0.78 },
    { symbol: 'XLP', name: 'Consumer Staples', changePercent: -0.28, weight: 5.8, sentiment: 'Bearish', volumeRelative: 0.84 },
    { symbol: 'XLU', name: 'Utilities', changePercent: -0.45, weight: 2.4, sentiment: 'Bearish', volumeRelative: 0.76 },
    { symbol: 'XLE', name: 'Energy', changePercent: -0.82, weight: 3.5, sentiment: 'Strong Bearish', volumeRelative: 0.88 },
  ];

  const sortedSectors = [...sectors].sort((a, b) => b.changePercent - a.changePercent);
  const strongestSector = sortedSectors[0];
  const weakestSector = sortedSectors[sortedSectors.length - 1];

  // Options Analytics
  const options: OptionsData = {
    callVolume: 1845200,
    putVolume: 1648900,
    totalVolume: 3494100,
    putCallRatio: 0.89,
    totalOpenInterest: 18420000,
    impliedVolatility: 13.8,
    ivPercentile: 24,
    ivRank: 19,
    expectedDailyMove: {
      low: Number((currentPrice - 3.45).toFixed(2)),
      high: Number((currentPrice + 3.45).toFixed(2)),
      rangePoints: 6.9,
    },
    largestCallOIStrike: 515.0,
    largestPutOIStrike: 505.0,
    gammaResistance: 515.0,
    gammaSupport: 505.0,
    sentiment: 'Slightly Bullish',
    hedgingContext:
      'Put/Call volume ratio is 0.89. Modest call skew observed on 0DTE and weekly expiries, with dealer positive gamma buffering intraday swings near $515.',
    unusualSweeps: [
      { type: 'CALL', strike: 515.0, exp: 'This Friday', premium: '$1.42M', action: 'Institutional Ask Sweep', sentiment: 'BULLISH' },
      { type: 'CALL', strike: 518.0, exp: 'Next Week', premium: '$860K', action: 'Above Ask Sweep', sentiment: 'BULLISH' },
      { type: 'PUT', strike: 505.0, exp: 'This Friday', premium: '$620K', action: 'Floor Trade Hedge', sentiment: 'NEUTRAL' },
      { type: 'PUT', strike: 495.0, exp: 'Monthly', premium: '$450K', action: 'Tail Risk Protective Collar', sentiment: 'NEUTRAL' },
    ],
  };

  // Economic Events Calendar
  const economicEvents: EconomicEvent[] = [
    {
      id: 'e1',
      time: '08:30 AM ET',
      event: 'Core CPI (MoM)',
      importance: 'Extreme',
      previous: '0.3%',
      consensus: '0.2%',
      actual: '0.2%',
      marketImpact: 'Bullish (Inflation moderating as expected)',
      isApproachingHighVol: false,
    },
    {
      id: 'e2',
      time: '08:30 AM ET',
      event: 'Initial Jobless Claims',
      importance: 'High',
      previous: '228K',
      consensus: '225K',
      actual: '222K',
      marketImpact: 'Neutral-Positive (Labor market stabilizing)',
      isApproachingHighVol: false,
    },
    {
      id: 'e3',
      time: '10:00 AM ET',
      event: 'ISM Services PMI',
      importance: 'High',
      previous: '51.4',
      consensus: '51.8',
      actual: '52.1',
      marketImpact: 'Bullish (Services expansion resilience)',
      isApproachingHighVol: false,
    },
    {
      id: 'e4',
      time: '01:00 PM ET',
      event: '10-Year Treasury Bond Auction',
      importance: 'Medium',
      previous: '4.32%',
      consensus: '4.29%',
      actual: undefined,
      marketImpact: 'Watch demand / bid-to-cover ratio',
      isApproachingHighVol: false,
    },
    {
      id: 'e5',
      time: '02:00 PM ET',
      event: 'FOMC Minutes / Fed Chair Speech',
      importance: 'Extreme',
      previous: '5.50%',
      consensus: 'Hold',
      actual: undefined,
      marketImpact: 'HIGH VOLATILITY EVENT APPROACHING: Comments on rate trajectories will shift index beta.',
      isApproachingHighVol: true,
    },
  ];

  // News Items with AI Impact Scores
  const news: NewsItem[] = [
    {
      id: 'n1',
      ticker: 'SPY',
      headline: 'Tech Giants Lead Index Rebound as Treasury Yields Ease Below 4.30%',
      source: 'Bloomberg Financial',
      publishedTime: '14 mins ago',
      sentiment: 'BULLISH',
      impactScore: 8,
      sectorsAffected: ['Technology (XLK)', 'Communication Services (XLC)'],
      potentialSPYImpact: '+0.4% to +0.8% Intraday Tailwind',
      aiExplanation: 'Lower long-term yields expand multiple valuations for high-margin tech heavyweights dominating S&P weighting.',
    },
    {
      id: 'n2',
      ticker: 'NVDA',
      headline: 'Enterprise Cloud Datacenter Demand Surpasses Supply Forecasts into Next Quarter',
      source: 'Reuters Tech',
      publishedTime: '38 mins ago',
      sentiment: 'BULLISH',
      impactScore: 9,
      sectorsAffected: ['Semiconductors (SOXX)', 'Tech (XLK)'],
      potentialSPYImpact: 'Strong positive beta contribution across chip supply chain',
      aiExplanation: 'AI hardware capex acceleration continues to fuel semiconductor leadership across both S&P and Nasdaq.',
    },
    {
      id: 'n3',
      ticker: 'US_MACRO',
      headline: 'Federal Reserve Regional Presidents Reiterate Data-Dependent Stance Ahead of Next FOMC',
      source: 'Wall Street Journal',
      publishedTime: '1 hr ago',
      sentiment: 'NEUTRAL',
      impactScore: 6,
      sectorsAffected: ['Financials (XLF)', 'Real Estate (XLRE)'],
      potentialSPYImpact: 'Neutralizes extreme rate cut or hike over-positioning',
      aiExplanation: 'Central bank messaging remains consistent with market baseline pricing of gradual policy easing.',
    },
    {
      id: 'n4',
      ticker: 'XLE',
      headline: 'Crude Oil Settles Lower on Global Inventory Build Expectations',
      source: 'Energy Intelligence',
      publishedTime: '2 hrs ago',
      sentiment: 'NEUTRAL',
      impactScore: 5,
      sectorsAffected: ['Energy (XLE)'],
      potentialSPYImpact: 'Alleviates consumer inflationary drag despite energy sector lag',
      aiExplanation: 'Lower energy costs benefit corporate margins outside the oil patch, supporting overall consumer spending.',
    },
  ];

  // Federal Reserve Dashboard
  const fed: FedDashboard = {
    targetRange: '5.25% - 5.50%',
    nextMeetingDate: 'September 17-18, 2026',
    daysUntilMeeting: 34,
    cutProbability: 68,
    holdProbability: 31,
    hikeProbability: 1,
    recentCommentary: 'Powell notes inflation progress has resumed after Q1 bump; committee remains attentive to both sides of the dual mandate.',
    hawkishDovishStance: 'Neutral-Dovish',
    fedSentimentScore: 42, // 0 (Dovish) to 100 (Hawkish)
    treasury10Y: 4.28,
    treasury2Y: 4.62,
    yieldCurveInversion: -0.34,
  };

  // Factor Scores for Probability Engine
  const factorScores: FactorScores = {
    technicals: changePercent >= 0 ? 55 : -40,
    priceAction: currentPrice >= vwap ? 60 : -45,
    marketBreadth: breadth.breadthScore - 50, // +26
    optionsSentiment: options.putCallRatio < 0.95 ? 30 : -25,
    macroEconomics: 25,
    newsSentiment: 45,
    intermarket: 40,
  };

  // Bullish, Bearish, and Neutral Scenarios
  const scenarios = {
    bullish: {
      probability: 65,
      confirmationPrice: r1,
      target1: Number((currentPrice + (r1 - currentPrice) + 1.2).toFixed(2)),
      target2: r2,
      target3: r3,
      invalidationLevel: Number((vwap - 0.4).toFixed(2)),
      requiredVolume: 'Relative Volume > 1.25x on 15-minute candle breakout',
      reasoning: `${ticker} holds above VWAP ($${vwap}) and moving averages with strong sector breadth (+72% above 20 DMA) and declining VIX volatility.`,
    },
    bearish: {
      probability: 20,
      confirmationPrice: s1,
      target1: Number((s1 - 1.2).toFixed(2)),
      target2: s2,
      target3: s3,
      invalidationLevel: Number((r1 + 0.5).toFixed(2)),
      requiredVolume: 'Sustained selling volume exceeding 1.4x daily average on VWAP breakdown',
      reasoning: 'Rejection at overhead resistance R1 ($513.40) coupled with potential late-day profit taking or unexpected bond yield spike.',
    },
    neutral: {
      probability: 15,
      confirmationPrice: currentPrice,
      target1: r1,
      target2: s1,
      target3: pivot,
      invalidationLevel: r2,
      requiredVolume: 'Volume below 0.8x average indicates rangebound oscillation',
      reasoning: 'Consolidation between $508.50 and $513.40 while institutional participants wait for afternoon FOMC catalysts.',
    },
  };

  // Prediction Records Database
  const predictions: PredictionRecord[] = [
    {
      id: 'p-101',
      date: 'Today',
      time: '09:35 AM ET',
      ticker,
      tickerPrice: 509.2,
      direction: 'BULLISH',
      bullishProb: 64,
      bearishProb: 21,
      neutralProb: 15,
      confidence: 80,
      technicalScore: 68,
      newsScore: 72,
      optionsScore: 58,
      horizon: '1h',
      targetPrice: 511.5,
      actualPrice: 512.48,
      status: 'CORRECT',
      returnPercent: +0.64,
    },
    {
      id: 'p-102',
      date: 'Today',
      time: '10:45 AM ET',
      ticker,
      tickerPrice: 510.8,
      direction: 'BULLISH',
      bullishProb: 68,
      bearishProb: 18,
      neutralProb: 14,
      confidence: 84,
      technicalScore: 74,
      newsScore: 70,
      optionsScore: 62,
      horizon: 'Rest of Day',
      targetPrice: 513.4,
      actualPrice: undefined,
      status: 'PENDING',
    },
    {
      id: 'p-103',
      date: 'Yesterday',
      time: '09:40 AM ET',
      ticker,
      tickerPrice: 504.1,
      direction: 'BULLISH',
      bullishProb: 61,
      bearishProb: 24,
      neutralProb: 15,
      confidence: 76,
      technicalScore: 60,
      newsScore: 65,
      optionsScore: 54,
      horizon: '1h',
      targetPrice: 506.5,
      actualPrice: 507.2,
      status: 'CORRECT',
      returnPercent: +0.61,
    },
    {
      id: 'p-104',
      date: 'Yesterday',
      time: '01:15 PM ET',
      ticker,
      tickerPrice: 507.8,
      direction: 'NEUTRAL',
      bullishProb: 30,
      bearishProb: 25,
      neutralProb: 45,
      confidence: 72,
      technicalScore: 50,
      newsScore: 52,
      optionsScore: 48,
      horizon: 'Rest of Day',
      targetPrice: 508.0,
      actualPrice: 508.28,
      status: 'CORRECT',
      returnPercent: +0.09,
    },
    {
      id: 'p-105',
      date: '2 Days Ago',
      time: '10:00 AM ET',
      ticker,
      tickerPrice: 501.4,
      direction: 'BEARISH',
      bullishProb: 22,
      bearishProb: 62,
      neutralProb: 16,
      confidence: 74,
      technicalScore: -55,
      newsScore: -40,
      optionsScore: -35,
      horizon: '1h',
      targetPrice: 498.5,
      actualPrice: 502.8,
      status: 'INCORRECT',
      returnPercent: +0.28,
    },
  ];

  // Backtest Metrics & Calibration
  const backtest: BacktestMetrics = {
    totalPredictions: 486,
    correctPredictions: 362,
    incorrectPredictions: 124,
    accuracy: 74.5,
    bullishAccuracy: 76.8,
    bearishAccuracy: 71.4,
    neutralAccuracy: 72.0,
    fifteenMinAccuracy: 77.2,
    oneHourAccuracy: 75.1,
    dailyAccuracy: 73.4,
    weeklyAccuracy: 71.8,
    avgPredictedProbability: 66.4,
    actualSuccessRate: 74.5,
    calibrationAdjustment: 1.0, // Calibrated
  };

  // Real-Time Alerts
  const alerts: MarketAlert[] = [
    {
      id: 'a1',
      time: '11:15:20 ET',
      ticker,
      type: 'VWAP_CROSS',
      title: `${ticker} Reclaimed VWAP`,
      message: `Price surged above $${vwap} with volume delta +1.3x. Intraday momentum shifted bullish.`,
      severity: 'SUCCESS',
      read: false,
    },
    {
      id: 'a2',
      time: '11:02:45 ET',
      ticker,
      type: 'PROB_SHIFT',
      title: 'Probability Shift Detected',
      message: 'Bullish probability increased from 57% to 65% as QQQ broke daily high and yields declined.',
      severity: 'INFO',
      read: false,
    },
    {
      id: 'a3',
      time: '10:48:10 ET',
      ticker,
      type: 'OPTIONS_SWEEP',
      title: 'Institutional Call Sweep',
      message: `$1.42M premium purchased in $515 strike calls expiring this Friday.`,
      severity: 'INFO',
      read: true,
    },
    {
      id: 'a4',
      time: '09:45:00 ET',
      ticker,
      type: 'HIGH_VOL_NEWS',
      title: 'Economic Data Released',
      message: 'Core CPI printed 0.2% vs 0.3% expected, providing equity index tailwind.',
      severity: 'SUCCESS',
      read: true,
    },
  ];

  // Machine Learning Feature Store (for future ML models)
  const mlFeatures: MLFeatureRow[] = [
    {
      timestamp: new Date().toISOString(),
      ticker,
      price: currentPrice,
      rsi,
      macd: technicals.macd,
      vwapDistancePct: Number((((currentPrice - vwap) / vwap) * 100).toFixed(3)),
      volume: 64200000,
      relativeVolume: 1.2,
      vix: 14.15,
      yield10Y: 4.28,
      qqqPerformancePct: 1.15,
      iwmPerformancePct: 0.65,
      leadSectorScore: 1.45,
      optionsPutCall: 0.89,
      newsSentimentScore: 45,
      gapPct: 0.42,
      marketBreadthScore: 76,
      return15m: 0.12,
      return30m: 0.25,
      return1h: 0.48,
    },
  ];

  const quote: MarketQuote = {
    ticker,
    name: meta.name,
    price: currentPrice,
    change,
    changePercent,
    dayHigh,
    dayLow,
    openPrice: Number((meta.basePrice * 1.002).toFixed(2)),
    previousClose: meta.prevClose,
    preMarketPrice: Number((meta.basePrice * 1.003).toFixed(2)),
    preMarketChangePercent: +0.3,
    afterHoursPrice: Number((currentPrice * 1.001).toFixed(2)),
    afterHoursChangePercent: +0.1,
    volume: 64250000,
    avgVolume: 58900000,
    relativeVolume: 1.2,
    fiftyTwoWeekHigh: Number((meta.basePrice * 1.08).toFixed(2)),
    fiftyTwoWeekLow: Number((meta.basePrice * 0.78).toFixed(2)),
    timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
    marketStatus: 'REGULAR',
  };

  const probabilities = calculateWeightedProbability(
    factorScores,
    factorWeights,
    14.15,
    currentPrice >= vwap,
    rsi
  );

  return {
    quote,
    technicals,
    supportResistance,
    trends,
    trendAlignmentScore,
    breadth,
    intermarket,
    sectors,
    strongestSector,
    weakestSector,
    options,
    economicEvents,
    news,
    fed,
    scenarios,
    predictions,
    backtest,
    alerts,
    mlFeatures,
    factorScores,
    probabilities,
  };
}

export const getComprehensiveMarketData = generateMarketData;

import { CapacitorPlatform } from './mobile/capacitorPlatform.js';

// Fetch live quote and intraday data from backend
export async function fetchLiveMarketData(
  ticker: string
): Promise<any> {
  const startTime = Date.now();
  try {
    const baseUrl = CapacitorPlatform.getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/market/quote/${encodeURIComponent(ticker)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.code || 'LIVE_MARKET_DATA_UNAVAILABLE');
    const quote = data?.quote;
    const instrument = data?.instrument;
    const required = [
      quote?.price,
      quote?.previousClose,
      quote?.change,
      quote?.changePercent,
      quote?.dayHigh,
      quote?.dayLow,
      quote?.openPrice,
      quote?.volume,
    ];
    if (
      !data?.entitlementStatus?.isAvailable ||
      quote?.metadata?.validationStatus !== 'VALID' ||
      quote?.metadata?.stale !== false ||
      !required.every((value) => typeof value === 'number' && Number.isFinite(value))
    ) {
      throw new Error('MALFORMED_LIVE_QUOTE_RESPONSE');
    }
    const latencyMs = Date.now() - startTime;
    return {
      ticker: instrument.symbol,
      name: instrument.name,
      currency: quote.currency,
      exchangeName: instrument.exchange,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      previousClose: quote.previousClose,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      openPrice: quote.openPrice,
      volume: quote.volume,
      marketState: quote.marketState,
      timestamp: quote.timestamp,
      metadata: quote.metadata,
      latencyMs,
      dataSource: quote.dataSource,
    };
  } catch (err) {
    console.warn(`[LiveMarket] Verified quote unavailable for ${ticker}:`, err);
    return null;
  }
}

export const fetchLiveMarketQuote = fetchLiveMarketData;

// Fetch live multi-ticker market tape (SPY, QQQ, NVDA, AAPL, etc.)
export async function fetchLiveTape(): Promise<Array<{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}>> {
  try {
    const baseUrl = CapacitorPlatform.getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/market/tape`);
    if (!res.ok) throw new Error('Tape error');
    const data = await res.json();
    return data.quotes || [];
  } catch (err) {
    return [];
  }
}

// Live symbol autocomplete / search
export async function searchMarketSymbols(query: string): Promise<Array<{
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}>> {
  if (!query || query.trim().length === 0) return [];
  try {
    const baseUrl = CapacitorPlatform.getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/market/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.quotes || [];
  } catch (err) {
    return [];
  }
}

// Merge incoming live data into quantitative comprehensive state
export function mergeLiveQuoteIntoComprehensiveData(
  prevData: ComprehensiveMarketData,
  live: any
): ComprehensiveMarketData {
  if (!live || !live.price) return prevData;

  const required = [
    live.price,
    live.previousClose,
    live.change,
    live.changePercent,
    live.dayHigh,
    live.dayLow,
    live.openPrice,
    live.volume,
  ];
  if (!required.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    return prevData;
  }

  const currentPrice = live.price;
  const prevClose = live.previousClose;
  const change = live.change;
  const changePercent = live.changePercent;
  const dayHigh = live.dayHigh;
  const dayLow = live.dayLow;
  const volume = live.volume;

  const updatedQuote: MarketQuote = {
    ...prevData.quote,
    ticker: live.ticker || prevData.quote.ticker,
    name: live.name || prevData.quote.name,
    price: currentPrice,
    change,
    changePercent,
    previousClose: prevClose,
    dayHigh,
    dayLow,
    openPrice: live.openPrice,
    volume,
    relativeVolume: null as any,
    timestamp: live.timestamp,
    marketStatus: live.marketState,
    dataStatus: live.metadata?.mode,
    dataSource: live.dataSource,
    latencyMs: live.latencyMs,
    currency: live.currency,
    exchange: live.exchangeName,
    metadata: live.metadata,
  };

  return {
    ...prevData,
    quote: updatedQuote,
  };
}

export function simulateTick(prevData: ComprehensiveMarketData): ComprehensiveMarketData {
  if (!AppConfig.allowSimulatedMarketData) {
    return prevData;
  }
  // Random small delta between -0.06% and +0.06%
  const deltaPct = (Math.random() - 0.48) * 0.08;
  const currentPrice = Number((prevData.quote.price * (1 + deltaPct / 100)).toFixed(2));
  const change = Number((currentPrice - prevData.quote.previousClose).toFixed(2));
  const changePercent = Number(((change / prevData.quote.previousClose) * 100).toFixed(2));
  const dayHigh = Math.max(prevData.quote.dayHigh, currentPrice);
  const dayLow = Math.min(prevData.quote.dayLow, currentPrice);

  const updatedQuote: MarketQuote = {
    ...prevData.quote,
    price: currentPrice,
    change,
    changePercent,
    dayHigh,
    dayLow,
    volume: prevData.quote.volume + Math.floor(Math.random() * 15000 + 5000),
    timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
  };

  const updatedRsi = Number(
    Math.min(88, Math.max(18, prevData.technicals.rsi14 + deltaPct * 2.5)).toFixed(1)
  );

  const updatedScores: FactorScores = {
    ...prevData.factorScores,
    technicals: changePercent >= 0 ? 55 : -40,
    priceAction: currentPrice >= prevData.technicals.vwap ? 60 : -45,
  };

  const updatedProbabilities = calculateWeightedProbability(
    updatedScores,
    undefined,
    14.15,
    currentPrice >= prevData.technicals.vwap,
    updatedRsi
  );

  return {
    ...prevData,
    quote: updatedQuote,
    technicals: {
      ...prevData.technicals,
      rsi14: updatedRsi,
      rsiStatus: updatedRsi > 70 ? 'Overbought' : updatedRsi < 30 ? 'Oversold' : 'Neutral',
    },
    factorScores: updatedScores,
    probabilities: updatedProbabilities,
  };
}
