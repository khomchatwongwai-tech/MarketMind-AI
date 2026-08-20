import test from 'node:test';
import assert from 'node:assert/strict';
import { IntentRouter } from '../src/services/ai/intentRouter';
import { ProviderRouter } from '../src/server/ai/providerRouter';
import { verifyCitations } from '../src/server/ai/citationVerifier';
import { cacheKey, cacheTtl, getCached, setCached } from '../src/server/ai/cache';
import { CostController } from '../src/server/ai/costController';
import { requireAuthoritativeMarketData } from '../src/server/ai/marketDataGuard';
import { validateProductionEnvironment } from '../src/server/productionPreflight';
import type { AIProvider, ProviderRequest, ProviderResponse } from '../src/server/ai/types';

const provider = (name: AIProvider['name'], available = true): AIProvider => ({
  id: name,
  name,
  supportsCitations: true,
  supportsStructuredOutput: true,
  timeoutMs: 1000,
  isAvailable: () => available,
  getHealth: async () => ({
    provider: name,
    status: available ? 'HEALTHY' : 'OFFLINE',
    configured: available,
    enabled: available,
    healthy: available,
    consecutiveFailures: 0,
    lastCheckedAt: new Date().toISOString(),
  }),
  generate: async (_request: ProviderRequest): Promise<ProviderResponse> => ({
    provider: name,
    model: 'test',
    text: 'ok',
    citations: [],
    latencyMs: 1,
    finishStatus: 'completed',
    warnings: [],
  }),
});

test('intent routing assigns research, market-data, and long-context requirements deterministically', () => {
  const moving = IntentRouter.classify('Why is NVDA moving today?');
  assert.equal(moving.intent, 'WHY_MOVING'); assert.equal(moving.requiresLiveMarketData, true); assert.equal(moving.requiresCurrentWebResearch, true); assert.equal(moving.requiresCitations, true); assert.equal(moving.preferredProvider, 'perplexity');
  const filing = IntentRouter.classify('Summarize AAPL 10-K');
  assert.equal(filing.intent, 'SEC_FILINGS'); assert.equal(filing.requiresLongContext, true); assert.equal(filing.preferredProvider, 'anthropic');
  const technical = IntentRouter.classify('NVDA RSI support and resistance');
  assert.equal(technical.intent, 'TECHNICAL_ANALYSIS'); assert.equal(technical.requiresLiveMarketData, true); assert.equal(technical.preferredProvider, 'openai');
});

test('provider routing skips disabled providers and preserves bounded fallback order', () => {
  const intent = IntentRouter.classify('Why is AAPL moving?');
  const routed = new ProviderRouter([provider('perplexity', false), provider('openai'), provider('gemini')]).route(intent, 2);
  assert.deepEqual(routed.map(item => item.name), ['openai', 'gemini']);
});

test('citations reject invalid URLs and deduplicate valid sources', () => {
  const verified = verifyCitations([{ url: 'https://example.com/a', provider: 'perplexity' }, { url: 'https://example.com/a', provider: 'perplexity' }, { url: 'javascript:alert(1)', provider: 'perplexity' }]);
  assert.equal(verified.citations.length, 1); assert.equal(verified.citations[0].url, 'https://example.com/a');
});

test('cache isolates private user keys and bypasses quote-sensitive intents', () => {
  const key = cacheKey({ query: 'portfolio', intent: 'PORTFOLIO_ANALYSIS', userId: 'u1' });
  const value: any = { answer: 'ok' }; setCached(key, value, 1_000, 'u1'); assert.equal(getCached(key, 'u2'), undefined); assert.equal(getCached(key, 'u1'), value); assert.equal(cacheTtl('WHY_MOVING'), 0);
});

test('cost controller enforces the daily request limit', () => { const controller = new CostController(1); assert.equal(controller.allow('u1'), true); assert.equal(controller.allow('u1'), false); });

test('market-data guard fails closed without a verified quote and accepts validated server evidence', () => {
  assert.throws(() => requireAuthoritativeMarketData(undefined), /AUTHORITATIVE_MARKET_DATA_UNAVAILABLE/);
  assert.throws(() => requireAuthoritativeMarketData({ entitlementStatus: { isAvailable: true }, quote: { price: 123, metadata: { stale: true } } }), /AUTHORITATIVE_MARKET_DATA_UNAVAILABLE/);
  assert.doesNotThrow(() => requireAuthoritativeMarketData({ entitlementStatus: { isAvailable: true }, quote: { price: 123, metadata: { validationStatus: 'VALID', stale: false } } }));
});

test('production preflight requires only explicitly enabled provider secrets', () => {
  const base: Record<string, string> = { NODE_ENV: 'production', ALLOW_SIMULATED_MARKET_DATA: 'false', VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'public', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'secret', STRIPE_SECRET_KEY: 'stripe', STRIPE_WEBHOOK_SECRET: 'webhook', STRIPE_PRICE_BASIC_MONTHLY: 'a', STRIPE_PRICE_BASIC_ANNUAL: 'b', STRIPE_PRICE_PRO_MONTHLY: 'c', STRIPE_PRICE_PRO_ANNUAL: 'd', STRIPE_PRICE_PREMIUM_MONTHLY: 'e', STRIPE_PRICE_PREMIUM_ANNUAL: 'f', STRIPE_PRICE_ULTRA_MONTHLY: 'g', STRIPE_PRICE_ULTRA_ANNUAL: 'h', MASSIVE_API_KEY: 'market', FIREBASE_PROJECT_ID: 'project', APP_URL: 'https://marketmind.example', AI_ENABLED_PROVIDERS: 'openai', OPENAI_API_KEY: 'openai' };
  assert.equal(validateProductionEnvironment(base).errors.some(error => error.includes('ANTHROPIC_API_KEY')), false);
  delete base.OPENAI_API_KEY; assert.equal(validateProductionEnvironment(base).errors.some(error => error.includes('OPENAI_API_KEY')), true);
});
