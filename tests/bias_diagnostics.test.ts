import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBiasDiagnostics } from '../src/utils/biasDiagnostics.js';

describe('Bias Panel Diagnostics Suite', () => {
  it('correctly evaluates Bullish bias when bullish probability is highest', () => {
    const res = evaluateBiasDiagnostics({
      bullish: 65,
      bearish: 25,
      neutral: 10,
      aiConfidence: 85,
    });
    assert.equal(res.bias, 'BULLISH');
    assert.equal(res.confidence, 85);
    assert.deepEqual(res.reasons, []);
  });

  it('correctly evaluates Bearish bias when bearish probability is highest', () => {
    const res = evaluateBiasDiagnostics({
      bullish: 20,
      bearish: 70,
      neutral: 10,
      aiConfidence: 90,
    });
    assert.equal(res.bias, 'BEARISH');
    assert.equal(res.confidence, 90);
    assert.deepEqual(res.reasons, []);
  });

  it('correctly evaluates Neutral bias when probabilities are equal or neutral is highest', () => {
    const res = evaluateBiasDiagnostics({
      bullish: 30,
      bearish: 30,
      neutral: 40,
      aiConfidence: 70,
    });
    assert.equal(res.bias, 'NEUTRAL');
    assert.equal(res.confidence, 70);
    assert.deepEqual(res.reasons, []);
  });

  it('returns Loading bias state when isLoading is true', () => {
    const res = evaluateBiasDiagnostics(null, null, null, true);
    assert.equal(res.bias, 'LOADING');
    assert.equal(res.confidence, null);
    assert.equal(res.reasons.length, 1);
  });

  it('returns Unavailable bias state with sanitized missing-input diagnostics when inputs are null', () => {
    const res = evaluateBiasDiagnostics(
      { status: 'UNAVAILABLE', unavailableReasons: ['Waiting for VIX', 'Waiting for 10Y Treasury key: secret_12345678901234567890'] },
      { relativeVolume: null as any },
      { VIX: { price: null }, US10Y: { price: null } }
    );
    assert.equal(res.bias, 'UNAVAILABLE');
    assert.equal(res.confidence, null);
    assert.ok(res.reasons.includes('Waiting for VIX'));
    assert.ok(res.reasons.some((r) => r.includes('[REDACTED]')));
  });

  it('builds sanitized missing input list dynamically when unavailableReasons is not provided', () => {
    const res = evaluateBiasDiagnostics(
      null,
      { relativeVolume: null as any },
      { VIX: { price: null }, US10Y: { price: null } }
    );
    assert.equal(res.bias, 'UNAVAILABLE');
    assert.equal(res.confidence, null);
    assert.ok(res.reasons.includes('Waiting for VIX'));
    assert.ok(res.reasons.includes('Waiting for 10Y Treasury'));
    assert.ok(res.reasons.includes('Waiting for relative volume'));
  });
});
