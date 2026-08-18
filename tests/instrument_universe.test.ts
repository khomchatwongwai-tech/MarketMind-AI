import assert from 'node:assert/strict';
import test from 'node:test';
import { InstrumentStore, DatabaseInstrument } from '../src/server/instrumentStore';
import { AlpacaInstrumentSyncService, AlpacaRawAsset } from '../src/server/alpacaInstrumentSync';
import { AlpacaRateLimiter } from '../src/server/alpacaRateLimiter';
import { AlpacaMarketDataService, AlpacaProviderError } from '../src/server/alpacaMarketDataService';
import { MarketDataCache } from '../src/server/marketDataCache';
import { InstrumentDirectoryService } from '../src/services/marketProviders/InstrumentDirectoryService';

test('1. 5,000+ Instrument Catalog Scale & Seeding', async () => {
  InstrumentStore.resetForTests();
  const count = await InstrumentStore.initialize();

  assert.ok(count >= 5000, `Expected at least 5,000 instruments in catalog, got ${count}`);

  const all = InstrumentStore.getAll();
  const stocks = all.filter((i) => i.asset_type === 'STOCK');
  const etfs = all.filter((i) => i.asset_type === 'ETF');

  assert.ok(stocks.length >= 4000, `Expected >=4000 stocks, got ${stocks.length}`);
  assert.ok(etfs.length >= 50, `Expected >=50 ETFs, got ${etfs.length}`);
});

test('2. Ticker Upsert and Duplicate Prevention', async () => {
  InstrumentStore.resetForTests();
  await InstrumentStore.initialize();
  const initialCount = InstrumentStore.count();

  const customInstrument: DatabaseInstrument = {
    id: 'inst_stock_nvda',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation Updated',
    exchange: 'NASDAQ',
    asset_class: 'us_equity',
    asset_type: 'STOCK',
    tradable: true,
    active: true,
    status: 'active',
    sector: 'Technology',
    industry: 'Semiconductors',
    provider: 'alpaca',
  };

  const { inserted, updated } = await InstrumentStore.upsertBatch([customInstrument]);
  assert.equal(inserted, 0, 'Existing ticker should not increment insert count');
  assert.equal(updated, 1, 'Existing ticker should update');

  const retrieved = InstrumentStore.getBySymbol('NVDA');
  assert.ok(retrieved);
  assert.equal(retrieved?.name, 'NVIDIA Corporation Updated');
  assert.equal(InstrumentStore.count(), initialCount, 'Catalog size should remain unchanged on update');
});

test('3. Inactive and Delisted Asset Handling', async () => {
  InstrumentStore.resetForTests();
  await InstrumentStore.initialize();

  const delistedAsset: DatabaseInstrument = {
    id: 'inst_stock_delisted_xyz',
    symbol: 'DELISTXYZ',
    name: 'Delisted Corp',
    exchange: 'NYSE',
    asset_class: 'us_equity',
    asset_type: 'STOCK',
    tradable: false,
    active: false,
    status: 'inactive',
    provider: 'alpaca',
  };

  await InstrumentStore.upsertBatch([delistedAsset]);

  const searchResults = InstrumentStore.search('DELISTXYZ');
  assert.equal(searchResults.length, 0, 'Inactive / delisted asset must not appear in search results');

  const direct = InstrumentStore.getBySymbol('DELISTXYZ');
  assert.ok(direct);
  assert.equal(direct?.active, false);
  assert.equal(direct?.tradable, false);
});

test('4. Exact Symbol Search Ranking (Exact Match 1st)', () => {
  InstrumentStore.resetForTests();
  InstrumentStore.initialize();

  // Searching 'NV' should rank exact ticker first if present or NVDA before longer name matches
  const nvResults = InstrumentStore.search('NVDA');
  assert.ok(nvResults.length > 0);
  assert.equal(nvResults[0].symbol, 'NVDA', 'Exact symbol match must be ranked 1st');

  const spyResults = InstrumentStore.search('SPY');
  assert.ok(spyResults.length > 0);
  assert.equal(spyResults[0].symbol, 'SPY', 'SPY must rank 1st on exact search');

  const aaplResults = InstrumentStore.search('AAPL');
  assert.ok(aaplResults.length > 0);
  assert.equal(aaplResults[0].symbol, 'AAPL', 'AAPL must rank 1st on exact search');
});

test('5. Company Name and Autocomplete Search', () => {
  InstrumentStore.resetForTests();
  InstrumentStore.initialize();

  const appleResults = InstrumentStore.search('Apple');
  assert.ok(appleResults.some((i) => i.symbol === 'AAPL'), 'Searching "Apple" must find AAPL');

  const nvidiaResults = InstrumentStore.search('NVIDIA');
  assert.ok(nvidiaResults.some((i) => i.symbol === 'NVDA'), 'Searching "NVIDIA" must find NVDA');

  const microsoftResults = InstrumentStore.search('Microsoft');
  assert.ok(microsoftResults.some((i) => i.symbol === 'MSFT'), 'Searching "Microsoft" must find MSFT');

  const spdrResults = InstrumentStore.search('SPDR');
  assert.ok(spdrResults.some((i) => i.symbol === 'SPY'), 'Searching "SPDR" must find SPY');
});

