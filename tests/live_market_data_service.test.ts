import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LiveMarketDataService,
  MarketDataProviderError,
  MarketDataUnavailableError,
} from '../src/server/liveMarketDataService.js';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const massiveSnapshot = {
  ticker: {
    lastTrade: { p: 650.25, t: 1787149800000000000 },
    lastQuote: { p: 650.2, P: 650.3 },
    day: { o: 647.5, h: 652.1, l: 645.8, c: 650.25, v: 38_500_000, vw: 649.4 },
    prevDay: { o: 642.2, h: 649.7, l: 640.1, c: 646.4, v: 54_000_000 },
    updated: 1787149800000000000,
    market_status: 'open',
  },
};

function massiveService(fetchFn: typeof fetch, extraEnv: Record<string, string> = {}) {
  return new LiveMarketDataService({
    fetchFn,
    env: {
      MASSIVE_API_KEY: 'massive-secret-never-log',
      YAHOO_MARKET_DATA_ENABLED: 'false',
      ...extraEnv,
    },
    now: () => 1787149860000,
    logger: () => undefined,
  });
}

test('successful provider response is normalized without synthetic fallback fields', async () => {
  const service = massiveService(async () => jsonResponse(200, massiveSnapshot));
  const quote = await service.getQuote('SPY');

  assert.equal(quote.providerId, 'massive');
  assert.equal(quote.price, 650.25);
  assert.equal(quote.previousClose, 646.4);
  assert.equal(quote.dayHigh, 652.1);
  assert.equal(quote.dayLow, 645.8);
  assert.equal(quote.openPrice, 647.5);
  assert.equal(quote.volume, 38_500_000);
  assert.equal(quote.change, 3.85);
  assert.equal(quote.changePercent, Number(((3.85 / 646.4) * 100).toFixed(6)));
});

test('SPY quote normalization maps price, previous close, change, percent, OHLCV, timestamp, and session', async () => {
  const service = massiveService(async () => jsonResponse(200, massiveSnapshot));
  const quote = await service.fetchMassiveQuote('SPY');

  assert.deepEqual(
    {
      symbol: quote.symbol,
      price: quote.price,
      previousClose: quote.previousClose,
      change: quote.change,
      changePercent: quote.changePercent,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      openPrice: quote.openPrice,
      volume: quote.volume,
      timestamp: quote.timestamp,
      marketSession: quote.marketSession,
    },
    {
      symbol: 'SPY',
      price: 650.25,
      previousClose: 646.4,
      change: 3.85,
      changePercent: Number(((3.85 / 646.4) * 100).toFixed(6)),
      dayHigh: 652.1,
      dayLow: 645.8,
      openPrice: 647.5,
      volume: 38_500_000,
      timestamp: 1787149800000,
      marketSession: 'REGULAR',
    }
  );
});

test('Massive REST aggregates provide a real delayed quote when snapshot entitlement is unavailable', async () => {
  const service = new LiveMarketDataService({
    env: {
      MASSIVE_API_KEY: 'massive-secret',
      MASSIVE_FEED_DELAY_MINUTES: '15',
      YAHOO_MARKET_DATA_ENABLED: 'false',
    },
    now: () => Date.parse('2026-08-20T03:50:00Z'),
    fetchFn: (async (url) =>
      String(url).includes('/snapshot/')
        ? jsonResponse(403, {})
        : jsonResponse(200, {
            results: [
              { t: Date.parse('2026-08-19T23:55:00Z'), o: 649.4, h: 649.6, l: 649.3, c: 649.5, v: 100 },
              { t: Date.parse('2026-08-19T19:55:00Z'), o: 650, h: 650.5, l: 649.8, c: 650.25, v: 2_000 },
              { t: Date.parse('2026-08-19T13:30:00Z'), o: 647.5, h: 652.1, l: 645.8, c: 648, v: 1_000 },
              { t: Date.parse('2026-08-18T19:55:00Z'), o: 646, h: 647, l: 645, c: 646.4, v: 1_500 },
              { t: Date.parse('2026-08-18T13:30:00Z'), o: 642.2, h: 649.7, l: 640.1, c: 644, v: 1_000 },
            ],
          })) as typeof fetch,
    logger: () => undefined,
  });

  const quote = await service.getQuote('SPY');
  assert.equal(quote.providerId, 'massive');
  assert.equal(quote.providerName, 'Massive / Polygon.io Aggregates');
  assert.equal(quote.isRealTime, false);
  assert.equal(quote.feedDelayMinutes, 15);
  assert.equal(quote.price, 649.5);
  assert.equal(quote.previousClose, 646.4);
  assert.equal(quote.openPrice, 647.5);
  assert.equal(quote.dayHigh, 652.1);
  assert.equal(quote.dayLow, 645.8);
  assert.equal(quote.volume, 3_000);
  assert.equal(quote.timestamp, Date.parse('2026-08-19T23:55:00Z'));
  assert.equal(quote.marketSession, 'CLOSED');
});

