import assert from 'node:assert/strict';
import test from 'node:test';
import { LiveMarketDataService, MarketDataUnavailableError } from '../src/server/liveMarketDataService.js';

const now = Date.parse('2026-08-20T14:17:30Z');
const env = { ALPACA_API_KEY: 'alpaca-key', ALPACA_API_SECRET: 'alpaca-secret', ALPACA_DATA_FEED: 'iex', ALPACA_DATA_BASE_URL: 'https://alpaca.example', YAHOO_MARKET_DATA_ENABLED: 'true' };
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const snapshot = { latestTrade: { p: 765.5, t: '2026-08-20T14:17:00Z' }, latestQuote: { t: '2026-08-20T14:17:00Z', bp: 765.4, ap: 765.6 }, dailyBar: { o: 765, h: 767, l: 764, c: 765.5, v: 1000 }, prevDailyBar: { c: 760 } };

test('Alpaca IEX supplies quote, five-minute candles, and batch market tape before Yahoo', async () => {
  const calls: string[] = [];
  const service = new LiveMarketDataService({ env, now: () => now, logger: () => undefined, fetchFn: (async (url) => {
    const value = String(url); calls.push(value);
    if (value.includes('/bars?')) return response(200, { bars: [{ t: '2026-08-20T14:15:00Z', o: 765, h: 766, l: 764.5, c: 765.5, v: 500 }] });
    if (value.includes('/snapshots?')) return response(200, { snapshots: { SPY: snapshot, QQQ: { ...snapshot, latestTrade: { p: 500, t: '2026-08-20T14:17:00Z' } } } });
    if (value.includes('/snapshot?')) return response(200, snapshot);
    throw new Error(`unexpected provider request ${value}`);
  }) as typeof fetch });
  assert.equal((await service.getQuote('SPY')).providerId, 'alpaca');
  assert.equal((await service.getCandles('SPY', '5m'))[0].providerId, 'alpaca');
  assert.equal((await service.getTape(['SPY', 'QQQ'])).length, 2);
  assert.equal(calls.some((url) => url.includes('yahoo')), false);
});

test('candle provider order fails over from rate-limited Alpaca to Massive without retrying Alpaca', async () => {
  const calls: string[] = [];
  const service = new LiveMarketDataService({ env: { ...env, MASSIVE_API_KEY: 'massive-secret' }, now: () => now, logger: () => undefined, fetchFn: (async (url) => {
    const value = String(url); calls.push(value);
    if (value.includes('alpaca.example')) return response(429, {});
    if (value.includes('polygon.io')) return response(200, { results: [{ t: now, o: 765, h: 766, l: 764, c: 765.5, v: 100 }] });
    throw new Error('Yahoo should not be reached');
  }) as typeof fetch });
  assert.equal((await service.getCandles('SPY', '5m'))[0].providerId, 'massive');
  assert.equal(calls.filter((url) => url.includes('alpaca.example')).length, 1);
  assert.equal(calls.some((url) => url.includes('polygon.io')), true);
});

test('complete candle provider outage returns sanitized unavailable state', async () => {
  const service = new LiveMarketDataService({ env, now: () => now, logger: () => undefined, fetchFn: async () => response(503, {}) });
  await assert.rejects(() => service.getCandles('SPY', '5m'), (error: unknown) => error instanceof MarketDataUnavailableError && error.diagnostics.length >= 2);
});
