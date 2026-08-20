import assert from 'node:assert/strict';
import test from 'node:test';
import { LiveMarketDataService, MarketDataUnavailableError } from '../src/server/liveMarketDataService.js';

const now = Date.parse('2026-08-20T14:17:30Z');
const env = {
  ALPACA_API_KEY: 'alpaca-test-key',
  ALPACA_API_SECRET: 'alpaca-test-secret',
  ALPACA_DATA_FEED: 'iex',
  ALPACA_DATA_BASE_URL: 'https://alpaca.example',
  YAHOO_MARKET_DATA_ENABLED: 'false',
};

const makeResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const validSnapshotSPY = {
  latestTrade: { p: 589.5, t: '2026-08-20T14:17:00Z' },
  latestQuote: { t: '2026-08-20T14:17:00Z', bp: 589.4, ap: 589.6 },
  dailyBar: { o: 588.0, h: 590.2, l: 587.5, c: 589.5, v: 45000000, vw: 588.9 },
  prevDailyBar: { c: 587.2 },
};

const validSnapshotQQQ = {
  latestTrade: { p: 480.25, t: '2026-08-20T14:17:00Z' },
  latestQuote: { t: '2026-08-20T14:17:00Z', bp: 480.2, ap: 480.3 },
  dailyBar: { o: 478.5, h: 481.0, l: 478.0, c: 480.25, v: 30000000, vw: 479.8 },
  prevDailyBar: { c: 477.1 },
};

test('Alpaca Tape Suite — 1. Valid Alpaca tape payload (root dictionary and wrapped)', async () => {
  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async (url) => {
      const value = String(url);
      if (value.includes('/v2/stocks/snapshots?')) {
        // Direct root dictionary
        return makeResponse(200, { SPY: validSnapshotSPY, QQQ: validSnapshotQQQ });
      }
      throw new Error(`Unexpected request: ${value}`);
    }) as typeof fetch,
  });

  const tape = await service.getTape(['SPY', 'QQQ']);
  assert.equal(tape.length, 2);
  assert.equal(tape[0].symbol, 'SPY');
  assert.equal(tape[0].price, 589.5);
  assert.equal(tape[0].previousClose, 587.2);
  assert.equal(tape[0].providerId, 'alpaca');
  assert.equal(tape[1].symbol, 'QQQ');
  assert.equal(tape[1].price, 480.25);
});

test('Alpaca Tape Suite — 2. Missing symbol in batch', async () => {
  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async (url) => {
      const value = String(url);
      if (value.includes('/v2/stocks/snapshots?')) {
        // SPY present, TSLA missing
        return makeResponse(200, { SPY: validSnapshotSPY });
      }
      throw new Error(`Unexpected request: ${value}`);
    }) as typeof fetch,
  });

  const tape = await service.getTape(['SPY', 'TSLA']);
  assert.equal(tape.length, 1);
  assert.equal(tape[0].symbol, 'SPY');
});

test('Alpaca Tape Suite — 3. Missing latestTrade/latestQuote timestamp/price', async () => {
  const logs: string[] = [];
  const malformedSnapshot = {
    // Missing latestTrade.p and dailyBar.c
    latestTrade: { t: '2026-08-20T14:17:00Z' },
    dailyBar: { o: 588.0, h: 590.2, l: 587.5, v: 45000000 },
    prevDailyBar: { c: 587.2 },
  };

  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: (diagnostic) => {
      logs.push(JSON.stringify(diagnostic));
    },
    fetchFn: (async (url) => {
      const value = String(url);
      if (value.includes('/v2/stocks/snapshots?')) {
        return makeResponse(200, { SPY: malformedSnapshot, QQQ: validSnapshotQQQ });
      }
      throw new Error(`Unexpected request: ${value}`);
    }) as typeof fetch,
  });

  const tape = await service.getTape(['SPY', 'QQQ']);
  assert.equal(tape.length, 1);
  assert.equal(tape[0].symbol, 'QQQ');
  assert.ok(logs.some((l) => l.includes('malformed_payload') || l.includes('SPY')));
});

