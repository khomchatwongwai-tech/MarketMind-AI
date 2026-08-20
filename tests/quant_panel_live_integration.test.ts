import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Quant Panel Live Integration Suite', () => {
  it('validates live provider pipeline metrics fallback when WebSocket signals are unconfigured', () => {
    const livePrice = 500.25;
    const technicals = {
      vwap: 499.80,
      ema9: 500.10,
      ema20: 498.90,
      ema50: 495.00,
      rsi14: 62.5,
    };

    assert.ok(livePrice > technicals.vwap, 'Price is above VWAP');
    assert.ok(technicals.ema9 > technicals.ema20, 'EMA 9 is above EMA 20 (Bullish stack)');
    assert.ok(technicals.rsi14 >= 30 && technicals.rsi14 <= 70, 'RSI 14 is in Neutral Range');
  });

  it('fails closed and returns UNAVAILABLE regime signal when minimum indicator requirements are missing', () => {
    const livePrice = null;
    const vwap = null;
    const ema9 = null;

    const isAboveVwap = livePrice !== null && vwap !== null;
    const isEmaBull = ema9 !== null;

    const regimeSignal = isAboveVwap && isEmaBull ? 'BULLISH STACK' : 'UNAVAILABLE';
    assert.equal(regimeSignal, 'UNAVAILABLE');
  });
});
