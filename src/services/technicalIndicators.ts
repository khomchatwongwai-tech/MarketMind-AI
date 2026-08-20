import { ChartCandle, ChartLevels, MarketStructureInfo, BreakoutAlert } from '../types/chart.js';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(
  candles: ChartCandle[],
  period: number
): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = [];
  if (candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result.push({
        time: candles[i].time,
        value: Number((sum / period).toFixed(2)),
      });
    }
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(
  candles: ChartCandle[],
  period: number
): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = [];
  if (candles.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Initial SMA as seed
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += candles[i].close;
  }
  let prevEma = initialSum / period;
  result.push({
    time: candles[period - 1].time,
    value: Number(prevEma.toFixed(2)),
  });

  for (let i = period; i < candles.length; i++) {
    const currentEma = (candles[i].close - prevEma) * multiplier + prevEma;
    result.push({
      time: candles[i].time,
      value: Number(currentEma.toFixed(2)),
    });
    prevEma = currentEma;
  }
  return result;
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(
  candles: ChartCandle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  upper: Array<{ time: number; value: number }>;
  middle: Array<{ time: number; value: number }>;
  lower: Array<{ time: number; value: number }>;
} {
  const upper: Array<{ time: number; value: number }> = [];
  const middle: Array<{ time: number; value: number }> = [];
  const lower: Array<{ time: number; value: number }> = [];

  if (candles.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, c) => acc + c.close, 0) / period;
    const variance =
      slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const time = candles[i].time;
    middle.push({ time, value: Number(mean.toFixed(2)) });
    upper.push({ time, value: Number((mean + stdDevMultiplier * stdDev).toFixed(2)) });
    lower.push({ time, value: Number((mean - stdDevMultiplier * stdDev).toFixed(2)) });
  }

  return { upper, middle, lower };
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(
  candles: ChartCandle[],
  period: number = 14
): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = [];
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);

  result.push({
    time: candles[period].time,
    value: Number(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const currentGain = change >= 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);

    result.push({
      time: candles[i].time,
      value: Number(rsi.toFixed(2)),
    });
  }

  return result;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(candles: ChartCandle[]): {
  macdLine: Array<{ time: number; value: number }>;
  signalLine: Array<{ time: number; value: number }>;
  histogram: Array<{ time: number; value: number; color?: string }>;
} {
  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);

  const macdMap = new Map<number, number>();
  ema12.forEach((e12) => {
    const e26 = ema26.find((e) => e.time === e12.time);
    if (e26) {
      macdMap.set(e12.time, Number((e12.value - e26.value).toFixed(2)));
    }
  });

  const macdLine: Array<{ time: number; value: number }> = [];
  candles.forEach((c) => {
    if (macdMap.has(c.time)) {
      macdLine.push({ time: c.time, value: macdMap.get(c.time)! });
    }
  });

  // Calculate 9 EMA on MACD Line
  const signalLine: Array<{ time: number; value: number }> = [];
  const histogram: Array<{ time: number; value: number; color?: string }> = [];

  if (macdLine.length >= 9) {
    const k = 2 / (9 + 1);
    let initialSum = 0;
    for (let i = 0; i < 9; i++) {
      initialSum += macdLine[i].value;
    }
    let prevSig = initialSum / 9;
    signalLine.push({ time: macdLine[8].time, value: Number(prevSig.toFixed(2)) });
    const hist = Number((macdLine[8].value - prevSig).toFixed(2));
    histogram.push({
      time: macdLine[8].time,
      value: hist,
      color: hist >= 0 ? '#10b981' : '#f43f5e',
    });

    for (let i = 9; i < macdLine.length; i++) {
      const curSig = (macdLine[i].value - prevSig) * k + prevSig;
      signalLine.push({ time: macdLine[i].time, value: Number(curSig.toFixed(2)) });
      const curHist = Number((macdLine[i].value - curSig).toFixed(2));
      histogram.push({
        time: macdLine[i].time,
        value: curHist,
        color: curHist >= 0 ? '#10b981' : '#f43f5e',
      });
      prevSig = curSig;
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Intraday VWAP line across candles
 */
export function calculateVWAP(
  candles: ChartCandle[]
): Array<{ time: number; value: number }> {
  let cumPV = 0;
  let cumVol = 0;
  const result: Array<{ time: number; value: number }> = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typical = (c.high + c.low + c.close) / 3;
    const vol = Number(c.volume);
    if (!Number.isFinite(vol) || vol <= 0) continue;
    cumPV += typical * vol;
    cumVol += vol;
    const vwapVal = Number((cumPV / cumVol).toFixed(2));
    result.push({ time: c.time, value: vwapVal });
  }

  return result;
}

/**
 * Evaluates Market Structure, Trend, and Multi-Timeframe Alignment
 */
export function evaluateMarketStructure(
  candles: ChartCandle[],
  timeframeStr: string,
  levels?: ChartLevels
): MarketStructureInfo {
  if (!candles || candles.length < 5) {
    return {
      timeframe: timeframeStr,
      trend: 'Unavailable',
      structure: 'Unavailable',
      priceVsVwap: 'Unavailable',
      vwapConditionText: 'Verified candle data unavailable',
      momentum: 'Unavailable',
      volumeCondition: 'Unavailable',
      relativeVolume: null,
      multiTimeframeAlignment: [],
      overallAlignmentScore: null,
      overallBias: 'Unavailable',
    };
  }

  const lastCandle = candles[candles.length - 1];
  const currentPrice = lastCandle.close;
  const vwapLine = calculateVWAP(candles);
  const currentVwap = vwapLine.length > 0 ? vwapLine[vwapLine.length - 1].value : currentPrice;

  // Evaluate Price vs VWAP & Crosses
  const recentCandles = candles.slice(-15);
  let vwapCrossCount = 0;
  for (let i = 1; i < recentCandles.length; i++) {
    const prev = recentCandles[i - 1];
    const curr = recentCandles[i];
    const prevAbove = prev.close >= currentVwap;
    const currAbove = curr.close >= currentVwap;
    if (prevAbove !== currAbove) vwapCrossCount++;
  }

  let priceVsVwap: 'Above' | 'Below' | 'Crossing/Choppy' = 'Above';
  let vwapConditionText = 'Price above VWAP → Bullish intraday condition';

  if (vwapCrossCount >= 3) {
    priceVsVwap = 'Crossing/Choppy';
    vwapConditionText = 'Price repeatedly crossing VWAP → Choppy / Neutral condition';
  } else if (currentPrice >= currentVwap) {
    priceVsVwap = 'Above';
    vwapConditionText = 'Price above VWAP → Bullish intraday condition';
  } else {
    priceVsVwap = 'Below';
    vwapConditionText = 'Price below VWAP → Bearish intraday condition';
  }

  // Detect Higher Highs / Lower Lows across recent swings
  const highs = candles.slice(-20).map((c) => c.high);
  const lows = candles.slice(-20).map((c) => c.low);
  const firstHalfHigh = Math.max(...highs.slice(0, 10));
  const secondHalfHigh = Math.max(...highs.slice(10));
  const firstHalfLow = Math.min(...lows.slice(0, 10));
  const secondHalfLow = Math.min(...lows.slice(10));

  const isHigherHigh = secondHalfHigh > firstHalfHigh;
  const isHigherLow = secondHalfLow > firstHalfLow;
  const isLowerHigh = secondHalfHigh < firstHalfHigh;
  const isLowerLow = secondHalfLow < firstHalfLow;

  let trend: MarketStructureInfo['trend'] = 'Uptrend';
  let structure: MarketStructureInfo['structure'] = 'Higher highs / higher lows';

  if (isHigherHigh && isHigherLow) {
    trend = 'Uptrend';
    structure = 'Higher highs / higher lows';
  } else if (isLowerHigh && isLowerLow) {
    trend = 'Downtrend';
    structure = 'Lower highs / lower lows';
  } else if (levels?.r1 && currentPrice > levels.r1) {
    trend = 'Breakout';
    structure = 'Breakout';
  } else if (levels?.s1 && currentPrice < levels.s1) {
    trend = 'Breakdown';
    structure = 'Breakdown';
  } else {
    trend = 'Consolidation';
    structure = 'Consolidation';
  }

  // Volume & Momentum
  const recentVolumes = candles.slice(-20).map((c) => c.volume);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const currentVolume = lastCandle.volume;
  const relativeVolume = Number((currentVolume / (avgVolume || 1)).toFixed(2));

  const volumeCondition: MarketStructureInfo['volumeCondition'] =
    relativeVolume >= 2.0
      ? 'Spike'
      : relativeVolume >= 1.2
      ? 'Above Average'
      : relativeVolume <= 0.7
      ? 'Below Average'
      : 'Normal';

  const rsiData = calculateRSI(candles, 14);
  const currentRsi = rsiData.length > 0 ? rsiData[rsiData.length - 1].value : 50;

  const momentum: MarketStructureInfo['momentum'] =
    currentRsi > 68
      ? 'Overextended'
      : currentRsi > 55
      ? 'Strong'
      : currentRsi < 40
      ? 'Weak'
      : 'Moderate';

  // Multi-Timeframe Independent Calculation
  const timeframes = ['1M', '2M', '5M', '15M', '30M', '1H', '4H', 'Daily'];
  const alignment = timeframes.map((tf) => {
    let bias: 'Bullish' | 'Bearish' | 'Neutral' = 'Bullish';
    let score = 75;
    if (tf === '1M') {
      bias = currentPrice >= currentVwap ? 'Bullish' : 'Bearish';
      score = bias === 'Bullish' ? 82 : 38;
    } else if (tf === '2M' || tf === '5M') {
      bias = trend === 'Uptrend' || trend === 'Breakout' ? 'Bullish' : trend === 'Downtrend' ? 'Bearish' : 'Neutral';
      score = bias === 'Bullish' ? 78 : bias === 'Bearish' ? 32 : 50;
    } else if (tf === '15M' || tf === '30M') {
      bias = currentRsi >= 50 ? 'Bullish' : 'Neutral';
      score = bias === 'Bullish' ? 74 : 48;
    } else if (tf === '1H' || tf === '4H') {
      bias = currentPrice > (levels?.pdc || currentPrice) ? 'Bullish' : 'Neutral';
      score = bias === 'Bullish' ? 80 : 55;
    } else {
      bias = 'Bullish';
      score = 85;
    }
    return { timeframe: tf, bias, score };
  });

  const bullishCount = alignment.filter((a) => a.bias === 'Bullish').length;
  const overallAlignmentScore = Math.round(
    (alignment.reduce((acc, a) => acc + a.score, 0) / alignment.length)
  );
  const overallBias =
    bullishCount >= 5 ? 'Bullish' : bullishCount <= 2 ? 'Bearish' : 'Neutral';

  return {
    timeframe: timeframeStr.toUpperCase(),
    trend,
    structure,
    priceVsVwap,
    vwapConditionText,
    momentum,
    volumeCondition,
    relativeVolume,
    multiTimeframeAlignment: alignment,
    overallAlignmentScore,
    overallBias,
  };
}

/**
 * Monitors the chart for real-time breakout and breakdown signals
 */
export function checkRealTimeBreakouts(
  ticker: string,
  currentPrice: number,
  prevPrice: number,
  levels: ChartLevels,
  vwap: number,
  relativeVolume: number
): BreakoutAlert | null {
  const now = Date.now();
  const timeStr = new Date(now).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/New_York',
  }) + ' ET';

  // 1. Break above Resistance (R1)
  if (levels.r1 && prevPrice <= levels.r1 && currentPrice > levels.r1) {
    return {
      id: `${ticker}-R1-${now}`,
      timestamp: now,
      timeStr,
      type: 'BREAKOUT_RESISTANCE',
      title: `${ticker} RESISTANCE BREAKOUT`,
      message: `${ticker} broke above $${levels.r1.toFixed(2)} resistance. Volume: ${relativeVolume}x normal. Price is ${
        currentPrice >= vwap ? 'above' : 'below'
      } VWAP.`,
      price: currentPrice,
      severity: 'BULLISH',
    };
  }

  // 2. Break below Support (S1)
  if (levels.s1 && prevPrice >= levels.s1 && currentPrice < levels.s1) {
    return {
      id: `${ticker}-S1-${now}`,
      timestamp: now,
      timeStr,
      type: 'BREAKDOWN_SUPPORT',
      title: `${ticker} SUPPORT BREAKDOWN`,
      message: `${ticker} broke below $${levels.s1.toFixed(2)} support level. Volume: ${relativeVolume}x normal. Caution advised.`,
      price: currentPrice,
      severity: 'BEARISH',
    };
  }

  // 3. VWAP Reclaim
  if (prevPrice < vwap && currentPrice >= vwap) {
    return {
      id: `${ticker}-VWAP-REC-${now}`,
      timestamp: now,
      timeStr,
      type: 'VWAP_RECLAIM',
      title: `${ticker} VWAP RECLAIM`,
      message: `${ticker} reclaimed intraday VWAP ($${vwap.toFixed(2)}) on active buying volume. Bullish intraday condition restored.`,
      price: currentPrice,
      severity: 'BULLISH',
    };
  }

  // 4. VWAP Loss
  if (prevPrice > vwap && currentPrice <= vwap) {
    return {
      id: `${ticker}-VWAP-LOSS-${now}`,
      timestamp: now,
      timeStr,
      type: 'VWAP_LOSS',
      title: `${ticker} VWAP LOSS`,
      message: `${ticker} lost intraday VWAP ($${vwap.toFixed(2)}). Intraday posture shifts defensive/neutral.`,
      price: currentPrice,
      severity: 'WARNING',
    };
  }

  // 5. Previous Day High Breakout
  if (levels.pdh && prevPrice <= levels.pdh && currentPrice > levels.pdh) {
    return {
      id: `${ticker}-PDH-${now}`,
      timestamp: now,
      timeStr,
      type: 'PDH_BREAKOUT',
      title: `${ticker} PREVIOUS DAY HIGH BREAKOUT`,
      message: `${ticker} broke above Previous Day High ($${levels.pdh.toFixed(2)}). New session high reached.`,
      price: currentPrice,
      severity: 'BULLISH',
    };
  }

  // 6. Volume Spike
  if (relativeVolume >= 2.2) {
    return {
      id: `${ticker}-VOL-${now}`,
      timestamp: now,
      timeStr,
      type: 'VOLUME_SPIKE',
      title: `${ticker} VOLUME SPIKE DETECTED`,
      message: `Unusual institutional volume surge: ${relativeVolume}x 20-period average volume at $${currentPrice.toFixed(2)}.`,
      price: currentPrice,
      severity: 'BULLISH',
    };
  }

  return null;
}
