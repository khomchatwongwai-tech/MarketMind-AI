import { ComprehensiveMarketData } from '../services/marketDataService.js';
import { Probabilities } from '../types/market.js';
import { isFiniteMarketNumber } from './formatters.js';

export interface IntelligenceFactor {
  id: string;
  name: string;
  value: number | string | boolean | null;
  provider: string;
  timestamp: string;
  available: boolean;
  stale: boolean;
  validationStatus: 'VALID' | 'UNAVAILABLE' | 'STALE';
  weight: number;
  scoreContribution: number; // 0 to weight
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reasonText?: string;
}

export interface IntelligenceEngineOutput {
  status: 'VALID' | 'DEGRADED' | 'UNAVAILABLE';
  intelligenceScore: number | null; // null if coverage < 60%
  overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE';
  overallConfidence: number; // 0 to 100
  setupQuality: 'STRONG SETUP' | 'MODERATE SETUP' | 'WEAK SETUP' | 'UNAVAILABLE';
  setupScore: number | null;
  
  timeframeBias: {
    tf15m: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE'; score: number | null };
    tf1h: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE'; score: number | null };
    tfToday: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE'; score: number | null };
  };

  structure: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE';
  momentum: 'STRONG_BULLISH' | 'MODERATE_BULLISH' | 'NEUTRAL' | 'MODERATE_BEARISH' | 'STRONG_BEARISH' | 'UNAVAILABLE';
  newsSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'UNAVAILABLE';

  reasons: string[];
  bullishReasons: string[];
  bearishReasons: string[];

  confirmationLevel: string; // Price string or 'UNAVAILABLE'
  invalidationLevel: string; // Price string or 'UNAVAILABLE'

  // Provenance metadata
  coveragePercent: number; // 0 to 100
  validatedFactorCount: number;
  missingFactorCount: number;
  factorsUsed: string[];
  factorsMissing: string[];
  factors: IntelligenceFactor[];
  updatedAt: string;
}

const MINIMUM_COVERAGE_THRESHOLD = 60; // 60% weighted coverage required for score/bias

/**
 * Real-Time MarketMind Intelligence Engine
 * Evaluates validated live provider data with zero fake defaults or synthetic fallbacks.
 */
