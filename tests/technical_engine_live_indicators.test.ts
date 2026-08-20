import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChartCandle } from '../src/types/chart.js';
import {
  calculateVWAPFromCandles,
  calculateEMAFromCandles,
  calculateSMAFromCandles,
  calculateRSIFromCandles,
  calculateMACDFromCandles,
  calculateATRFromCandles,
  calculateADXFromCandles,
  calculateBollingerBandsFromCandles,
  calculateOpeningRangeFromCandles,
  calculatePreMarketRangeFromCandles,
  calculate52WeekRangeFromCandles,
  calculateFullTechnicalEngine,
  validateCandleSeries,
  isSeriesStale,
} from '../src/utils/technicalEngineCalculator.js';

function generateMockCandles(count: number, startPrice: number = 500, trend: number = 0.5): ChartCandle[] {
  const candles: ChartCandle[] = [];
  const now = Date.now() / 1000;
  let price = startPrice;

  for (let i = 0; i < count; i++) {
    const time = Math.floor(now - (count - i) * 60);
    const open = price;
    const close = price + (i % 2 === 0 ? trend : -trend * 0.5);
    const high = Math.max(open, close) + 0.5;
    const low = Math.min(open, close) - 0.5;
    const volume = 1000 + i * 10;
    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

describe('Technical Engine Live Indicators Test Suite', () => {
  it('1. VWAP calculation from valid candles', () => {
    const candles = generateMockCandles(20, 500);
    const res = calculateVWAPFromCandles(candles, 'Alpaca IEX', '15M');
    assert.equal(res.metadata.validationStatus, 'VALID');
    assert.ok(res.value !== null);
    assert.ok(typeof res.value === 'number');
    assert.ok(res.value > 490 && res.value < 520);
  });

  it('2. EMA 9, 20, 50, 100, 200 calculation from valid candles', () => {
    const candles = generateMockCandles(210, 500);
    const ema9 = calculateEMAFromCandles(candles, 9, 'Alpaca IEX', '15M');
    const ema20 = calculateEMAFromCandles(candles, 20, 'Alpaca IEX', '15M');
    const ema50 = calculateEMAFromCandles(candles, 50, 'Alpaca IEX', '15M');
    const ema100 = calculateEMAFromCandles(candles, 100, 'Alpaca IEX', '1D');
    const ema200 = calculateEMAFromCandles(candles, 200, 'Alpaca IEX', '1D');

    assert.equal(ema9.metadata.validationStatus, 'VALID');
    assert.ok(ema9.value !== null);
    assert.equal(ema20.metadata.validationStatus, 'VALID');
    assert.ok(ema20.value !== null);
    assert.equal(ema50.metadata.validationStatus, 'VALID');
    assert.ok(ema50.value !== null);
    assert.equal(ema100.metadata.validationStatus, 'VALID');
    assert.ok(ema100.value !== null);
    assert.equal(ema200.metadata.validationStatus, 'VALID');
    assert.ok(ema200.value !== null);
  });

  it('3. SMA 20, 50, 200 calculation from valid candles', () => {
    const candles = generateMockCandles(210, 500);
    const sma20 = calculateSMAFromCandles(candles, 20, 'Alpaca IEX', '15M');
    const sma50 = calculateSMAFromCandles(candles, 50, 'Alpaca IEX', '15M');
    const sma200 = calculateSMAFromCandles(candles, 200, 'Alpaca IEX', '1D');

    assert.equal(sma20.metadata.validationStatus, 'VALID');
    assert.ok(sma20.value !== null);
    assert.equal(sma50.metadata.validationStatus, 'VALID');
    assert.ok(sma50.value !== null);
    assert.equal(sma200.metadata.validationStatus, 'VALID');
    assert.ok(sma200.value !== null);
  });

  it('4. RSI 14 calculation from valid candles', () => {
    const candles = generateMockCandles(25, 500);
    const rsi = calculateRSIFromCandles(candles, 14, 'Alpaca IEX', '15M');
    assert.equal(rsi.metadata.validationStatus, 'VALID');
    assert.ok(rsi.value !== null);
    assert.ok(rsi.value >= 0 && rsi.value <= 100);
  });

  it('5. MACD calculation (line, signal, histogram)', () => {
    const candles = generateMockCandles(40, 500);
    const macd = calculateMACDFromCandles(candles, 'Alpaca IEX', '15M');
    assert.equal(macd.metadata.validationStatus, 'VALID');
    assert.ok(macd.value !== null);
    assert.ok(typeof macd.value.line === 'number');
    assert.ok(typeof macd.value.signal === 'number');
    assert.ok(typeof macd.value.histogram === 'number');
  });

  it('6. ATR 14 calculation', () => {
    const candles = generateMockCandles(25, 500);
    const atr = calculateATRFromCandles(candles, 14, 'Alpaca IEX', '15M');
    assert.equal(atr.metadata.validationStatus, 'VALID');
    assert.ok(atr.value !== null);
    assert.ok(atr.value > 0);
  });

  it('7. ADX 14 calculation', () => {
    const candles = generateMockCandles(35, 500);
    const adx = calculateADXFromCandles(candles, 14, 'Alpaca IEX', '15M');
    assert.equal(adx.metadata.validationStatus, 'VALID');
    assert.ok(adx.value !== null);
    assert.ok(adx.value >= 0 && adx.value <= 100);
  });

  it('8. Bollinger Bands (20, 2) calculation', () => {
    const candles = generateMockCandles(25, 500);
    const bb = calculateBollingerBandsFromCandles(candles, 20, 2, 'Alpaca IEX', '15M');
    assert.equal(bb.metadata.validationStatus, 'VALID');
    assert.ok(bb.value !== null);
    assert.ok(bb.value.upper > bb.value.middle);
    assert.ok(bb.value.middle > bb.value.lower);
  });

  it('9. Opening range calculation', () => {
    const candles = generateMockCandles(15, 500);
    const op = calculateOpeningRangeFromCandles(candles, 'Alpaca IEX', '15M');
    assert.equal(op.metadata.validationStatus, 'VALID');
    assert.ok(op.value !== null);
    assert.ok(op.value.high >= op.value.low);
  });

  it('10. 52-Week range from daily bars', () => {
    const dailyCandles = generateMockCandles(252, 450, 0.2);
    const range52 = calculate52WeekRangeFromCandles(dailyCandles, 'Alpaca IEX', '1D');
    assert.equal(range52.metadata.validationStatus, 'VALID');
    assert.ok(range52.value !== null);
    assert.ok(range52.value.high >= range52.value.low);
  });

  it('11. Insufficient bars returns UNAVAILABLE / INSUFFICIENT_BARS with reason', () => {
    const shortCandles = generateMockCandles(5, 500);
    const ema50 = calculateEMAFromCandles(shortCandles, 50, 'Alpaca IEX', '15M');
    assert.equal(ema50.value, null);
    assert.equal(ema50.metadata.validationStatus, 'INSUFFICIENT_BARS');
    assert.ok(ema50.metadata.diagnosticReason?.includes('Insufficient validated history'));
    assert.ok(ema50.metadata.unavailableReason?.includes('Insufficient validated history'));

    const adx = calculateADXFromCandles(shortCandles, 14, 'Alpaca IEX', '15M');
    assert.equal(adx.value, null);
    assert.equal(adx.metadata.validationStatus, 'INSUFFICIENT_BARS');
  });

  it('12. Stale candles are detected accurately', () => {
    const oldTime = Math.floor(Date.now() / 1000) - 48 * 3600; // 48 hours ago
    const staleCandle: ChartCandle = { time: oldTime, open: 500, high: 502, low: 498, close: 501, volume: 1000 };
    assert.equal(isSeriesStale([staleCandle]), true);

    const freshCandles = generateMockCandles(10);
    assert.equal(isSeriesStale(freshCandles), false);
  });

  it('13. Malformed candles are filtered out strictly', () => {
    const mixedCandles: any[] = [
      { time: 1000, open: 500, high: 502, low: 498, close: 501, volume: 1000 },
      { time: 1060, open: null, high: 502, low: 498, close: 501 }, // Malformed
      { time: 1120, open: 500, high: 490, low: 510, close: 501 }, // High < Low
      { time: 1180, open: 502, high: 505, low: 500, close: 504, volume: 1200 },
    ];

    const valid = validateCandleSeries(mixedCandles);
    assert.equal(valid.length, 2);
  });

  it('14. Timeframe switching recalculates indicators per timeframe accurately', () => {
    const candles1M = generateMockCandles(60, 500, 0.1);
    const candles15M = generateMockCandles(40, 500, 0.8);

    const calc1M = calculateFullTechnicalEngine('SPY', candles1M, [], '1M', 'Alpaca IEX');
    const calc15M = calculateFullTechnicalEngine('SPY', candles15M, [], '15M', 'Alpaca IEX');

    assert.equal(calc1M.timeframe, '1M');
    assert.equal(calc15M.timeframe, '15M');
    assert.equal(calc1M.barsUsed, 60);
    assert.equal(calc15M.barsUsed, 40);
    assert.notEqual(calc1M.ema9.value, calc15M.ema9.value);
  });

  it('15. Zero synthetic values generated on empty candles', () => {
    const res = calculateFullTechnicalEngine('SPY', [], [], '15M', 'Alpaca IEX');
    assert.equal(res.vwap.value, null);
    assert.equal(res.ema9.value, null);
    assert.equal(res.ema20.value, null);
    assert.equal(res.ema50.value, null);
    assert.equal(res.rsi14.value, null);
    assert.equal(res.macd.value, null);
    assert.equal(res.atr14.value, null);
    assert.equal(res.adx14.value, null);
    assert.equal(res.bollingerBands.value, null);
    assert.equal(res.fiftyTwoWeekRange.value, null);
  });
});
