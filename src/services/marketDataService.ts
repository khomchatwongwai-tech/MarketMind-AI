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
} from '../types/market';
import { calculateWeightedProbability, FactorScores, FactorWeights } from './probabilityEngine';

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
const TICKER_NAMES: Record<string, string> = {
  SPY: 'SPDR S&P 500 ETF Trust',
  QQQ: 'Invesco QQQ Trust',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla, Inc.',
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com, Inc.',
  META: 'Meta Platforms, Inc.',
  AMD: 'Advanced Micro Devices, Inc.',
  IWM: 'iShares Russell 2000 ETF',
};

/** Creates a neutral, explicitly unavailable state until verified provider data arrives. */
export function generateMarketData(
  ticker: TickerSymbol = 'SPY',
  _priceDeltaPercent: number = 0,
  _factorWeights?: FactorWeights
): ComprehensiveMarketData {
  const zeroScores: FactorScores = {
    technicals: 0,
    priceAction: 0,
    marketBreadth: 0,
    optionsSentiment: 0,
    macroEconomics: 0,
    newsSentiment: 0,
    intermarket: 0,
  };
  const unavailableScenario: ScenarioPlan = {
    probability: 0,
    confirmationPrice: 0,
    target1: 0,
    target2: 0,
    target3: 0,
    invalidationLevel: 0,
    requiredVolume: 'Verified market data unavailable',
    reasoning: 'No scenario is generated without verified provider data.',
  };
  const unavailableSector: SectorData = {
    symbol: 'N/A',
    name: 'Verified sector data unavailable',
    changePercent: 0,
    weight: 0,
    sentiment: 'Neutral',
    volumeRelative: 0,
  };
  return {
    quote: {
      ticker,
      name: TICKER_NAMES[ticker] || ticker,
      price: 0,
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      openPrice: 0,
      previousClose: 0,
      preMarketPrice: 0,
      preMarketChangePercent: 0,
      afterHoursPrice: 0,
      afterHoursChangePercent: 0,
      volume: 0,
      avgVolume: 0,
      relativeVolume: 0,
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0,
      timestamp: 'Unavailable',
      marketStatus: 'CLOSED',
      dataStatus: 'UNAVAILABLE',
      dataSource: 'Awaiting verified server market data',
    },
    technicals: {
      vwap: 0, rsi14: 0, rsiStatus: 'Neutral', macd: 0, macdSignal: 0,
      macdHistogram: 0, macdTrend: 'Neutral', ema9: 0, ema20: 0, ema50: 0,
      ema100: 0, ema200: 0, sma20: 0, sma50: 0, sma200: 0, atr14: 0,
      bollingerUpper: 0, bollingerMiddle: 0, bollingerLower: 0,
      bollingerBandwidth: 0, momentum: 0, rateOfChange: 0, adx: 0,
      adxStrength: 'Weak', stochRsiK: 0, stochRsiD: 0, prevDayHigh: 0,
      prevDayLow: 0, prevDayClose: 0, preMarketHigh: 0, preMarketLow: 0,
      openingRangeHigh: 0, openingRangeLow: 0,
    },
    supportResistance: {
      pivot: 0, r3: 0, r2: 0, r1: 0, current: 0, s1: 0, s2: 0, s3: 0,
      keyResistance: 0, keySupport: 0,
      breakoutStatus: 'Verified support and resistance data unavailable.',
      breakoutType: 'CONSOLIDATING',
    },
    trends: [],
    trendAlignmentScore: 0,
    breadth: {
      sp500Adv: 0, sp500Dec: 0, sp500AdvDecRatio: 0, nasdaqAdv: 0,
      nasdaqDec: 0, nyseAdv: 0, nyseDec: 0, pctAbove20SMA: 0,
      pctAbove50SMA: 0, pctAbove200SMA: 0, newHighs: 0, newLows: 0,
      upVolumeRatio: 0, breadthScore: 0, breadthStatus: 'Weak Breadth',
    },
    intermarket: [],
    sectors: [],
    strongestSector: unavailableSector,
    weakestSector: unavailableSector,
    options: {
      callVolume: 0, putVolume: 0, totalVolume: 0, putCallRatio: 0,
      totalOpenInterest: 0, impliedVolatility: 0, ivPercentile: 0, ivRank: 0,
      expectedDailyMove: { low: 0, high: 0, rangePoints: 0 },
      largestCallOIStrike: 0, largestPutOIStrike: 0, gammaResistance: 0,
      gammaSupport: 0, sentiment: 'Neutral',
      hedgingContext: 'Verified options data unavailable.', unusualSweeps: [],
    },
    economicEvents: [],
    news: [],
    fed: {
      targetRange: 'Unavailable', nextMeetingDate: 'Unavailable', daysUntilMeeting: 0,
      cutProbability: 0, holdProbability: 0, hikeProbability: 0,
      recentCommentary: 'Verified Federal Reserve data unavailable.',
      hawkishDovishStance: 'Neutral', fedSentimentScore: 0, treasury10Y: 0,
      treasury2Y: 0, yieldCurveInversion: 0,
    },
    scenarios: {
      bullish: { ...unavailableScenario },
      bearish: { ...unavailableScenario },
      neutral: { ...unavailableScenario },
    },
    predictions: [],
    backtest: {
      totalPredictions: 0, correctPredictions: 0, incorrectPredictions: 0,
      accuracy: 0, bullishAccuracy: 0, bearishAccuracy: 0, neutralAccuracy: 0,
      fifteenMinAccuracy: 0, oneHourAccuracy: 0, dailyAccuracy: 0,
      weeklyAccuracy: 0, avgPredictedProbability: 0, actualSuccessRate: 0,
      calibrationAdjustment: 0,
    },
    alerts: [],
    mlFeatures: [],
    factorScores: zeroScores,
    probabilities: {
      bullish: 0, bearish: 0, neutral: 100, aiConfidence: 0, setupScore: 0,
      setupQuality: 'NO TRADE / WAIT FOR CONFIRMATION', riskLevel: 'HIGHER RISK',
      primaryDriver: 'Verified market data unavailable', secondaryDriver: 'None',
      mainRisk: 'Provider data unavailable', bullishConfirmation: 'Unavailable',
      bearishInvalidation: 'Unavailable',
      aiSummary: 'No market probability is generated without verified provider data.',
    },
  };
}
export function getComprehensiveMarketData(ticker: TickerSymbol = 'SPY'): ComprehensiveMarketData {
  const initial = generateMarketData(ticker);
  return {
    ...initial,
    quote: {
      ...initial.quote,
      price: 0,
      change: 0,
      changePercent: 0,
      dayHigh: 0,
      dayLow: 0,
      openPrice: 0,
      previousClose: 0,
      preMarketPrice: 0,
      preMarketChangePercent: 0,
      afterHoursPrice: 0,
      afterHoursChangePercent: 0,
      volume: 0,
      avgVolume: 0,
      relativeVolume: 0,
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0,
      dataStatus: 'UNAVAILABLE',
      dataSource: 'Awaiting verified server market data',
    },
    technicals: {
      ...initial.technicals,
      vwap: 0,
      ema9: 0,
      ema20: 0,
      ema50: 0,
      ema100: 0,
      ema200: 0,
      sma20: 0,
      sma50: 0,
      sma200: 0,
      atr14: 0,
      bollingerUpper: 0,
      bollingerMiddle: 0,
      bollingerLower: 0,
      prevDayHigh: 0,
      prevDayLow: 0,
      prevDayClose: 0,
      preMarketHigh: 0,
      preMarketLow: 0,
      openingRangeHigh: 0,
      openingRangeLow: 0,
    },
    supportResistance: {
      ...initial.supportResistance,
      r3: 0,
      r2: 0,
      r1: 0,
      current: 0,
      s1: 0,
      s2: 0,
      s3: 0,
      keyResistance: 0,
      keySupport: 0,
      pivot: 0,
      breakoutStatus: 'Verified support and resistance data unavailable.',
      breakoutType: 'CONSOLIDATING',
    },
  };
}

