import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { validateProductionEnvironment } from '../src/server/productionPreflight';
import { generateEmptyMarketData, mergeLiveQuoteIntoComprehensiveData } from '../src/services/marketDataService';
import {
  executeAskMarketMind,
  executeAnalyzeMarket,
  executeWhyIsItMoving,
} from '../src/services/geminiMarketService';
import { evaluateMarketStructure } from '../src/services/technicalIndicators';

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
    assert.strictEqual(empty.quote.volume, null);
    assert.strictEqual(empty.technicals.vwap, null);
    assert.strictEqual(empty.breadth.sp500Adv, null);
  });

  it('valid normalized quote renders exact provider fields without inventing technicals or breadth', () => {
    const empty = generateEmptyMarketData('SPY');
    const merged = mergeLiveQuoteIntoComprehensiveData(empty, {
      ticker: 'SPY',
      name: 'SPDR S&P 500 ETF Trust',
      currency: 'USD',
      exchangeName: 'NYSE Arca',
      price: 650.25,
      previousClose: 646.4,
      change: 3.85,
      changePercent: 0.595607,
      dayHigh: 652.1,
      dayLow: 645.8,
      openPrice: 647.5,
      volume: 38_500_000,
      marketState: 'REGULAR',
      timestamp: '2026-08-19T18:30:00.000Z',
      dataSource: 'Massive / Polygon.io (Real-Time)',
      latencyMs: 42,
      metadata: { provider: 'Massive / Polygon.io', source: 'massive', mode: 'REAL_TIME', stale: false, validationStatus: 'VALID' },
    });

    assert.equal(merged.quote.price, 650.25);
    assert.equal(merged.quote.previousClose, 646.4);
    assert.equal(merged.quote.dayHigh, 652.1);
    assert.equal(merged.quote.dayLow, 645.8);
    assert.equal(merged.quote.volume, 38_500_000);
    assert.equal(merged.quote.dataSource, 'Massive / Polygon.io (Real-Time)');
    assert.equal(merged.technicals.vwap, null);
    assert.equal(merged.breadth.sp500Adv, null);
  });

  it('chart intelligence stays unavailable when verified candles are missing', () => {
    const structure = evaluateMarketStructure([], '5m');
    assert.equal(structure.trend, 'Unavailable');
    assert.equal(structure.relativeVolume, null);
    assert.equal(structure.overallAlignmentScore, null);
    assert.deepEqual(structure.multiTimeframeAlignment, []);
  });

  it('production market-data environment names match service and Render configuration exactly', () => {
    const service = fs.readFileSync(path.join(process.cwd(), 'src/server/liveMarketDataService.ts'), 'utf8');
    const render = fs.readFileSync(path.join(process.cwd(), 'render.yaml'), 'utf8');
    const example = fs.readFileSync(path.join(process.cwd(), '.env.example'), 'utf8');
    const keys = [
      'MASSIVE_API_KEY',
      'POLYGON_API_KEY',
      'MASSIVE_FEED_DELAY_MINUTES',
      'ALPACA_API_KEY',
      'ALPACA_API_SECRET',
      'ALPACA_DATA_FEED',
      'MARKET_DATA_TIMEOUT_MS',
      'YAHOO_MARKET_DATA_ENABLED',
    ];
    for (const key of keys) {
      assert.ok(service.includes(key), `Service must read ${key}`);
      assert.ok(render.includes(`key: ${key}`), `render.yaml must declare ${key}`);
      assert.ok(example.includes(`${key}=`), `.env.example must document ${key}`);
    }
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