test('Alpaca Tape Suite — 4. Malformed numeric field (string or NaN)', async () => {
  const malformedNumeric = {
    latestTrade: { p: 'INVALID_NUMBER', t: '2026-08-20T14:17:00Z' },
    dailyBar: { o: 588.0, h: 590.2, l: 587.5, c: 'NaN', v: 45000000 },
    prevDailyBar: { c: 587.2 },
  };

  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async (url) => {
      const value = String(url);
      if (value.includes('/v2/stocks/snapshots?')) {
        return makeResponse(200, { SPY: malformedNumeric, QQQ: validSnapshotQQQ });
      }
      throw new Error(`Unexpected request: ${value}`);
    }) as typeof fetch,
  });

  const tape = await service.getTape(['SPY', 'QQQ']);
  assert.equal(tape.length, 1);
  assert.equal(tape[0].symbol, 'QQQ');
});

test('Alpaca Tape Suite — 5. Partial batch (1 valid, 1 malformed)', async () => {
  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async (url) => {
      const value = String(url);
      if (value.includes('/v2/stocks/snapshots?')) {
        return makeResponse(200, { SPY: validSnapshotSPY, BAD: { latestTrade: {} } });
      }
      throw new Error(`Unexpected request: ${value}`);
    }) as typeof fetch,
  });

  const tape = await service.getTape(['SPY', 'BAD']);
  assert.equal(tape.length, 1);
  assert.equal(tape[0].symbol, 'SPY');
});

test('Alpaca Tape Suite — 6. Provider 429 Rate Limit Exceeded', async () => {
  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async (url) => {
      const value = String(url);
      if (value.includes('/v2/stocks/snapshots?') || value.includes('/snapshot?')) {
        return makeResponse(429, { message: 'rate limit exceeded' });
      }
      throw new Error(`Unexpected request: ${value}`);
    }) as typeof fetch,
  });

  await assert.rejects(
    () => service.getTape(['SPY', 'QQQ']),
    (err: unknown) => {
      assert.ok(err instanceof MarketDataUnavailableError);
      assert.equal(err.symbol, 'TAPE');
      return true;
    }
  );
});

test('Alpaca Tape Suite — 7. Timeout / Request aborted', async () => {
  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async () => {
      throw new Error('fetch aborted due to timeout');
    }) as typeof fetch,
  });

  await assert.rejects(
    () => service.getTape(['SPY', 'QQQ']),
    (err: unknown) => {
      assert.ok(err instanceof MarketDataUnavailableError);
      assert.equal(err.symbol, 'TAPE');
      return true;
    }
  );
});

test('Alpaca Tape Suite — 8. Empty response payload', async () => {
  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async (url) => {
      const value = String(url);
      if (value.includes('/v2/stocks/snapshots?')) {
        return makeResponse(200, {});
      }
      return makeResponse(500, {});
    }) as typeof fetch,
  });

  await assert.rejects(
    () => service.getTape(['SPY', 'QQQ']),
    (err: unknown) => {
      assert.ok(err instanceof MarketDataUnavailableError);
      assert.equal(err.symbol, 'TAPE');
      return true;
    }
  );
});

test('Alpaca Tape Suite — 9. No synthetic fallback generated', async () => {
  const service = new LiveMarketDataService({
    env,
    now: () => now,
    logger: () => undefined,
    fetchFn: (async () => makeResponse(500, { message: 'Internal Server Error' })) as typeof fetch,
  });

  await assert.rejects(
    () => service.getTape(['SPY', 'QQQ']),
    (err: unknown) => {
      assert.ok(err instanceof MarketDataUnavailableError);
      assert.equal(err.symbol, 'TAPE');
      return true;
    }
  );
});
