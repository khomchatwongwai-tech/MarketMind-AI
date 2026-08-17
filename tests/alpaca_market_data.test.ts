import assert from 'node:assert/strict';
import test from 'node:test';
import { AlpacaMarketDataService, AlpacaProviderError } from '../src/server/alpacaMarketDataService';
import { DataProviderRouter } from '../src/services/marketProviders/DataProviderRouter';
import { InstrumentResolver } from '../src/services/marketProviders/InstrumentResolver';

const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('Alpaca IEX snapshot parsing preserves honest provider metadata', async () => {
  const fetchMock: typeof fetch = async () => response(200, { latestTrade: { p: 201.25, t: '2026-08-16T14:30:00Z' },
    latestQuote: { bp: 201.2, ap: 201.3, bs: 4, as: 7, t: '2026-08-16T14:30:00Z' },
    dailyBar: { o: 199, h: 202, l: 198.5, c: 201.25, v: 12345 }, prevDailyBar: { c: 198 } });
  const quote = await new AlpacaMarketDataService('alpaca-key', 'alpaca-secret', fetchMock).getSnapshot('AAPL');
  assert.equal(quote.price, 201.25); assert.equal(quote.bid, 201.2); assert.equal(quote.ask, 201.3);
  assert.equal(quote.provider, 'Alpaca IEX'); assert.equal(quote.feed, 'iex'); assert.equal(quote.isConsolidated, false);
});

test('Alpaca authentication failures are explicit and never fabricate a quote', async () => {
  const fetchMock: typeof fetch = async () => response(401, { message: 'unauthorized' });
  await assert.rejects(() => new AlpacaMarketDataService('alpaca-key', 'alpaca-secret', fetchMock).getSnapshot('SPY'),
    (error: unknown) => error instanceof AlpacaProviderError && error.code === 'UNAUTHORIZED');
});

test('Alpaca outages and rate limits return explicit provider states', async () => {
  const unavailable: typeof fetch = async () => { throw new Error('offline'); };
  await assert.rejects(() => new AlpacaMarketDataService('alpaca-key', 'alpaca-secret', unavailable).getLatestTrade('SPY'),
    (error: unknown) => error instanceof AlpacaProviderError && error.code === 'UNAVAILABLE');
  const limited: typeof fetch = async () => response(429, {});
  await assert.rejects(() => new AlpacaMarketDataService('alpaca-key', 'alpaca-secret', limited).getBars('SPY'),
    (error: unknown) => error instanceof AlpacaProviderError && error.code === 'RATE_LIMITED');
});

test('Alpaca historical bars parse verified IEX OHLCV data', async () => {
  const fetchMock: typeof fetch = async () => response(200, { bars: [{ t: '2026-08-16T14:30:00Z', o: 100, h: 102, l: 99, c: 101, v: 500, vw: 100.8, n: 40 }] });
  const bars = await new AlpacaMarketDataService('alpaca-key', 'alpaca-secret', fetchMock).getBars('SPY', '5Min', 10);
  assert.deepEqual(bars[0], { timestamp: Date.parse('2026-08-16T14:30:00Z'), open: 100, high: 102, low: 99, close: 101, volume: 500, vwap: 100.8, tradeCount: 40 });
});

test('market-data routing falls back from unavailable Massive to verified Alpaca IEX', async () => {
  const previous = { key: process.env.ALPACA_API_KEY, secret: process.env.ALPACA_API_SECRET, fetch: globalThis.fetch };
  process.env.ALPACA_API_KEY = 'alpaca-key'; process.env.ALPACA_API_SECRET = 'alpaca-secret';
  globalThis.fetch = (async (url: string | URL | Request) => String(url).includes('polygon.io')
    ? response(503, {})
    : response(200, { latestTrade: { p: 501, t: '2026-08-16T14:30:00Z' }, latestQuote: { bp: 500.9, ap: 501.1, t: '2026-08-16T14:30:00Z' }, dailyBar: { o: 498, h: 502, l: 497, c: 501, v: 1000 }, prevDailyBar: { c: 499 } })) as typeof fetch;
  const instrument = InstrumentResolver.resolve('SPY').instrument;
  const result = await (DataProviderRouter as any).fetchLiveQuote(instrument, { providerId: 'massive', name: 'Massive', averageLatencyMs: 1 });
  assert.equal(result.providerId, 'alpaca'); assert.equal(result.price, 501);
  globalThis.fetch = previous.fetch;
  if (previous.key === undefined) delete process.env.ALPACA_API_KEY; else process.env.ALPACA_API_KEY = previous.key;
  if (previous.secret === undefined) delete process.env.ALPACA_API_SECRET; else process.env.ALPACA_API_SECRET = previous.secret;
});