// Fetch live quote and intraday data from Yahoo Finance / Google Finance backend
export async function fetchLiveMarketQuote(
  ticker: string,
  source: string = 'Yahoo Finance'
): Promise<any> {
  const startTime = Date.now();
  try {
    const res = await fetch(`/api/market/live/${encodeURIComponent(ticker)}`);
    if (!res.ok) throw new Error('Live endpoint error');
    const data = await res.json();
    const latencyMs = Date.now() - startTime;
    return {
      ...data,
      latencyMs,
      dataSource: data.source || `${source} (Real-Time)`,
    };
  } catch (err) {
    console.warn(`[LiveMarket] Fallback for ${ticker}:`, err);
    return null;
  }
}

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
    const res = await fetch('/api/market/tape');
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
    const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
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

  const currentPrice = Number(live.price.toFixed(2));
  const prevClose = Number(live.previousClose) || 0;
  const change = prevClose > 0 ? Number((currentPrice - prevClose).toFixed(2)) : 0;
  const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
  const dayHigh = Number(live.dayHigh) || 0;
  const dayLow = Number(live.dayLow) || 0;
  const volume = Number(live.volume ?? 0);
  const avgVolume = Number(live.avgVolume ?? 0);

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
    volume,
    avgVolume,
    relativeVolume: avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : 0,
    timestamp: live.lastSyncTime || (new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET'),
    marketStatus: (live.marketState === 'PRE' ? 'PRE_MARKET' : live.marketState === 'POST' ? 'AFTER_HOURS' : live.marketState === 'CLOSED' ? 'CLOSED' : 'REGULAR'),
    dataSource: live.dataSource || live.source || 'Yahoo Finance (Real-Time)',
    latencyMs: Number(live.latencyMs) || 0,
    currency: live.currency || 'USD',
    exchange: live.exchangeName || 'US Equities',
    dataStatus: live.isDelayed || live.status === 'END_OF_DAY' ? 'DELAYED' : 'REAL_TIME',
    openPrice: Number(live.openPrice) || 0,
    preMarketPrice: Number(live.preMarketPrice ?? 0),
    preMarketChangePercent: Number(live.preMarketChangePercent ?? 0),
    fiftyTwoWeekHigh: Number(live.fiftyTwoWeekHigh ?? 0),
    fiftyTwoWeekLow: Number(live.fiftyTwoWeekLow ?? 0),
  };

  const verifiedCandles = Array.isArray(live.chartData)
    ? live.chartData.filter((bar: any) => Number(bar?.price ?? bar?.close) > 0)
    : [];
  const closes = verifiedCandles.map((bar: any) => Number(bar.price ?? bar.close));
  const calculateEma = (period: number): number => {
    if (closes.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    return Number(closes.slice(1).reduce((ema: number, close: number) => close * multiplier + ema * (1 - multiplier), closes[0]).toFixed(2));
  };
  const calculateRsi = (): number => {
    if (closes.length < 15) return 0;
    const deltas = closes.slice(1).map((close: number, index: number) => close - closes[index]);
    const recent = deltas.slice(-14);
    const gains = recent.reduce((sum: number, delta: number) => sum + Math.max(delta, 0), 0) / 14;
    const losses = recent.reduce((sum: number, delta: number) => sum + Math.max(-delta, 0), 0) / 14;
    if (losses === 0) return gains > 0 ? 100 : 50;
    return Number((100 - 100 / (1 + gains / losses)).toFixed(1));
  };
  let cumulativeVolume = 0;
  let cumulativePriceVolume = 0;
  verifiedCandles.forEach((bar: any) => {
    const barVolume = Number(bar.volume ?? 0);
    const typicalPrice = (Number(bar.high ?? bar.price) + Number(bar.low ?? bar.price) + Number(bar.price ?? bar.close)) / 3;
    cumulativeVolume += barVolume;
    cumulativePriceVolume += typicalPrice * barVolume;
  });
  const vwap = cumulativeVolume > 0 ? Number((cumulativePriceVolume / cumulativeVolume).toFixed(2)) : 0;
  const rsi = calculateRsi();

  // Dynamic Support & Resistance based on live High/Low/PrevClose
  const pivot = (dayHigh + dayLow + prevClose) / 3;
  const r1 = Number((2 * pivot - dayLow).toFixed(2));
  const s1 = Number((2 * pivot - dayHigh).toFixed(2));
  const r2 = Number((pivot + (dayHigh - dayLow)).toFixed(2));
  const s2 = Number((pivot - (dayHigh - dayLow)).toFixed(2));
  const r3 = Number((dayHigh + 2 * (pivot - dayLow)).toFixed(2));
  const s3 = Number((dayLow - 2 * (dayHigh - pivot)).toFixed(2));

  const updatedScores: FactorScores = {
    ...prevData.factorScores,
    technicals: 0,
    priceAction: vwap > 0 ? (currentPrice >= vwap ? 65 : -50) : 0,
  };

  const updatedProbabilities = calculateWeightedProbability(
    updatedScores,
    undefined,
    18,
    vwap > 0 ? currentPrice >= vwap : true,
    rsi > 0 ? rsi : 50
  );

  return {
    ...prevData,
    quote: updatedQuote,
    technicals: {
      vwap,
      rsi14: rsi,
      rsiStatus: rsi > 0 && rsi > 70 ? 'Overbought' : rsi > 0 && rsi < 30 ? 'Oversold' : 'Neutral',
      macd: 0,
      macdSignal: 0,
      macdHistogram: 0,
      macdTrend: 'Neutral',
      ema9: calculateEma(9),
      ema20: calculateEma(20),
      ema50: calculateEma(50),
      ema100: calculateEma(100),
      ema200: calculateEma(200),
      sma20: closes.length >= 20 ? Number((closes.slice(-20).reduce((sum: number, value: number) => sum + value, 0) / 20).toFixed(2)) : 0,
      sma50: closes.length >= 50 ? Number((closes.slice(-50).reduce((sum: number, value: number) => sum + value, 0) / 50).toFixed(2)) : 0,
      sma200: closes.length >= 200 ? Number((closes.slice(-200).reduce((sum: number, value: number) => sum + value, 0) / 200).toFixed(2)) : 0,
      atr14: 0,
      bollingerUpper: 0,
      bollingerMiddle: 0,
      bollingerLower: 0,
      bollingerBandwidth: 0,
      momentum: closes.length > 1 ? Number((closes[closes.length - 1] - closes[0]).toFixed(2)) : 0,
      rateOfChange: changePercent,
      adx: 0,
      adxStrength: 'Moderate',
      stochRsiK: 0,
      stochRsiD: 0,
      prevDayHigh: dayHigh,
      prevDayLow: dayLow,
      prevDayClose: prevClose,
      preMarketHigh: Number(live.pmHigh ?? 0),
      preMarketLow: Number(live.pmLow ?? 0),
      openingRangeHigh: Number(live.orHigh ?? 0),
      openingRangeLow: Number(live.orLow ?? 0),
    },
    supportResistance: {
      ...prevData.supportResistance,
      current: currentPrice,
      pivot: Number(pivot.toFixed(2)),
      r1,
      r2,
      r3,
      s1,
      s2,
      s3,
      keyResistance: r1,
      keySupport: s1,
    },
    factorScores: updatedScores,
    probabilities: updatedProbabilities,
  };
}
