import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRealtimeIntelligence } from '../src/utils/realtimeIntelligenceEngine.js';

describe('Real-Time MarketMind Intelligence Engine Suite', () => {
  it('1. Accepts valid SPY live quote', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25, change: 2.50, changePercent: 0.50, dataSource: 'Alpaca IEX' },
    };
    const res = calculateRealtimeIntelligence(data);
    const spyFactor = res.factors.find((f) => f.id === 'spyPrice');
    assert.ok(spyFactor !== undefined);
    assert.equal(spyFactor!.available, true);
    assert.equal(spyFactor!.value, '$500.25');
  });

  it('2 & 3. VWAP unavailable -> cannot contribute to score and cannot appear in reasons', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25, change: 2.50, changePercent: 0.50 },
      technicals: { vwap: null }, // Missing VWAP
    };
    const res = calculateRealtimeIntelligence(data);
    const vwapFactor = res.factors.find((f) => f.id === 'vwap');
    assert.equal(vwapFactor!.available, false);
    assert.equal(vwapFactor!.scoreContribution, 0);

    const hasVwapReason = res.reasons.some((r) => r.includes('VWAP'));
    assert.equal(hasVwapReason, false, 'VWAP must not appear in reasons when unavailable');
  });

  it('4. EMA missing -> cannot appear in reasons', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25 },
      technicals: { ema9: null, ema20: null },
    };
    const res = calculateRealtimeIntelligence(data);
    const hasEmaReason = res.reasons.some((r) => r.includes('EMA'));
    assert.equal(hasEmaReason, false, 'EMA must not appear in reasons when missing');
  });

  it('5. VIX missing -> cannot affect bias', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25 },
      intermarket: [], // No VIX
    };
    const res = calculateRealtimeIntelligence(data);
    const vixFactor = res.factors.find((f) => f.id === 'vix');
    assert.equal(vixFactor!.available, false);
    assert.equal(vixFactor!.scoreContribution, 0);
  });

  it('6. Breadth missing -> cannot affect bias', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25 },
      breadth: { advanceDeclineRatio: null },
    };
    const res = calculateRealtimeIntelligence(data);
    const breadthFactor = res.factors.find((f) => f.id === 'marketBreadth');
    assert.equal(breadthFactor!.available, false);
    assert.equal(breadthFactor!.scoreContribution, 0);
  });

  it('7. News unavailable -> sentiment unavailable', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25 },
      news: [], // Empty news
    };
    const res = calculateRealtimeIntelligence(data);
    assert.equal(res.newsSentiment, 'UNAVAILABLE');
  });

  it('8. Missing factors do not receive default points', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25 },
    };
    const res = calculateRealtimeIntelligence(data);
    const missingFactors = res.factors.filter((f) => !f.available);
    for (const f of missingFactors) {
      assert.equal(f.scoreContribution, 0, `Factor ${f.id} must contribute 0 points when unavailable`);
    }
  });

  it('9 & 10. Coverage below threshold (60%) -> score and bias are UNAVAILABLE', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25 }, // Only price valid (weight 15 / 100 = 15% coverage)
    };
    const res = calculateRealtimeIntelligence(data);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.intelligenceScore, null);
    assert.equal(res.overallBias, 'UNAVAILABLE');
    assert.equal(res.setupQuality, 'UNAVAILABLE');
    assert.equal(res.setupScore, null);
  });

  it('11. Setup quality unavailable does not display numeric score', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: null }, // Missing price
    };
    const res = calculateRealtimeIntelligence(data);
    assert.equal(res.setupScore, null);
    assert.equal(res.setupQuality, 'UNAVAILABLE');
  });

  it('12. No reason contains (N/A)', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25, change: 2.50 },
      technicals: { vwap: null, ema9: null },
      supportResistance: { r1: null, s1: null },
    };
    const res = calculateRealtimeIntelligence(data);
    for (const r of res.reasons) {
      assert.equal(r.includes('(N/A)'), false, `Reason "${r}" must not contain (N/A)`);
    }
  });

  it('13. No fabricated support/resistance levels', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25 },
      supportResistance: { r1: null, s1: null },
    };
    const res = calculateRealtimeIntelligence(data);
    assert.equal(res.confirmationLevel, 'UNAVAILABLE');
    assert.equal(res.invalidationLevel, 'UNAVAILABLE');
  });

  it('14. No fabricated relative volume', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25, relativeVolume: null },
    };
    const res = calculateRealtimeIntelligence(data);
    const rvolFactor = res.factors.find((f) => f.id === 'relativeVolume');
    assert.equal(rvolFactor!.available, false);
    assert.equal(rvolFactor!.value, null);
  });

  it('15. Exposes provenance coverage metrics accurately', () => {
    const data: any = {
      quote: { ticker: 'SPY', price: 500.25, change: 2.50, changePercent: 0.50, relativeVolume: 1.5 },
      technicals: { vwap: 499.00, ema9: 499.50, ema20: 498.00, rsi14: 62.0 },
      supportResistance: { r1: 505.00, s1: 495.00 },
    };
    const res = calculateRealtimeIntelligence(data);
    assert.ok(res.coveragePercent >= 60);
    assert.equal(res.status, 'VALID');
    assert.ok(res.intelligenceScore !== null);
    assert.ok(res.validatedFactorCount > 0);
  });
});
