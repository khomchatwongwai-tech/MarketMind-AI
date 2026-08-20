import { ChartCandle } from '../types/chart.js';
import { isFiniteMarketNumber } from './formatters.js';

export interface IndicatorMetadata {
  source: string;
  timeframe: string;
  barsUsed: number;
  timestamp: string;
  stale: boolean;
  validationStatus: 'LIVE' | 'VALID' | 'DELAYED' | 'STALE' | 'UNAVAILABLE' | 'INSUFFICIENT_BARS' | 'INSUFFICIENT HISTORY' | 'MALFORMED';
  diagnosticReason?: string;
  unavailableReason?: string;
}

export interface IndicatorResult<T> {
  value: T | null;
  metadata: IndicatorMetadata;
}

export interface FullTechnicalEngineResults {
  ticker: string;
  timeframe: string;
  source: string;
  timestamp: string;
  barsUsed: number;
  
  vwap: IndicatorResult<number>;
  ema9: IndicatorResult<number>;
  ema20: IndicatorResult<number>;
  ema50: IndicatorResult<number>;
  ema100: IndicatorResult<number>;
  ema200: IndicatorResult<number>;
  sma20: IndicatorResult<number>;
  sma50: IndicatorResult<number>;
  sma200: IndicatorResult<number>;
  rsi14: IndicatorResult<number>;
  macd: IndicatorResult<{ line: number; signal: number; histogram: number }>;
  adx14: IndicatorResult<number>;
  atr14: IndicatorResult<number>;
  bollingerBands: IndicatorResult<{ upper: number; middle: number; lower: number; bandwidth: number }>;
  openingRange: IndicatorResult<{ high: number; low: number }>;
  preMarketRange: IndicatorResult<{ high: number; low: number }>;
  fiftyTwoWeekRange: IndicatorResult<{ high: number; low: number }>;
}

/**
 * Validates candle object for missing, null, or NaN fields.
 */
export function isCandleValid(c: ChartCandle): boolean {
  if (!c) return false;
  return (
    isFiniteMarketNumber(c.open) &&
    isFiniteMarketNumber(c.high) &&
    isFiniteMarketNumber(c.low) &&
    isFiniteMarketNumber(c.close) &&
    c.high >= c.low &&
    c.high >= c.open &&
    c.high >= c.close &&
    c.low <= c.open &&
    c.low <= c.close
  );
}

/**
 * Filter and validate candle series, removing malformed entries.
 */
export function validateCandleSeries(candles: ChartCandle[]): ChartCandle[] {
  if (!Array.isArray(candles)) return [];
  return candles.filter(isCandleValid);
}

/**
 * Check candle freshness (stale if newest candle is older than 24 hours).
 */
export function isSeriesStale(candles: ChartCandle[]): boolean {
  if (!candles || candles.length === 0) return true;
  const lastCandle = candles[candles.length - 1];
  const lastTimeMs = typeof lastCandle.time === 'number' ? lastCandle.time * 1000 : new Date(lastCandle.time).getTime();
  const nowMs = Date.now();
  // 24 hours in milliseconds
  return nowMs - lastTimeMs > 24 * 60 * 60 * 1000;
}

function buildMeta(
  source: string,
  timeframe: string,
  barsUsed: number,
  stale: boolean,
  status: IndicatorMetadata['validationStatus'],
  reason?: string
): IndicatorMetadata {
  return {
    source,
    timeframe,
    barsUsed,
    timestamp: new Date().toISOString(),
    stale,
    validationStatus: status,
    diagnosticReason: reason,
    unavailableReason: status !== 'VALID' && status !== 'LIVE' ? reason || 'Data unavailable' : undefined,
  };
}

