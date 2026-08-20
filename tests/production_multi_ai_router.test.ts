import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAIProvider } from '../src/server/ai/providers/openaiProvider.js';
import { GeminiProvider } from '../src/server/ai/providers/geminiProvider.js';
import { AnthropicProvider } from '../src/server/ai/providers/anthropicProvider.js';
import { PerplexityProvider } from '../src/server/ai/providers/perplexityProvider.js';
import { IntentRouter } from '../src/services/ai/intentRouter.js';
import { createOrchestrator } from '../src/server/ai/orchestrator.js';
import { ConsensusEngine } from '../src/server/ai/consensusEngine.js';
import { guardMarketData } from '../src/server/ai/marketDataGuard.js';
import { verifyCitations } from '../src/server/ai/citationVerifier.js';
import { getSanitizedAIHealthReport } from '../src/server/ai/adminDiagnostics.js';
import { AIProviderError } from '../src/server/ai/errors.js';

test('1. OpenAI adapter formats chat completions request and parses output text and tokens', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai,gemini,anthropic,perplexity';

  const provider = new OpenAIProvider();
  assert.equal(provider.id, 'openai');
  assert.equal(provider.supportsCitations, false);
  assert.equal(provider.supportsStructuredOutput, true);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: any) => {
    assert.ok(url.includes('api.openai.com/v1/chat/completions'));
    assert.equal(init.headers['authorization'], 'Bearer test-openai-key');
    return {
      ok: true,
      json: async () => ({
        model: 'gpt-4o-mini',
        choices: [{ message: { content: 'OpenAI market analysis text' } }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      }),
    } as Response;
  }) as any;

  try {
    const intent = IntentRouter.classify('What is SPY trend?');
    const response = await provider.generate({
      query: 'What is SPY trend?',
      intent,
      requestId: 'test-req-1',
      maxOutputTokens: 500,
    });

    assert.equal(response.provider, 'openai');
    assert.equal(response.text, 'OpenAI market analysis text');
    assert.equal(response.usage?.totalTokens, 150);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('2. Gemini adapter implements AIProvider contract and health checks', async () => {
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai,gemini,anthropic,perplexity';

  const provider = new GeminiProvider();
  assert.equal(provider.id, 'gemini');
  assert.equal(provider.supportsCitations, true);

  const health = await provider.getHealth();
  assert.equal(health.provider, 'gemini');
  assert.equal(health.configured, true);
  assert.equal(health.healthy, true);
});

test('3. Claude (Anthropic) adapter formats messages payload with custom headers', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai,gemini,anthropic,perplexity';

  const provider = new AnthropicProvider();
  assert.equal(provider.id, 'anthropic');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: any) => {
    assert.ok(url.includes('api.anthropic.com/v1/messages'));
    assert.equal(init.headers['x-api-key'], 'test-anthropic-key');
    assert.equal(init.headers['anthropic-version'], '2023-06-01');
    return {
      ok: true,
      json: async () => ({
        model: 'claude-3-7-sonnet-20250219',
        content: [{ type: 'text', text: 'Anthropic SEC analysis' }],
        usage: { input_tokens: 200, output_tokens: 100 },
      }),
    } as Response;
  }) as any;

  try {
    const intent = IntentRouter.classify('Summarize SEC 10-K filing');
    const response = await provider.generate({
      query: 'Summarize SEC 10-K filing',
      intent,
      requestId: 'test-req-3',
      maxOutputTokens: 500,
    });

    assert.equal(response.provider, 'anthropic');
    assert.equal(response.text, 'Anthropic SEC analysis');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('4. Perplexity adapter extracts web research citations', async () => {
  process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai,gemini,anthropic,perplexity';

  const provider = new PerplexityProvider();
  assert.equal(provider.id, 'perplexity');
  assert.equal(provider.supportsCitations, true);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({
      model: 'sonar',
      choices: [{ message: { content: 'Perplexity breaking news research' } }],
      citations: ['https://www.reuters.com/markets/us-stocks'],
      usage: { prompt_tokens: 80, completion_tokens: 40, total_tokens: 120 },
    }),
  })) as any;

  try {
    const intent = IntentRouter.classify('Why is SPY moving?');
    const response = await provider.generate({
      query: 'Why is SPY moving?',
      intent,
      requestId: 'test-req-4',
      maxOutputTokens: 500,
    });

    assert.equal(response.provider, 'perplexity');
    assert.equal(response.citations.length, 1);
    assert.equal(response.citations[0].url, 'https://www.reuters.com/markets/us-stocks');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('5. IntentRouter assigns appropriate primary and fallback providers', () => {
  const whyMoving = IntentRouter.classify('Why is SPY moving right now?');
  assert.equal(whyMoving.preferredProvider, 'perplexity');

  const techAnalysis = IntentRouter.classify('What is the technical RSI setup for NVDA?');
  assert.equal(techAnalysis.preferredProvider, 'openai');

  const filings = IntentRouter.classify('Analyze SEC 10-Q filing for TSLA');
  assert.equal(filings.preferredProvider, 'anthropic');

  const edu = IntentRouter.classify('What is inflation?');
  assert.equal(edu.preferredProvider, 'gemini');
});

test('6. Orchestrator performs controlled failover when primary provider fails', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai,gemini';

  const p1 = new OpenAIProvider();
  const p2 = new GeminiProvider();

  p1.generate = async () => {
    throw new AIProviderError('openai', 'transient', 'Primary OpenAI server error 500');
  };

  p2.generate = async () => ({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    text: 'Fallback Gemini analysis response',
    citations: [],
    latencyMs: 120,
    finishStatus: 'completed',
    warnings: [],
  });

  const orchestrator = createOrchestrator([p1, p2]);
  const res = await orchestrator.execute({
    query: 'What is inflation?',
    userId: 'user-test-failover',
  });

  assert.equal(res.provider, 'gemini');
  assert.equal(res.answer, 'Fallback Gemini analysis response');
});

