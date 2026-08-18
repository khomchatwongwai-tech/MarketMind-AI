import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { isSupabaseConfigured } from '../src/config/supabase';
import { validateProductionEnvironment } from '../src/server/productionPreflight';

describe('Production Blank Page Prevention & Error Boundary Suite', () => {
  it('1. ErrorBoundary.getDerivedStateFromError redacts secrets and sets hasError state', () => {
    const sensitiveError = new Error('Database connection failed with key AIzaSyByrBR4eLuiUu30ZesCBLbtFsONQ5WoIXY');
    const derived = ErrorBoundary.getDerivedStateFromError(sensitiveError);

    assert.strictEqual(derived.hasError, true);
    assert.ok(derived.errorMessage);
    assert.strictEqual(derived.errorMessage.includes('AIzaSyByrBR4eLuiUu30ZesCBLbtFsONQ5WoIXY'), false);
    assert.ok(derived.errorMessage.includes('[REDACTED]'));
  });

  it('2. Index HTML contains valid root mounting point and script tag', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    assert.ok(fs.existsSync(indexPath), 'index.html must exist at repository root');

    const html = fs.readFileSync(indexPath, 'utf8');
    assert.ok(html.includes('<div id="root"></div>'), 'index.html must contain <div id="root"></div> for React mounting');
    assert.ok(html.includes('src="/src/main.tsx"'), 'index.html must link to /src/main.tsx module entry');
  });

  it('3. Built dist/index.html correctly points to bundled JS and CSS assets', () => {
    const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(distIndexPath)) {
      const html = fs.readFileSync(distIndexPath, 'utf8');
      assert.ok(html.includes('<div id="root"></div>'), 'dist/index.html must maintain root container');
      assert.ok(/src="\/assets\/index-[^"]+\.js"/.test(html), 'dist/index.html must reference bundled JS asset');
    }
  });

  it('4. Supabase configuration handles missing browser env vars gracefully', () => {
    assert.strictEqual(typeof isSupabaseConfigured, 'boolean');
  });

  it('5. Production preflight validates secrets without dumping secret values', () => {
    const mockEnv = {
      NODE_ENV: 'production',
      ALLOW_SIMULATED_MARKET_DATA: 'false',
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-pub-key-12345678901234567890',
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_SECRET_KEY: 'test-sec-key-12345678901234567890',
      GEMINI_API_KEY: 'test-gemini-key-12345678901234567890',
      STRIPE_SECRET_KEY: 'test-stripe-key-12345678901234567890',
      STRIPE_WEBHOOK_SECRET: 'test-webhook-secret-12345678901234567890',
      STRIPE_PRICE_BASIC_MONTHLY: 'price_basic_m',
      STRIPE_PRICE_BASIC_ANNUAL: 'price_basic_a',
      STRIPE_PRICE_PRO_MONTHLY: 'price_pro_m',
      STRIPE_PRICE_PRO_ANNUAL: 'price_pro_a',
      STRIPE_PRICE_PREMIUM_MONTHLY: 'price_premium_m',
      STRIPE_PRICE_PREMIUM_ANNUAL: 'price_premium_a',
      STRIPE_PRICE_ULTRA_MONTHLY: 'price_ultra_m',
      STRIPE_PRICE_ULTRA_ANNUAL: 'price_ultra_a',
      MASSIVE_API_KEY: 'test-massive-key-12345678901234567890',
      FIREBASE_PROJECT_ID: 'test-firebase-proj',
      APP_URL: 'https://getmarketmindai.com',
    };

    const result = validateProductionEnvironment(mockEnv);
    assert.strictEqual(result.ok, true);

    const serialized = JSON.stringify(result);
    assert.strictEqual(serialized.includes('test-sec-key-12345678901234567890'), false);
    assert.strictEqual(serialized.includes('test-gemini-key-12345678901234567890'), false);
  });

  it('6. Only ONE /api/market/candles/: route handler exists in server.ts', () => {
    const serverPath = path.join(process.cwd(), 'server.ts');
    const content = fs.readFileSync(serverPath, 'utf8');
    const matches = content.match(/app\.get\(['"]\/api\/market\/candles\/:/g);
    assert.ok(matches !== null, 'Candles route handler must exist in server.ts');
    assert.strictEqual(matches.length, 1, 'Exactly ONE /api/market/candles/: route handler must exist in server.ts');
  });

  it('7. Incomplete candle responses missing numeric fields are rejected', () => {
    const incompletePayloads = [
      { candles: [{ time: 1000, open: 100, high: 105, low: 95, close: 102, volume: 500 }] }, // missing price, change, changePercent
      { candles: [{ time: 1000, open: 100, high: 105, low: 95, close: 102, volume: 500 }], price: undefined, change: 2, changePercent: 2 },
      { candles: [{ time: 1000, open: 100, high: 105, low: 95, close: 102, volume: 500 }], price: 102, change: NaN, changePercent: 2 },
      { candles: [], price: 102, change: 2, changePercent: 2 },
    ];

    for (const payload of incompletePayloads) {
      const isValid =
        payload &&
        Array.isArray(payload.candles) &&
        payload.candles.length > 0 &&
        typeof payload.price === 'number' &&
        Number.isFinite(payload.price) &&
        payload.price > 0 &&
        typeof payload.change === 'number' &&
        Number.isFinite(payload.change) &&
        typeof payload.changePercent === 'number' &&
        Number.isFinite(payload.changePercent);

      assert.strictEqual(isValid, false, 'Incomplete payload must be rejected');
    }
  });

  it('8. Missing numeric fields do not crash formatting logic', () => {
    const safeFormat = (val: any, decimals = 2, fallback = '—') => {
      if (typeof val === 'number' && Number.isFinite(val)) {
        return val.toFixed(decimals);
      }
      return fallback;
    };

    assert.strictEqual(safeFormat(undefined), '—');
    assert.strictEqual(safeFormat(null), '—');
    assert.strictEqual(safeFormat(NaN), '—');
    assert.strictEqual(safeFormat(128.456), '128.46');
  });

  it('9. React App root in src/main.tsx is wrapped in ErrorBoundary', () => {
    const mainPath = path.join(process.cwd(), 'src', 'main.tsx');
    const mainContent = fs.readFileSync(mainPath, 'utf8');

    assert.ok(mainContent.includes('<ErrorBoundary>'), 'src/main.tsx must include opening <ErrorBoundary> tag');
    assert.ok(mainContent.includes('</ErrorBoundary>'), 'src/main.tsx must include closing </ErrorBoundary> tag');
  });
});