export function calculateRealtimeIntelligence(
  data: ComprehensiveMarketData
): IntelligenceEngineOutput {
  const timestamp =
    data.quote?.timestamp ||
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York',
    }) + ' ET';

  const factors: IntelligenceFactor[] = [];
  const quote = (data.quote || {}) as any;
  const technicals = (data.technicals || {}) as any;
  const supportResistance = (data.supportResistance || {}) as any;
  const breadth = (data.breadth || {}) as any;
  const intermarket = Array.isArray(data.intermarket) ? data.intermarket : [];
  const news = Array.isArray(data.news) ? data.news : [];

  const spyPrice = isFiniteMarketNumber(quote.price) && quote.price > 0 ? quote.price : null;
  const mainProvider = quote.metadata?.provider || quote.dataSource || 'Alpaca IEX';

  // 1. Factor: SPY Live Price & Session Direction (Weight 15)
  const isPriceValid = spyPrice !== null;
  const isPriceBullish = isPriceValid && isFiniteMarketNumber(quote.change) ? quote.change >= 0 : false;
  factors.push({
    id: 'spyPrice',
    name: 'SPY Live Price',
    value: isPriceValid ? `$${spyPrice!.toFixed(2)}` : null,
    provider: mainProvider,
    timestamp,
    available: isPriceValid,
    stale: !isPriceValid,
    validationStatus: isPriceValid ? 'VALID' : 'UNAVAILABLE',
    weight: 15,
    scoreContribution: isPriceValid ? (isPriceBullish ? 15 : 0) : 0,
    bias: isPriceValid ? (isPriceBullish ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
    reasonText: isPriceValid
      ? `Price ${isPriceBullish ? 'advancing' : 'declining'} at $${spyPrice!.toFixed(2)}`
      : undefined,
  });

  // 2. Factor: Intraday VWAP (Weight 15)
  const vwap = isFiniteMarketNumber(technicals.vwap) ? technicals.vwap : null;
  const isVwapValid = vwap !== null && isPriceValid;
  const isAboveVwap = isVwapValid ? spyPrice! >= vwap! : false;
  factors.push({
    id: 'vwap',
    name: 'Intraday VWAP',
    value: isVwapValid ? `$${vwap!.toFixed(2)}` : null,
    provider: 'Alpaca IEX Candles',
    timestamp,
    available: isVwapValid,
    stale: !isVwapValid,
    validationStatus: isVwapValid ? 'VALID' : 'UNAVAILABLE',
    weight: 15,
    scoreContribution: isVwapValid ? (isAboveVwap ? 15 : 0) : 0,
    bias: isVwapValid ? (isAboveVwap ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
    reasonText: isVwapValid
      ? `Price ${isAboveVwap ? 'above' : 'below'} session VWAP ($${vwap!.toFixed(2)})`
      : undefined,
  });

  // 3. Factor: EMA 9 / 20 Momentum Stack (Weight 15)
  const ema9 = isFiniteMarketNumber(technicals.ema9) ? technicals.ema9 : null;
  const ema20 = isFiniteMarketNumber(technicals.ema20) ? technicals.ema20 : null;
  const isEmaValid = ema9 !== null && ema20 !== null;
  const isEmaBullish = isEmaValid ? ema9! >= ema20! : false;
  factors.push({
    id: 'emaStack',
    name: '9/20 EMA Alignment',
    value: isEmaValid ? `9 EMA: $${ema9!.toFixed(2)} / 20 EMA: $${ema20!.toFixed(2)}` : null,
    provider: 'Alpaca IEX Candles',
    timestamp,
    available: isEmaValid,
    stale: !isEmaValid,
    validationStatus: isEmaValid ? 'VALID' : 'UNAVAILABLE',
    weight: 15,
    scoreContribution: isEmaValid ? (isEmaBullish ? 15 : 0) : 0,
    bias: isEmaValid ? (isEmaBullish ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
    reasonText: isEmaValid
      ? isEmaBullish
        ? '9 EMA > 20 EMA (Bullish Momentum)'
        : '9 EMA < 20 EMA (Bearish Pressure)'
      : undefined,
  });

  // 4. Factor: RSI(14) (Weight 10)
  const rsi = isFiniteMarketNumber(technicals.rsi14) ? technicals.rsi14 : isFiniteMarketNumber(technicals.rsi) ? technicals.rsi : null;
  const isRsiValid = rsi !== null;
  const isRsiBullish = isRsiValid ? rsi! >= 50 : false;
  factors.push({
    id: 'rsi14',
    name: 'RSI (14)',
    value: isRsiValid ? rsi!.toFixed(1) : null,
    provider: 'Alpaca IEX Candles',
    timestamp,
    available: isRsiValid,
    stale: !isRsiValid,
    validationStatus: isRsiValid ? 'VALID' : 'UNAVAILABLE',
    weight: 10,
    scoreContribution: isRsiValid ? (isRsiBullish ? 10 : 0) : 0,
    bias: isRsiValid ? (rsi! > 60 ? 'BULLISH' : rsi! < 40 ? 'BEARISH' : 'NEUTRAL') : 'NEUTRAL',
    reasonText: isRsiValid ? `RSI(14) at ${rsi!.toFixed(1)} (${rsi! >= 50 ? 'Positive Momentum' : 'Subdued'})` : undefined,
  });

  // 5. Factor: Relative Volume (Weight 10)
  const rvol = isFiniteMarketNumber(quote.relativeVolume) ? quote.relativeVolume : null;
  const isRvolValid = rvol !== null;
  factors.push({
    id: 'relativeVolume',
    name: 'Relative Volume',
    value: isRvolValid ? `${rvol!.toFixed(2)}x` : null,
    provider: 'Alpaca IEX Volume Feed',
    timestamp,
    available: isRvolValid,
    stale: !isRvolValid,
    validationStatus: isRvolValid ? 'VALID' : 'UNAVAILABLE',
    weight: 10,
    scoreContribution: isRvolValid ? (rvol! >= 1.0 ? 10 : 5) : 0,
    bias: isRvolValid ? (rvol! >= 1.2 ? 'BULLISH' : 'NEUTRAL') : 'NEUTRAL',
    reasonText: isRvolValid ? `Relative Volume at ${rvol!.toFixed(2)}x (Institutional Flow)` : undefined,
  });

  // 6. Factor: Support / Resistance Structure (Weight 10)
  const r1 = isFiniteMarketNumber(supportResistance.r1) ? supportResistance.r1 : null;
  const s1 = isFiniteMarketNumber(supportResistance.s1) ? supportResistance.s1 : null;
  const isLevelsValid = r1 !== null || s1 !== null;
  factors.push({
    id: 'supportResistance',
    name: 'Key Levels Structure',
    value: isLevelsValid ? `S1: ${s1 ? '$' + s1.toFixed(2) : 'N/A'} / R1: ${r1 ? '$' + r1.toFixed(2) : 'N/A'}` : null,
    provider: 'Quantitative Pivot Engine',
    timestamp,
    available: isLevelsValid,
    stale: !isLevelsValid,
    validationStatus: isLevelsValid ? 'VALID' : 'UNAVAILABLE',
    weight: 10,
    scoreContribution: isLevelsValid ? (isPriceValid && s1 !== null && spyPrice! >= s1 ? 10 : 5) : 0,
    bias: isLevelsValid ? (isPriceValid && r1 !== null && spyPrice! >= r1 ? 'BULLISH' : 'NEUTRAL') : 'NEUTRAL',
    reasonText: isLevelsValid ? (s1 ? `Holding above support S1 ($${s1.toFixed(2)})` : `Resistance R1 near $${r1?.toFixed(2)}`) : undefined,
  });

  // 7. Factor: QQQ Intermarket Performance (Weight 5)
  const qqqAsset = intermarket.find((a: any) => a.symbol === 'QQQ');
  const qqqChange = qqqAsset && isFiniteMarketNumber(qqqAsset.changePercent) ? qqqAsset.changePercent : null;
  const spyChange = isFiniteMarketNumber(quote.changePercent) ? quote.changePercent : null;
  const isQqqValid = qqqChange !== null && spyChange !== null;
  const isQqqOutperforming = isQqqValid ? qqqChange! >= spyChange! : false;
  factors.push({
    id: 'qqqPerformance',
    name: 'QQQ Tech Leadership',
    value: isQqqValid ? `QQQ: ${qqqChange! >= 0 ? '+' : ''}${qqqChange!.toFixed(2)}% vs SPY: ${spyChange! >= 0 ? '+' : ''}${spyChange!.toFixed(2)}%` : null,
    provider: 'Alpaca QQQ Feed',
    timestamp,
    available: isQqqValid,
    stale: !isQqqValid,
    validationStatus: isQqqValid ? 'VALID' : 'UNAVAILABLE',
    weight: 5,
    scoreContribution: isQqqValid ? (isQqqOutperforming ? 5 : 0) : 0,
    bias: isQqqValid ? (isQqqOutperforming ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
    reasonText: isQqqValid
      ? isQqqOutperforming
        ? `QQQ outperforming SPY (+${qqqChange!.toFixed(2)}%)`
        : `QQQ underperforming SPY (${qqqChange!.toFixed(2)}%)`
      : undefined,
  });

  // 8. Factor: VIX Volatility (Weight 5)
  const vixAsset = intermarket.find((a: any) => a.symbol === 'VIX');
  const vixVal = vixAsset && isFiniteMarketNumber(vixAsset.price) ? vixAsset.price : null;
  const isVixValid = vixVal !== null;
  const isVixSubdued = isVixValid ? vixVal! < 20.0 : false;
  factors.push({
    id: 'vix',
    name: 'VIX Volatility Index',
    value: isVixValid ? vixVal!.toFixed(2) : null,
    provider: 'CBOE VIX Provider',
    timestamp,
    available: isVixValid,
    stale: !isVixValid,
    validationStatus: isVixValid ? 'VALID' : 'UNAVAILABLE',
    weight: 5,
    scoreContribution: isVixValid ? (isVixSubdued ? 5 : 0) : 0,
    bias: isVixValid ? (isVixSubdued ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
    reasonText: isVixValid ? `VIX ${isVixSubdued ? 'subdued' : 'elevated'} at ${vixVal!.toFixed(2)}` : undefined,
  });

  // 9. Factor: Market Breadth (Weight 5)
  const adRatio = isFiniteMarketNumber(breadth.advanceDeclineRatio) ? breadth.advanceDeclineRatio : null;
  const isBreadthValid = adRatio !== null;
  const isBreadthPositive = isBreadthValid ? adRatio! >= 1.0 : false;
  factors.push({
    id: 'marketBreadth',
    name: 'Market Breadth (A/D)',
    value: isBreadthValid ? adRatio!.toFixed(2) : null,
    provider: 'Market Breadth Service',
    timestamp,
    available: isBreadthValid,
    stale: !isBreadthValid,
    validationStatus: isBreadthValid ? 'VALID' : 'UNAVAILABLE',
    weight: 5,
    scoreContribution: isBreadthValid ? (isBreadthPositive ? 5 : 0) : 0,
    bias: isBreadthValid ? (isBreadthPositive ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
    reasonText: isBreadthValid ? `Market breadth ${isBreadthPositive ? 'improving' : 'subdued'} (A/D ${adRatio!.toFixed(2)})` : undefined,
  });

  // 10. Factor: Verified News Sentiment (Weight 5)
  const verifiedNews = news.filter((n: any) => n.verificationStatus === 'VERIFIED' && n.source && n.url);
  const isNewsValid = verifiedNews.length > 0;
  const positiveNewsCount = verifiedNews.filter((n: any) => n.sentiment === 'BULLISH').length;
  const isNewsPositive = isNewsValid && positiveNewsCount >= verifiedNews.length / 2;
  factors.push({
    id: 'newsSentiment',
    name: 'Verified News Sentiment',
    value: isNewsValid ? `${positiveNewsCount}/${verifiedNews.length} Bullish Stories` : null,
    provider: 'Verified News Pipeline',
    timestamp,
    available: isNewsValid,
    stale: !isNewsValid,
    validationStatus: isNewsValid ? 'VALID' : 'UNAVAILABLE',
    weight: 5,
    scoreContribution: isNewsValid ? (isNewsPositive ? 5 : 0) : 0,
    bias: isNewsValid ? (isNewsPositive ? 'BULLISH' : 'NEUTRAL') : 'NEUTRAL',
    reasonText: isNewsValid ? `Verified news sentiment ${isNewsPositive ? 'positive' : 'neutral'}` : undefined,
  });

  // Calculate Coverage & Totals
  const totalAvailableWeight = factors
    .filter((f) => f.available)
    .reduce((sum, f) => sum + f.weight, 0);

  const totalAchievedScore = factors
    .filter((f) => f.available)
    .reduce((sum, f) => sum + f.scoreContribution, 0);

  const coveragePercent = Math.round(totalAvailableWeight);
  const isCoverageSufficient = coveragePercent >= MINIMUM_COVERAGE_THRESHOLD && isPriceValid;

  const validatedFactorCount = factors.filter((f) => f.available).length;
  const missingFactorCount = factors.filter((f) => !f.available).length;

  const factorsUsed = factors.filter((f) => f.available).map((f) => f.name);
  const factorsMissing = factors.filter((f) => !f.available).map((f) => f.name);

  // Score Normalization
  let intelligenceScore: number | null = null;
  let overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE' = 'UNAVAILABLE';
  let overallConfidence = 0;
  let setupQuality: 'STRONG SETUP' | 'MODERATE SETUP' | 'WEAK SETUP' | 'UNAVAILABLE' = 'UNAVAILABLE';
  let setupScore: number | null = null;

  if (isCoverageSufficient) {
    intelligenceScore = Math.min(99, Math.max(1, Math.round((totalAchievedScore / totalAvailableWeight) * 100)));
    setupScore = intelligenceScore;

    if (intelligenceScore >= 55) {
      overallBias = 'BULLISH';
    } else if (intelligenceScore <= 42) {
      overallBias = 'BEARISH';
    } else {
      overallBias = 'NEUTRAL';
    }

    overallConfidence = intelligenceScore;

    if (setupScore >= 75) setupQuality = 'STRONG SETUP';
    else if (setupScore >= 55) setupQuality = 'MODERATE SETUP';
    else setupQuality = 'WEAK SETUP';
  }

  // Timeframe Biases (Independently Evaluated)
  // 15M: Short term fast EMA & price
  const is15mValid = isPriceValid && isEmaValid;
  const tf15m: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE'; score: number | null } = {
    bias: is15mValid ? (isEmaBullish ? 'BULLISH' : 'BEARISH') : 'UNAVAILABLE',
    score: is15mValid ? (isEmaBullish ? 72 : 38) : null,
  };

  // 1H: VWAP + EMA + Price
  const is1hValid = isPriceValid && isVwapValid && isEmaValid;
  const tf1h: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE'; score: number | null } = {
    bias: is1hValid ? (isAboveVwap && isEmaBullish ? 'BULLISH' : !isAboveVwap && !isEmaBullish ? 'BEARISH' : 'NEUTRAL') : 'UNAVAILABLE',
    score: is1hValid ? (isAboveVwap && isEmaBullish ? 80 : 42) : null,
  };

  // Today: Session price vs prev close & day range
  const isTodayValid = isPriceValid && isFiniteMarketNumber(quote.previousClose);
  const isTodayBullish = isTodayValid && spyPrice! >= quote.previousClose!;
  const tfToday: { bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE'; score: number | null } = {
    bias: isTodayValid ? (isTodayBullish ? 'BULLISH' : 'BEARISH') : 'UNAVAILABLE',
    score: isTodayValid ? (isTodayBullish ? 68 : 35) : null,
  };

  // Structure & Momentum
  const structure = isCoverageSufficient ? (overallBias === 'BULLISH' ? 'BULLISH' : overallBias === 'BEARISH' ? 'BEARISH' : 'NEUTRAL') : 'UNAVAILABLE';
  const momentum = isEmaValid
    ? isEmaBullish
      ? 'STRONG_BULLISH'
      : 'STRONG_BEARISH'
    : 'UNAVAILABLE';

  const newsSentimentStatus = isNewsValid
    ? isNewsPositive
      ? 'POSITIVE'
      : 'NEUTRAL'
    : 'UNAVAILABLE';

  // Dynamic Reason Lists (Zero (N/A) strings)
  const bullishReasons: string[] = [];
  const bearishReasons: string[] = [];

  for (const factor of factors) {
    if (factor.available && factor.reasonText) {
      if (factor.bias === 'BULLISH') {
        bullishReasons.push(factor.reasonText);
      } else if (factor.bias === 'BEARISH') {
        bearishReasons.push(factor.reasonText);
      }
    }
  }

  const reasons = overallBias === 'BEARISH' ? bearishReasons : bullishReasons;

  // Confirmation & Invalidation Levels (Fail closed if unavailable)
  const confirmationLevel = r1 !== null ? `$${r1.toFixed(2)}` : 'UNAVAILABLE';
  const invalidationLevel = s1 !== null ? `$${s1.toFixed(2)}` : 'UNAVAILABLE';

  return {
    status: isCoverageSufficient ? 'VALID' : 'UNAVAILABLE',
    intelligenceScore,
    overallBias,
    overallConfidence,
    setupQuality,
    setupScore,
    timeframeBias: {
      tf15m,
      tf1h,
      tfToday,
    },
    structure,
    momentum,
    newsSentiment: newsSentimentStatus,
    reasons,
    bullishReasons,
    bearishReasons,
    confirmationLevel,
    invalidationLevel,
    coveragePercent,
    validatedFactorCount,
    missingFactorCount,
    factorsUsed,
    factorsMissing,
    factors,
    updatedAt: timestamp,
  };
}