test('provider timeout is categorized and fails closed', async () => {
  const fetchMock: typeof fetch = async (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
  const service = new LiveMarketDataService({
    fetchFn: fetchMock,
    env: { MASSIVE_API_KEY: 'massive-secret', YAHOO_MARKET_DATA_ENABLED: 'false' },
    timeoutMs: 5,
    logger: () => undefined,
  });

  await assert.rejects(
    () => service.fetchMassiveQuote('SPY'),
    (error: unknown) =>
      error instanceof MarketDataProviderError &&
      error.diagnostic.category === 'timeout' &&
      error.diagnostic.timeout === true
  );
});

for (const status of [401, 403]) {
  test(`provider ${status} is categorized as authorization without exposing credentials`, async () => {
    const service = massiveService(async () => jsonResponse(status, { message: 'denied' }));
    await assert.rejects(
      () => service.fetchMassiveQuote('SPY'),
      (error: unknown) => {
        assert.ok(error instanceof MarketDataProviderError);
        assert.equal(error.diagnostic.category, 'authorization');
        assert.equal(error.diagnostic.httpStatus, status);
        assert.equal(JSON.stringify(error).includes('massive-secret-never-log'), false);
        return true;
      }
    );
  });
}

test('provider 429 is categorized as rate_limit', async () => {
  const service = massiveService(async () => jsonResponse(429, {}));
  await assert.rejects(
    () => service.fetchMassiveQuote('SPY'),
    (error: unknown) =>
      error instanceof MarketDataProviderError &&
      error.diagnostic.category === 'rate_limit' &&
      error.diagnostic.httpStatus === 429
  );
});

test('provider 5xx is categorized as upstream', async () => {
  const service = massiveService(async () => jsonResponse(503, {}));
  await assert.rejects(
    () => service.fetchMassiveQuote('SPY'),
    (error: unknown) =>
      error instanceof MarketDataProviderError &&
      error.diagnostic.category === 'upstream' &&
      error.diagnostic.httpStatus === 503
  );
});

test('malformed provider payload is rejected', async () => {
  const service = massiveService(async () => jsonResponse(200, { ticker: { lastTrade: { p: 650.25 } } }));
  await assert.rejects(
    () => service.fetchMassiveQuote('SPY'),
    (error: unknown) =>
      error instanceof MarketDataProviderError && error.diagnostic.category === 'malformed_payload'
  );
});

test('stale provider quote is rejected instead of being presented as current', async () => {
  const service = new LiveMarketDataService({
    fetchFn: async () => jsonResponse(200, massiveSnapshot),
    env: { MASSIVE_API_KEY: 'massive-secret', YAHOO_MARKET_DATA_ENABLED: 'false' },
    now: () => 1787157000000,
    logger: () => undefined,
  });

  await assert.rejects(
    () => service.fetchMassiveQuote('SPY'),
    (error: unknown) =>
      error instanceof MarketDataProviderError && error.diagnostic.category === 'malformed_payload'
  );
});

test('missing environment variables report configuration names by category and no values', async () => {
  const service = new LiveMarketDataService({
    env: { YAHOO_MARKET_DATA_ENABLED: 'false' },
    fetchFn: async () => {
      throw new Error('network must not be called');
    },
    logger: () => undefined,
  });

  await assert.rejects(
    () => service.getQuote('SPY'),
    (error: unknown) => {
      assert.ok(error instanceof MarketDataUnavailableError);
      assert.deepEqual(
        error.diagnostics.map((diagnostic) => [diagnostic.provider, diagnostic.category]),
        [
          ['massive', 'missing_configuration'],
          ['alpaca', 'missing_configuration'],
          ['robinhood', 'missing_configuration'],
          ['yahoo', 'missing_configuration'],
        ]
      );
      return true;
    }
  );
});

test('production mode fails closed when no live provider is operational', async () => {
  const service = new LiveMarketDataService({
    env: {
      NODE_ENV: 'production',
      ALLOW_SIMULATED_MARKET_DATA: 'false',
      MASSIVE_API_KEY: 'configured-but-rejected',
      YAHOO_MARKET_DATA_ENABLED: 'false',
    },
    fetchFn: async () => jsonResponse(503, {}),
    logger: () => undefined,
  });

  await assert.rejects(
    () => service.getQuote('SPY'),
    (error: unknown) => error instanceof MarketDataUnavailableError
  );
});