// 1. VWAP Calculation: sum((high+low+close)/3 * vol) / sum(vol)
export function calculateVWAPFromCandles(
  candles: ChartCandle[],
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<number> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length === 0) {
    return {
      value: null,
      metadata: buildMeta(source, timeframe, 0, stale, 'UNAVAILABLE', 'No valid candle data available'),
    };
  }

  let cumPV = 0;
  let cumVol = 0;
  for (const c of valid) {
    const tp = (c.high + c.low + c.close) / 3;
    const vol = Number(c.volume) || 1; // Default to unit volume if 0
    cumPV += tp * vol;
    cumVol += vol;
  }

  if (cumVol <= 0) {
    return {
      value: null,
      metadata: buildMeta(source, timeframe, valid.length, stale, 'UNAVAILABLE', 'Insufficient cumulative volume'),
    };
  }

  const vwapVal = Number((cumPV / cumVol).toFixed(2));
  return {
    value: vwapVal,
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 2. EMA Calculation
export function calculateEMAFromCandles(
  candles: ChartCandle[],
  period: number,
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<number> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length < period) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        valid.length,
        stale,
        'INSUFFICIENT_BARS',
        `Insufficient validated history (${valid.length}/${period} bars)`
      ),
    };
  }

  const k = 2 / (period + 1);
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += valid[i].close;
  }
  let ema = initialSum / period;

  for (let i = period; i < valid.length; i++) {
    ema = (valid[i].close - ema) * k + ema;
  }

  return {
    value: Number(ema.toFixed(2)),
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 3. SMA Calculation
export function calculateSMAFromCandles(
  candles: ChartCandle[],
  period: number,
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<number> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length < period) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        valid.length,
        stale,
        'INSUFFICIENT_BARS',
        `Insufficient validated history (${valid.length}/${period} bars)`
      ),
    };
  }

  const slice = valid.slice(valid.length - period);
  const sum = slice.reduce((acc, c) => acc + c.close, 0);
  const sma = sum / period;

  return {
    value: Number(sma.toFixed(2)),
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 4. RSI(14) Wilder Smoothing Calculation
export function calculateRSIFromCandles(
  candles: ChartCandle[],
  period: number = 14,
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<number> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length <= period) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        valid.length,
        stale,
        'INSUFFICIENT_BARS',
        `Insufficient validated history (${valid.length}/${period + 1} bars)`
      ),
    };
  }

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = valid[i].close - valid[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < valid.length; i++) {
    const change = valid[i].close - valid[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return {
    value: Number(rsi.toFixed(1)),
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 5. MACD (12, 26, 9) Calculation
export function calculateMACDFromCandles(
  candles: ChartCandle[],
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<{ line: number; signal: number; histogram: number }> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length < 35) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        valid.length,
        stale,
        'INSUFFICIENT_BARS',
        `Insufficient validated history (${valid.length}/35 bars)`
      ),
    };
  }

  // Calculate EMA 12 and EMA 26 series
  const k12 = 2 / (12 + 1);
  const k26 = 2 / (26 + 1);

  let sum12 = 0;
  for (let i = 0; i < 12; i++) sum12 += valid[i].close;
  let ema12 = sum12 / 12;

  let sum26 = 0;
  for (let i = 0; i < 26; i++) sum26 += valid[i].close;
  let ema26 = sum26 / 26;

  // Advance EMA 12 to index 25
  for (let i = 12; i < 26; i++) {
    ema12 = (valid[i].close - ema12) * k12 + ema12;
  }

  const macdValues: number[] = [];
  macdValues.push(ema12 - ema26);

  for (let i = 26; i < valid.length; i++) {
    ema12 = (valid[i].close - ema12) * k12 + ema12;
    ema26 = (valid[i].close - ema26) * k26 + ema26;
    macdValues.push(ema12 - ema26);
  }

  if (macdValues.length < 9) {
    return {
      value: null,
      metadata: buildMeta(source, timeframe, valid.length, stale, 'INSUFFICIENT_BARS', 'Insufficient MACD signal bars'),
    };
  }

  // 9 EMA Signal line calculation
  const k9 = 2 / (9 + 1);
  let sigSum = 0;
  for (let i = 0; i < 9; i++) sigSum += macdValues[i];
  let signal = sigSum / 9;

  for (let i = 9; i < macdValues.length; i++) {
    signal = (macdValues[i] - signal) * k9 + signal;
  }

  const line = macdValues[macdValues.length - 1];
  const histogram = line - signal;

  return {
    value: {
      line: Number(line.toFixed(2)),
      signal: Number(signal.toFixed(2)),
      histogram: Number(histogram.toFixed(2)),
    },
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 6. ATR(14) Wilder True Range Calculation
export function calculateATRFromCandles(
  candles: ChartCandle[],
  period: number = 14,
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<number> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length <= period) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        valid.length,
        stale,
        'INSUFFICIENT_BARS',
        `Insufficient validated history (${valid.length}/${period + 1} bars)`
      ),
    };
  }

  const trs: number[] = [];
  for (let i = 1; i < valid.length; i++) {
    const tr = Math.max(
      valid[i].high - valid[i].low,
      Math.abs(valid[i].high - valid[i - 1].close),
      Math.abs(valid[i].low - valid[i - 1].close)
    );
    trs.push(tr);
  }

  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }

  return {
    value: Number(atr.toFixed(2)),
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 7. ADX(14) Average Directional Index Calculation
export function calculateADXFromCandles(
  candles: ChartCandle[],
  period: number = 14,
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<number> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length < period * 2) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        valid.length,
        stale,
        'INSUFFICIENT_BARS',
        `Insufficient validated history (${valid.length}/${period * 2} bars needed for ADX)`
      ),
    };
  }

  const trs: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < valid.length; i++) {
    const tr = Math.max(
      valid[i].high - valid[i].low,
      Math.abs(valid[i].high - valid[i - 1].close),
      Math.abs(valid[i].low - valid[i - 1].close)
    );
    trs.push(tr);

    const upMove = valid[i].high - valid[i - 1].high;
    const downMove = valid[i - 1].low - valid[i].low;

    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  let smoothedTR = trs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);

  const dxList: number[] = [];

  for (let i = period; i < trs.length; i++) {
    smoothedTR = smoothedTR - smoothedTR / period + trs[i];
    smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDMs[i];
    smoothedMinusDM = smoothedMinusDM - smoothedMinusDM / period + minusDMs[i];

    const plusDI = (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = (smoothedMinusDM / smoothedTR) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
    dxList.push(dx);
  }

  if (dxList.length < period) {
    return {
      value: null,
      metadata: buildMeta(source, timeframe, valid.length, stale, 'INSUFFICIENT_BARS', 'Insufficient DX bars'),
    };
  }

  let adx = dxList.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxList.length; i++) {
    adx = (adx * (period - 1) + dxList[i]) / period;
  }

  return {
    value: Number(adx.toFixed(1)),
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 8. Bollinger Bands (20, 2) Calculation
export function calculateBollingerBandsFromCandles(
  candles: ChartCandle[],
  period: number = 20,
  stdDevMult: number = 2,
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<{ upper: number; middle: number; lower: number; bandwidth: number }> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length < period) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        valid.length,
        stale,
        'INSUFFICIENT_BARS',
        `Insufficient validated history (${valid.length}/${period} bars)`
      ),
    };
  }

  const slice = valid.slice(valid.length - period);
  const mean = slice.reduce((acc, c) => acc + c.close, 0) / period;
  const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = mean + stdDevMult * stdDev;
  const lower = mean - stdDevMult * stdDev;
  const bandwidth = mean === 0 ? 0 : ((upper - lower) / mean) * 100;

  return {
    value: {
      upper: Number(upper.toFixed(2)),
      middle: Number(mean.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      bandwidth: Number(bandwidth.toFixed(2)),
    },
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 9. Opening Range Calculation (High/Low of first defined session bar)
export function calculateOpeningRangeFromCandles(
  candles: ChartCandle[],
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<{ high: number; low: number }> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);
  if (valid.length === 0) {
    return {
      value: null,
      metadata: buildMeta(source, timeframe, 0, stale, 'UNAVAILABLE', 'No valid candles available'),
    };
  }

  const firstBar = valid[0];
  return {
    value: {
      high: Number(firstBar.high.toFixed(2)),
      low: Number(firstBar.low.toFixed(2)),
    },
    metadata: buildMeta(source, timeframe, valid.length, stale, 'VALID'),
  };
}

// 10. Pre-Market Range Calculation
export function calculatePreMarketRangeFromCandles(
  candles: ChartCandle[],
  source: string = 'Alpaca IEX',
  timeframe: string = '15M'
): IndicatorResult<{ high: number; low: number }> {
  const valid = validateCandleSeries(candles);
  const stale = isSeriesStale(valid);

  // Extended hours pre-market check: filter candles before 09:30 AM ET
  const pmCandles = valid.filter((c) => {
    const date = new Date(typeof c.time === 'number' ? c.time * 1000 : c.time);
    const hoursET = date.getUTCHours() - 4; // Approx ET
    return hoursET >= 4 && hoursET < 9.5;
  });

  if (pmCandles.length === 0) {
    return {
      value: null,
      metadata: buildMeta(
        source,
        timeframe,
        0,
        stale,
        'UNAVAILABLE',
        'Pre-market extended-hours data unavailable'
      ),
    };
  }

  let high = pmCandles[0].high;
  let low = pmCandles[0].low;
  for (const c of pmCandles) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }

  return {
    value: {
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
    },
    metadata: buildMeta(source, timeframe, pmCandles.length, stale, 'VALID'),
  };
}

