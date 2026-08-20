import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildValidatedDataManifest,
  getStrictGuardrailInstruction,
} from '../src/utils/validatedDataManifest.js';
import {
  executeWhyIsItMoving,
  executeAskMarketMind,
  executeAnalyzeMarket,
} from '../src/services/geminiMarketService.js';

describe('AI Validated Data Guardrails Suite', () => {
  it('builds a validated-data manifest and correctly includes valid metrics while omitting unavailable ones', () => {
    const mockData = {
      quote: {
        ticker: 'SPY',
        price: 500.50,
        change: 2.50,
        changePercent: 0.50,
        volume: 45000000,
        dayHigh: 502.00,
        dayLow: 498.00,
        dataSource: 'Alpaca IEX',
      },
      technicals: {
        vwap: null, // UNAVAILABLE
        ema9: 499.50, // VALID
        ema20: null, // UNAVAILABLE
        rsi14: 'N/A', // MALFORMED/UNAVAILABLE
      },
      supportResistance: {
        r1: null,
        s1: null,
      },
    };

    const manifest = buildValidatedDataManifest(mockData, 'SPY');

    assert.equal(manifest.fields.currentPrice.available, true);
    assert.equal(manifest.fields.currentPrice.value, 500.50);

    assert.equal(manifest.fields.vwap.available, false);
    assert.ok(manifest.omittedFields.includes('vwap'));

    assert.equal(manifest.fields.ema9.available, true);
    assert.equal(manifest.fields.ema9.value, 499.50);

    assert.equal(manifest.fields.rsi14.available, false);
    assert.ok(manifest.omittedFields.includes('rsi14'));

    const instruction = getStrictGuardrailInstruction(manifest);
    assert.ok(instruction.includes('EXCLUDED / OMITTED METRICS'));
    assert.ok(instruction.includes('vwap'));
    assert.ok(instruction.includes('rsi14'));
  });

  it('VWAP unavailable -> executeWhyIsItMoving fallback cannot mention VWAP or label category VWAP', async () => {
    const mockData = {
      quote: {
        ticker: 'SPY',
        price: 505.00,
        change: 1.20,
        changePercent: 0.24,
      },
      technicals: {
        vwap: null, // Missing VWAP
        ema9: 504.00,
      },
    };

    const res = await executeWhyIsItMoving({ ticker: 'SPY', marketData: mockData, aiClient: null });

    assert.equal(res.status, 'VERIFIED');
    assert.equal(res.keyLevels.vwap, 'Unavailable');

    // Drivers must not invent VWAP
    const hasVwapDriver = res.drivers.some((d) => d.category.includes('VWAP') || d.explanation.includes('VWAP'));
    assert.equal(hasVwapDriver, false, 'AI explanation must not mention VWAP when unavailable');

    assert.ok(res.provenance !== undefined);
    assert.ok(res.provenance!.omittedFields.includes('vwap'));
  });

  it('EMA unavailable -> executeAnalyzeMarket fallback cannot mention EMA', async () => {
    const mockData = {
      quote: {
        ticker: 'SPY',
        price: 510.00,
        change: 3.00,
      },
      technicals: {
        vwap: 508.00,
        ema9: null, // Missing EMA 9
        ema20: null, // Missing EMA 20
      },
    };

    const res = await executeAnalyzeMarket({ ticker: 'SPY', marketData: mockData, aiClient: null });

    assert.equal(res.status, 'VERIFIED');
    const mentionsEma = res.bullishFactors.some((f) => f.includes('EMA')) || res.bearishFactors.some((f) => f.includes('EMA'));
    assert.equal(mentionsEma, false, 'AI analysis must not mention EMA when unavailable');
  });

  it('insufficient verified inputs -> returns insufficient data message with status UNAVAILABLE', async () => {
    const mockEmptyData = {
      quote: {
        ticker: 'SPY',
        price: null, // Missing price
      },
    };

    const resWhy = await executeWhyIsItMoving({ ticker: 'SPY', marketData: mockEmptyData, aiClient: null });
    assert.equal(resWhy.status, 'UNAVAILABLE');
    assert.ok(resWhy.summary.includes('Insufficient verified market data to explain the move with confidence.'));
    assert.equal(resWhy.provenance?.status, 'INSUFFICIENT_DATA');

    const resAsk = await executeAskMarketMind({ question: 'Why is SPY dropping?', ticker: 'SPY', marketData: mockEmptyData, aiClient: null });
    assert.equal(resAsk.status, 'UNAVAILABLE');
    assert.ok(resAsk.answer.includes('Insufficient verified market data to explain the move with confidence.'));

    const resAnalyze = await executeAnalyzeMarket({ ticker: 'SPY', marketData: mockEmptyData, aiClient: null });
    assert.equal(resAnalyze.status, 'UNAVAILABLE');
    assert.ok(resAnalyze.summary.includes('Insufficient verified market data to explain the move with confidence.'));
  });

  it('provenance payload correctly lists used vs omitted fields', async () => {
    const mockData = {
      quote: {
        ticker: 'SPY',
        price: 500.00,
        change: 2.00,
        dataSource: 'Alpaca IEX',
      },
      technicals: {
        vwap: 499.00,
      },
    };

    const res = await executeWhyIsItMoving({ ticker: 'SPY', marketData: mockData, aiClient: null });
    assert.ok(res.provenance !== undefined);
    assert.ok(res.provenance!.fieldsUsed.includes('currentPrice'));
    assert.ok(res.provenance!.fieldsUsed.includes('vwap'));
    assert.ok(res.provenance!.omittedFields.includes('ema9'));
    assert.ok(res.provenance!.sourcesUsed.includes('Alpaca IEX'));
  });
});
