import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { validateProductionEnvironment } from '../src/server/productionPreflight';
import { generateEmptyMarketData } from '../src/services/marketDataService';
import {
  executeAskMarketMind,
  executeAnalyzeMarket,
  executeWhyIsItMoving,
} from '../src/services/geminiMarketService';

describe('Production Market Data Integrity Suite', () => {
  it('server.ts defines exactly one /api/market/candles/:ticker route', () => {
    const serverPath = path.join(process.cwd(), 'server.ts');
    const content = fs.readFileSync(serverPath, 'utf-8');
    const matches = content.match(/app\.get\(['"]\/api\/market\/candles\/:/g);
    assert.ok(matches);
    assert.strictEqual(matches.length, 1);
  });

  it('generateEmptyMarketData initializes with null prices and DATA UNAVAILABLE source', () => {
    const empty = generateEmptyMarketData('SPY');
    assert.strictEqual(empty.quote.price, null);
    assert.strictEqual(empty.quote.change, null);
    assert.strictEqual(empty.quote.changePercent, null);
    assert.strictEqual(empty.quote.dataSource, 'DATA UNAVAILABLE');
    assert.strictEqual(empty.quote.marketStatus, 'LIVE DATA UNAVAILABLE');
  });

  it('AI executeAskMarketMind returns status UNAVAILABLE and MARKET_DATA_UNAVAILABLE when quote price is null', async () => {
    const emptyData = generateEmptyMarketData('SPY');
    const res = await executeAskMarketMind({
      question: 'What is SPY target price?',
      ticker: 'SPY',
      marketData: emptyData,
    });
    assert.strictEqual(res.status, 'UNAVAILABLE');
    assert.ok(res.answer.includes('MARKET_DATA_UNAVAILABLE'));
  });

  it('AI executeAnalyzeMarket returns status UNAVAILABLE when current price is null', async () => {
    const emptyData = generateEmptyMarketData('QQQ');
    const res = await executeAnalyzeMarket({
      ticker: 'QQQ',
      marketData: emptyData,
    });
    assert.strictEqual(res.status, 'UNAVAILABLE');
    assert.ok(res.summary.includes('MARKET_DATA_UNAVAILABLE'));
    assert.ok(res.confidenceExplanation.includes('unavailable'));
  });

  it('AI executeWhyIsItMoving returns status UNAVAILABLE when current price is null', async () => {
    const emptyData = generateEmptyMarketData('NVDA');
    const res = await executeWhyIsItMoving({
      ticker: 'NVDA',
      marketData: emptyData,
    });
    assert.strictEqual(res.status, 'UNAVAILABLE');
    assert.ok(res.summary.includes('MARKET_DATA_UNAVAILABLE'));
  });

  it('validateProductionEnvironment returns ok: true when optional billing is enabled and market keys are set', () => {
    const mockEnv: Record<string, string> = {
      NODE_ENV: 'production',
      ALLOW_SIMULATED_MARKET_DATA: 'false',
      ALLOW_OPTIONAL_BILLING: 'true',
      VITE_SUPABASE_URL: 'https://xyz.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_anon_key_123',
      SUPABASE_URL: 'https://xyz.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_key_123',
      GEMINI_API_KEY: 'gemini_key_123',
      MASSIVE_API_KEY: 'massive_key_123',
      FIREBASE_PROJECT_ID: 'marketmind-prod',
      APP_URL: 'https://getmarketmindai.com',
    };

    const res = validateProductionEnvironment(mockEnv);
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.errors.length, 0);
    assert.ok(res.warnings.some((w) => w.includes('STRIPE_SECRET_KEY')));
  });
});