test('7. Handles timeout appropriately using AbortSignal', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai';

  const provider = new OpenAIProvider();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    const err = new Error('AbortError');
    err.name = 'AbortError';
    throw err;
  }) as any;

  try {
    const intent = IntentRouter.classify('Test timeout');
    await assert.rejects(
      async () =>
        provider.generate({
          query: 'Test timeout',
          intent,
          requestId: 'req-timeout',
          maxOutputTokens: 100,
        }),
      (err: any) => err.message.includes('timed out')
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('8. Handles 429 rate limit response gracefully', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai';

  const provider = new OpenAIProvider();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: 'Rate limit exceeded' }),
  })) as any;

  try {
    const intent = IntentRouter.classify('Rate limit test');
    await assert.rejects(
      async () =>
        provider.generate({
          query: 'Rate limit test',
          intent,
          requestId: 'req-429',
          maxOutputTokens: 100,
        }),
      (err: any) => err instanceof AIProviderError && err.kind === 'rate_limit'
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('9. Handles malformed JSON response safely', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai';

  const provider = new OpenAIProvider();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({ invalid: 'no choices array' }),
  })) as any;

  try {
    const intent = IntentRouter.classify('Malformed test');
    await assert.rejects(
      async () =>
        provider.generate({
          query: 'Malformed test',
          intent,
          requestId: 'req-malformed',
          maxOutputTokens: 100,
        }),
      (err: any) => err.message.includes('OpenAI response did not contain text content.')
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('10. Detects missing API key and marks provider unavailable', () => {
  delete process.env.OPENAI_API_KEY;
  const provider = new OpenAIProvider();
  assert.equal(provider.isAvailable(), false);
});

test('11. Throws clean error when all providers are unavailable', async () => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.PERPLEXITY_API_KEY;

  const orchestrator = createOrchestrator([
    new OpenAIProvider(),
    new GeminiProvider(),
    new AnthropicProvider(),
    new PerplexityProvider(),
  ]);

  await assert.rejects(
    async () => orchestrator.execute({ query: 'Hello market', userId: 'test-user-all-down' }),
    (err: any) => err.message.includes('No eligible AI provider is configured.')
  );
});

test('12. Prevents API key leakage in health diagnostics', async () => {
  process.env.OPENAI_API_KEY = 'secret-key-12345';
  process.env.GEMINI_API_KEY = 'secret-key-67890';

  const report = await getSanitizedAIHealthReport([
    new OpenAIProvider(),
    new GeminiProvider(),
    new AnthropicProvider(),
    new PerplexityProvider(),
  ]);

  const reportStr = JSON.stringify(report);
  assert.equal(reportStr.includes('secret-key-12345'), false);
  assert.equal(reportStr.includes('secret-key-67890'), false);
  assert.equal(report.providers.length, 4);
});

test('13. Enforces market data guard: market data cannot be fabricated', () => {
  assert.throws(
    () => guardMarketData('SPY', true, undefined),
    (err: any) => err.message === 'AUTHORITATIVE_MARKET_DATA_UNAVAILABLE'
  );
});

test('14. Excludes unavailable or unverified market fields from context', () => {
  assert.throws(
    () =>
      guardMarketData('SPY', true, {
        marketData: {
          symbol: 'SPY',
          price: null,
          metadata: { validationStatus: 'UNAVAILABLE' },
        },
      }),
    (err: any) => err.message === 'AUTHORITATIVE_MARKET_DATA_UNAVAILABLE'
  );
});

test('15. Preserves and verifies citations', () => {
  const citations = [
    { url: 'https://www.bloomberg.com/news/articles/1', provider: 'perplexity' as const },
    { url: 'invalid-url-string', provider: 'perplexity' as const },
  ];
  const verified = verifyCitations(citations);
  assert.equal(verified.citations.length, 1);
  assert.equal(verified.citations[0].url, 'https://www.bloomberg.com/news/articles/1');
});

test('16. Consensus engine detects disagreement across provider responses', async () => {
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.AI_ENABLED_PROVIDERS = 'openai,gemini';

  const p1 = new OpenAIProvider();
  const p2 = new GeminiProvider();

  p1.generate = async () => ({
    provider: 'openai',
    model: 'gpt-4o-mini',
    text: JSON.stringify({
      direction: 'BULLISH',
      confidence: 85,
      catalysts: ['Tech rally'],
      risks: ['Inflation'],
      invalidationConditions: [],
      affectedAssets: ['SPY'],
      timeHorizon: '1_3_DAYS',
    }),
    citations: [],
    latencyMs: 150,
    finishStatus: 'completed',
    warnings: [],
  });

  p2.generate = async () => ({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    text: JSON.stringify({
      direction: 'BEARISH',
      confidence: 75,
      catalysts: ['Yield spike'],
      risks: ['Recession'],
      invalidationConditions: [],
      affectedAssets: ['SPY'],
      timeHorizon: '1_3_DAYS',
    }),
    citations: [],
    latencyMs: 180,
    finishStatus: 'completed',
    warnings: [],
  });

  const consensusEngine = new ConsensusEngine([p1, p2]);
  const intent = IntentRouter.classify('SPY consensus analysis');

  const result = await consensusEngine.analyze({
    query: 'Analyze SPY direction',
    intent,
    requestId: 'req-consensus',
    maxOutputTokens: 500,
  });

  assert.deepEqual(result.providersUsed, ['openai', 'gemini']);
  assert.equal(result.disagreementScore, 50);
  assert.equal(result.conflictingClaims.length, 1);
});