test('6. Autocomplete Limits and Filtering', () => {
  InstrumentStore.resetForTests();
  InstrumentStore.initialize();

  const limitedResults = InstrumentStore.search('', { limit: 10 });
  assert.equal(limitedResults.length, 10, 'Search must respect limit=10 parameter');

  const etfOnly = InstrumentStore.search('Vanguard', { assetType: 'ETF' });
  for (const item of etfOnly) {
    assert.equal(item.asset_type, 'ETF', 'Filtered search must only contain requested asset type');
  }
});

test('7. Alpaca Rate Limiter and 429 Throttle Protection', () => {
  const limiter = AlpacaRateLimiter.getInstance();
  limiter.resetForTests(5); // 5 requests max per minute for testing

  assert.equal(limiter.tryAcquire(1), true);
  assert.equal(limiter.tryAcquire(1), true);
  assert.equal(limiter.tryAcquire(1), true);
  assert.equal(limiter.tryAcquire(1), true);
  assert.equal(limiter.tryAcquire(1), true);

  // 6th request must be throttled
  assert.equal(limiter.tryAcquire(1), false);
  assert.throws(
    () => limiter.acquireOrThrow(1),
    (err: any) => err instanceof AlpacaProviderError && err.code === 'RATE_LIMITED'
  );

  const stats = limiter.getStats();
  assert.equal(stats.used, 5);
  assert.equal(stats.remaining, 0);

  limiter.resetForTests(200); // restore default
});

test('8. Fail-Closed Data Integrity on 401/403/429/500 Provider Responses', async () => {
  const mockResponse = (status: number, body: any) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // 401 Unauthorized
  const authFailService = new AlpacaMarketDataService(
    'invalid-alpaca-key',
    'invalid-alpaca-secret',
    async () => mockResponse(401, { message: 'Unauthorized' })
  );
  await assert.rejects(
    async () => authFailService.getSnapshot('AAPL'),
    (err: any) => err instanceof AlpacaProviderError && err.code === 'UNAUTHORIZED'
  );

  // 403 Forbidden
  const forbiddenService = new AlpacaMarketDataService(
    'test-key-12345',
    'test-sec-12345',
    async () => mockResponse(403, { message: 'Forbidden feed' })
  );
  await assert.rejects(
    async () => forbiddenService.getSnapshot('AAPL'),
    (err: any) => err instanceof AlpacaProviderError && err.code === 'UNAUTHORIZED'
  );

  // 429 Rate Limit
  const rateLimitedService = new AlpacaMarketDataService(
    'test-key-12345',
    'test-sec-12345',
    async () => mockResponse(429, { message: 'Too Many Requests' })
  );
  await assert.rejects(
    async () => rateLimitedService.getSnapshot('AAPL'),
    (err: any) => err instanceof AlpacaProviderError && err.code === 'RATE_LIMITED'
  );

  // 500 Server Error
  const serverErrorService = new AlpacaMarketDataService(
    'test-key-12345',
    'test-sec-12345',
    async () => mockResponse(500, { message: 'Internal Error' })
  );
  await assert.rejects(
    async () => serverErrorService.getSnapshot('AAPL'),
    (err: any) => err instanceof AlpacaProviderError && err.code === 'UNAVAILABLE'
  );
});

test('9. Caching Layer Serves Cached Snapshots without Extra Upstream Requests', async () => {
  let networkCallCount = 0;
  const mockSnapshot = {
    latestTrade: { p: 220.5, s: 100, t: new Date().toISOString() },
    latestQuote: { bp: 220.4, ap: 220.6, bs: 10, as: 10, t: new Date().toISOString() },
    dailyBar: { o: 218.0, h: 221.0, l: 217.5, c: 220.5, v: 5000000 },
    prevDailyBar: { c: 219.0 },
  };

  const cachedService = new AlpacaMarketDataService(
    'test-key-12345',
    'test-sec-12345',
    async () => {
      networkCallCount++;
      return new Response(JSON.stringify(mockSnapshot), { status: 200 });
    }
  );

  MarketDataCache.getInstance().clear();

  // 1st request -> hits upstream
  const quote1 = await cachedService.getSnapshot('AAPL');
  assert.equal(quote1.price, 220.5);
  assert.equal(networkCallCount, 1);

  // 2nd request within TTL -> hits cache
  const quote2 = await cachedService.getSnapshot('AAPL');
  assert.equal(quote2.price, 220.5);
  assert.equal(networkCallCount, 1, 'Second request must hit cache without invoking upstream network');
});