// 11. 52-Week Range Calculation
export function calculate52WeekRangeFromCandles(
  dailyCandles: ChartCandle[],
  source: string = 'Alpaca IEX',
  timeframe: string = '1D'
): IndicatorResult<{ high: number; low: number }> {
  const valid = validateCandleSeries(dailyCandles);
  const stale = isSeriesStale(valid);
  if (valid.length === 0) {
    return {
      value: null,
      metadata: buildMeta(source, timeframe, 0, stale, 'UNAVAILABLE', '52-week daily history unavailable'),
    };
  }

  // Up to 252 trading days
  const slice = valid.slice(-252);
  let high = slice[0].high;
  let low = slice[0].low;
  for (const c of slice) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }

  return {
    value: {
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
    },
    metadata: buildMeta(source, timeframe, slice.length, stale, 'VALID'),
  };
}

/**
 * Execute all 18 indicators from validated candle series.
 */
export function calculateFullTechnicalEngine(
  ticker: string,
  candles: ChartCandle[],
  dailyCandles: ChartCandle[] = [],
  timeframe: string = '15M',
  source: string = 'Alpaca IEX'
): FullTechnicalEngineResults {
  const valid = validateCandleSeries(candles);
  const timestamp = new Date().toISOString();

  return {
    ticker,
    timeframe,
    source,
    timestamp,
    barsUsed: valid.length,

    vwap: calculateVWAPFromCandles(valid, source, timeframe),
    ema9: calculateEMAFromCandles(valid, 9, source, timeframe),
    ema20: calculateEMAFromCandles(valid, 20, source, timeframe),
    ema50: calculateEMAFromCandles(valid, 50, source, timeframe),
    ema100: calculateEMAFromCandles(dailyCandles.length >= 100 ? dailyCandles : valid, 100, source, dailyCandles.length >= 100 ? '1D' : timeframe),
    ema200: calculateEMAFromCandles(dailyCandles.length >= 200 ? dailyCandles : valid, 200, source, dailyCandles.length >= 200 ? '1D' : timeframe),
    sma20: calculateSMAFromCandles(valid, 20, source, timeframe),
    sma50: calculateSMAFromCandles(valid, 50, source, timeframe),
    sma200: calculateSMAFromCandles(dailyCandles.length >= 200 ? dailyCandles : valid, 200, source, dailyCandles.length >= 200 ? '1D' : timeframe),
    rsi14: calculateRSIFromCandles(valid, 14, source, timeframe),
    macd: calculateMACDFromCandles(valid, source, timeframe),
    adx14: calculateADXFromCandles(valid, 14, source, timeframe),
    atr14: calculateATRFromCandles(valid, 14, source, timeframe),
    bollingerBands: calculateBollingerBandsFromCandles(valid, 20, 2, source, timeframe),
    openingRange: calculateOpeningRangeFromCandles(valid, source, timeframe),
    preMarketRange: calculatePreMarketRangeFromCandles(valid, source, timeframe),
    fiftyTwoWeekRange: calculate52WeekRangeFromCandles(dailyCandles, source, '1D'),
  };
}
