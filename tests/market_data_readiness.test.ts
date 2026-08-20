import assert from 'node:assert/strict';
import test from 'node:test';
import app from '../server.js';
import { DataProviderRouter } from '../src/services/marketProviders/DataProviderRouter.js';
import {
  LiveMarketDataService,
  setLiveMarketDataServiceForTests,
} from '../src/server/liveMarketDataService.js';

async function requestReady(): Promise<{ statusCode: number; body: any }> {
  const req: any = {
    method: 'GET',
    url: '/api/ready',
    originalUrl: '/api/ready',
    headers: { host: 'localhost' },
  };
  return new Promise((resolve) => {
    const res: any = {
      statusCode: 200,
      headers: {},
      setHeader(name: string, value: string) { this.headers[name] = value; },
      status(code: number) { this.statusCode = code; return this; },
      json(body: any) { resolve({ statusCode: this.statusCode, body }); return this; },
      sendStatus(code: number) { this.statusCode = code; resolve({ statusCode: code, body: null }); return this; },
    };
    app(req, res);
  });
}

test('/api/ready reports the operational market-data provider after a valid SPY probe', async () => {
  const payload = {
    ticker: {
      lastTrade: { p: 650.25, t: 1787149800000000000 },
      lastQuote: { p: 650.2, P: 650.3 },
      day: { o: 647.5, h: 652.1, l: 645.8, c: 650.25, v: 38_500_000 },
      prevDay: { o: 642.2, h: 649.7, l: 640.1, c: 646.4, v: 54_000_000 },
      updated: 1787149800000000000,
      market_status: 'open',
    },
  };
  setLiveMarketDataServiceForTests(new LiveMarketDataService({
    env: { MASSIVE_API_KEY: 'configured-test-key', YAHOO_MARKET_DATA_ENABLED: 'false' },
    fetchFn: async () => new Response(JSON.stringify(payload), { status: 200 }),
    now: () => 1787149860000,
    logger: () => undefined,
  }));
  DataProviderRouter.resetForTests();

  const result = await requestReady();
  assert.equal(result.body.marketData.operational, true);
  assert.equal(result.body.marketData.provider, 'Massive / Polygon.io');
  assert.equal(result.body.marketData.symbol, 'SPY');
});

test('/api/ready reports sanitized market-data diagnostics when providers are unavailable', async () => {
  setLiveMarketDataServiceForTests(new LiveMarketDataService({
    env: { YAHOO_MARKET_DATA_ENABLED: 'false' },
    fetchFn: async () => { throw new Error('network must not be called'); },
    logger: () => undefined,
  }));
  DataProviderRouter.resetForTests();

  const result = await requestReady();
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.marketData.operational, false);
  assert.deepEqual(
    result.body.marketData.diagnostics.map((diagnostic: any) => diagnostic.category),
    ['missing_configuration', 'missing_configuration', 'missing_configuration', 'missing_configuration']
  );
});
