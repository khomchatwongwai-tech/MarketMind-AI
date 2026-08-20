import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { LiveMarketDataService, MarketDataProviderError } from '../src/server/liveMarketDataService.js';
import { RobinhoodMarketDataError, RobinhoodMarketDataService } from '../src/server/robinhoodMarketDataService.js';

const now = Date.parse('2026-08-20T14:17:30Z');
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const env = { ROBINHOOD_MARKET_DATA_ENABLED: 'true', ROBINHOOD_READ_ONLY: 'true', ROBINHOOD_MARKET_DATA_BASE_URL: 'https://gateway.example', YAHOO_MARKET_DATA_ENABLED: 'false' };
const quotePayload = { data: { results: [{ quote: { last_trade_price: '765.525', adjusted_previous_close: '769.06', bid_price: '765.49', ask_price: '765.50', venue_last_trade_time: '2026-08-20T14:17:16Z' } }] } };
const fundamentalsPayload = { data: { results: [{ open: '765.95', high: '767.75', low: '765.86', volume: 2517283 }] } };

test('Robinhood successful quote is normalized with provenance metadata', async () => {
  const service = new LiveMarketDataService({ env, now: () => now, logger: () => undefined, fetchFn: async (url) => String(url).endsWith('get_equity_quotes') ? response(200, quotePayload) : response(200, fundamentalsPayload) });
  const quote = await service.getQuote('SPY');
  assert.equal(quote.providerId, 'robinhood');
  assert.equal(quote.price, 765.525);
  assert.equal(quote.bid, 765.49);
  assert.equal(quote.ask, 765.5);
  assert.equal(quote.isRealTime, true);
});

test('Robinhood provides Level 2 price-book and five-minute candles through read-only operations', async () => {
  const service = new RobinhoodMarketDataService({ env, now: () => now, fetchFn: async (url) => String(url).endsWith('get_equity_price_book') ? response(200, { data: { books: [{ symbol: 'SPY', bids: [{ price: '765.49', quantity: 100 }], asks: [{ price: '765.50', quantity: 200 }] }] } }) : response(200, { data: { results: [{ symbol: 'SPY', interval: '5minute', bars: [{ begins_at: '2026-08-20T14:10:00Z', open_price: '766', high_price: '767', low_price: '765', close_price: '765.9', volume: 1000 }] }] } }) });
  const [book, candles] = await Promise.all([service.getEquityPriceBook(['SPY']), service.getEquityHistoricals({ symbols: ['SPY'], interval: '5minute' })]);
  assert.equal(book.data.books[0].bids[0].price, '765.49');
  assert.equal(candles.data.results[0].bars[0].close_price, '765.9');
});

test('Robinhood option quote uses an allowed read-only operation', async () => {
  const service = new RobinhoodMarketDataService({ env, fetchFn: async () => response(200, { data: { results: [{ mark_price: '2.15' }] } }) });
  const result = await service.getOptionQuotes({ option_ids: ['option-id'] });
  assert.equal(result.data.results[0].mark_price, '2.15');
});

test('Robinhood request deduplication and quote caching prevent duplicate gateway calls', async () => {
  let calls = 0;
  const service = new RobinhoodMarketDataService({ env, now: () => now, fetchFn: async () => { calls += 1; return response(200, { data: { results: [] } }); } });
  await Promise.all([service.getEquityQuotes(['SPY']), service.getEquityQuotes(['SPY'])]);
  await service.getEquityQuotes(['SPY']);
  assert.equal(calls, 1);
});

test('timeout, unauthorized, rate-limit, and malformed payload are fail-closed', async () => {
  const cases: Array<[string, typeof fetch, string]> = [
    ['unauthorized', async () => response(401, {}), 'unauthorized'],
    ['rate-limited', async () => response(429, {}), 'rate_limited'],
    ['malformed', async () => new Response('not json', { status: 200 }), 'malformed_payload'],
  ];
  for (const [, fetchFn, expected] of cases) {
    const service = new RobinhoodMarketDataService({ env, fetchFn });
    await assert.rejects(() => service.getEquityQuotes(['SPY']), (error: unknown) => error instanceof RobinhoodMarketDataError && error.status === expected);
  }
  const timeoutService = new RobinhoodMarketDataService({ env: { ...env, ROBINHOOD_TIMEOUT_MS: '1' }, fetchFn: async (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('abort'), { name: 'AbortError' })))) as any });
  await assert.rejects(() => timeoutService.getEquityQuotes(['SPY']), (error: unknown) => error instanceof RobinhoodMarketDataError && error.status === 'timeout');
});

test('Robinhood stale quote is rejected and failover continues to Yahoo', async () => {
  const stale = new LiveMarketDataService({ env: { ...env, YAHOO_MARKET_DATA_ENABLED: 'true' }, now: () => now, logger: () => undefined, fetchFn: async (url) => {
    if (String(url).includes('gateway.example')) return String(url).endsWith('get_equity_quotes') ? response(200, { data: { results: [{ quote: { ...quotePayload.data.results[0].quote, venue_last_trade_time: '2026-08-19T14:17:16Z' } }] } }) : response(200, fundamentalsPayload);
    return response(200, { chart: { result: [{ meta: { regularMarketPrice: 700, chartPreviousClose: 699, regularMarketDayHigh: 701, regularMarketDayLow: 698, regularMarketOpen: 699.5, regularMarketVolume: 100, regularMarketTime: now, currency: 'USD' }, timestamp: [now], indicators: { quote: [{ high: [701], low: [698], open: [699.5], close: [700], volume: [100] }] } }] } });
  } });
  const quote = await stale.getQuote('SPY');
  assert.equal(quote.providerId, 'yahoo');
});

test('Robinhood failure rotates to the next healthy provider', async () => {
  const service = new LiveMarketDataService({ env: { ...env, YAHOO_MARKET_DATA_ENABLED: 'true' }, now: () => now, logger: () => undefined, fetchFn: async (url) => String(url).includes('gateway.example') ? response(503, {}) : response(200, { chart: { result: [{ meta: { regularMarketPrice: 700, chartPreviousClose: 699, regularMarketDayHigh: 701, regularMarketDayLow: 698, regularMarketOpen: 699.5, regularMarketVolume: 100, regularMarketTime: now, currency: 'USD' }, timestamp: [now], indicators: { quote: [{ high: [701], low: [698], open: [699.5], close: [700], volume: [100] }] } }] } }) });
  assert.equal((await service.getQuote('SPY')).providerId, 'yahoo');
});

test('Robinhood adapter excludes non-read-only capabilities and production defaults remain disabled', async () => {
  const source = await readFile(new URL('../src/server/robinhoodMarketDataService.ts', import.meta.url), 'utf8');
  for (const prohibited of ['place_equity_order', 'place_option_order', 'cancel_equity_order', 'cancel_option_order', 'exercise_option', 'cancel_option_exercise']) assert.equal(source.includes(prohibited), false);
  const disabled = new RobinhoodMarketDataService({ env: {} });
  assert.equal(disabled.getHealth().status, 'disabled');
  await assert.rejects(() => disabled.getEquityQuotes(['SPY']), (error: unknown) => error instanceof RobinhoodMarketDataError && error.status === 'disabled');
});
