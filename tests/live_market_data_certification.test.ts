import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DataProviderRouter } from '../src/services/marketProviders/DataProviderRouter';
import { InstrumentDirectoryService } from '../src/services/marketProviders/InstrumentDirectoryService';
import { TradingViewDatafeedAdapter } from '../src/services/realtime/TradingViewDatafeedAdapter';
import { RealtimeCandleAggregator } from '../src/services/realtime/RealtimeCandleAggregator';
import { AppConfig } from '../src/config/environment';
import {
  LiveMarketDataService,
  MarketDataUnavailableError,
  setLiveMarketDataServiceForTests,
} from '../src/server/liveMarketDataService';

const providerResponse = new Response(JSON.stringify({
  ticker: {
    lastTrade: { p: 650.25, t: 1787149800000000000 },
    lastQuote: { p: 650.2, P: 650.3 },
    day: { o: 647.5, h: 652.1, l: 645.8, c: 650.25, v: 38_500_000 },
    prevDay: { o: 642.2, h: 649.7, l: 640.1, c: 646.4, v: 54_000_000 },
    updated: 1787149800000000000,
    market_status: 'open',
  },
}), { status: 200, headers: { 'content-type': 'application/json' } });

setLiveMarketDataServiceForTests(new LiveMarketDataService({
  env: { MASSIVE_API_KEY: 'configured-test-key', YAHOO_MARKET_DATA_ENABLED: 'false' },
  fetchFn: async () => providerResponse.clone(),
  now: () => 1787149860000,
  logger: () => undefined,
}));
DataProviderRouter.resetForTests();

describe('MarketMind AI — Live Market Data Certification Suite', () => {
  it('1. Zero Simulation Mandate: allowSimulatedMarketData is strictly false in production', () => {
    assert.equal(typeof AppConfig.allowSimulatedMarketData, 'boolean');
    if (AppConfig.isProduction) {
      assert.equal(AppConfig.allowSimulatedMarketData, false, 'Production must never allow simulated market data');
    }
  });

  it('2. Massive / Polygon Provider: returns a validated provider quote', async () => {
    const quote = await DataProviderRouter.getQuote('NVDA');
    assert.ok(quote);
    assert.ok(quote.instrument);
    assert.equal(quote.instrument.symbol, 'NVDA');
    assert.ok(typeof quote.quote.price === 'number' && quote.quote.price > 0);
    assert.ok(quote.quote.metadata);
  });

  it('3. Multi-Asset Symbols Resolution: SPY, AAPL, NVDA, QQQ resolve with legitimate metadata', () => {
    const symbols = ['SPY', 'AAPL', 'NVDA', 'QQQ'];
    for (const sym of symbols) {
      const inst = InstrumentDirectoryService.getBySymbol(sym);
      assert.ok(inst, `Expected ${sym} to resolve in InstrumentDirectoryService`);
      assert.equal(inst.symbol, sym);
      assert.ok(inst.name.length > 0, `Expected ${sym} to have valid name`);
      assert.equal(inst.currency, 'USD');
      assert.equal(inst.country, 'United States');
      assert.ok(inst.tradingSession.includes('US_EQUITIES'));
    }
  });

  it('4. Realtime Quote Structure: Contains bid, ask, volume, spread, timestamps and no NaN', async () => {
    const quoteRes = await DataProviderRouter.getQuote('SPY');
    assert.ok(quoteRes);
    const q = quoteRes.quote;
    assert.ok(!isNaN(q.price), 'Quote price cannot be NaN');
    assert.ok(!isNaN(q.change), 'Quote change cannot be NaN');
    assert.ok(!isNaN(q.changePercent), 'Quote changePercent cannot be NaN');
    assert.ok(!isNaN(q.volume), 'Quote volume cannot be NaN');
    assert.ok(q.timestamp && q.timestamp.length > 0, 'Quote must have timestamp string');
    assert.ok(q.metadata, 'Quote must have metadata block');
    assert.ok(!isNaN(q.metadata.timestamp), 'Quote metadata timestamp must be a valid number');
  });

  it('5. TradingView Resolution Normalization: Supports 1m, 5m, 15m, 1h, 1d timeframes', () => {
    const adapter = TradingViewDatafeedAdapter.getInstance();
    assert.equal(adapter.normalizeResolution('1'), '1m');
    assert.equal(adapter.normalizeResolution('1m'), '1m');
    assert.equal(adapter.normalizeResolution('5'), '5m');
    assert.equal(adapter.normalizeResolution('5m'), '5m');
    assert.equal(adapter.normalizeResolution('15'), '15m');
    assert.equal(adapter.normalizeResolution('15m'), '15m');
    assert.equal(adapter.normalizeResolution('60'), '1h');
    assert.equal(adapter.normalizeResolution('1h'), '1h');
    assert.equal(adapter.normalizeResolution('1D'), '1d');
    assert.equal(adapter.normalizeResolution('D'), '1d');
    assert.equal(adapter.normalizeResolution('1W'), '1w');
  });

  it('6. TradingView Symbol Info: Resolves session, timezone, and pricescale for all asset classes', () => {
    const adapter = TradingViewDatafeedAdapter.getInstance();
    
    // Stock / ETF
    const spyInfo = adapter.resolveSymbol('SPY');
    assert.equal(spyInfo.ticker, 'SPY');
    assert.equal(spyInfo.timezone, 'America/New_York');
    assert.equal(spyInfo.has_intraday, true);
    assert.equal(spyInfo.pricescale, 100);

    // Crypto
    const btcInfo = adapter.resolveSymbol('BTC-USD');
    assert.equal(btcInfo.type, 'crypto');
    assert.equal(btcInfo.timezone, 'Etc/UTC');

    // Forex
    const fxInfo = adapter.resolveSymbol('EUR/USD');
    assert.equal(fxInfo.type, 'forex');
    assert.equal(fxInfo.pricescale, 10000);
  });

  it('7. Realtime Candle Aggregator: Correctly aggregates live ticks into bar boundaries', () => {
    const aggregator = RealtimeCandleAggregator.getInstance();
    const symbol = 'AAPL';
    const timeframe = '5m';

    // Bar 1 start: 1000000 (in seconds, bar bucket is 999900)
    const res1 = aggregator.processTick(symbol, timeframe, { price: 220.0, size: 500, timestamp: 1000000 });
    assert.ok(res1);
    assert.equal(res1.isNew, true);
    assert.equal(res1.candle.open, 220.0);
    assert.equal(res1.candle.high, 220.0);
    assert.equal(res1.candle.low, 220.0);
    assert.equal(res1.candle.close, 220.0);
    assert.equal(res1.candle.volume, 500);

    // Intra-bar tick: higher price 225.0 (timestamp 1000050 is in same 999900 bucket)
    const res2 = aggregator.processTick(symbol, timeframe, { price: 225.0, size: 300, timestamp: 1000050 });
    assert.ok(res2);
    assert.equal(res2.isNew, false);
    assert.equal(res2.candle.high, 225.0);
    assert.equal(res2.candle.low, 220.0);
    assert.equal(res2.candle.close, 225.0);
    assert.equal(res2.candle.volume, 800);

    // Intra-bar tick: lower price 218.0 (timestamp 1000150 is in same 999900 bucket)
    const res3 = aggregator.processTick(symbol, timeframe, { price: 218.0, size: 200, timestamp: 1000150 });
    assert.ok(res3);
    assert.equal(res3.isNew, false);
    assert.equal(res3.candle.high, 225.0);
    assert.equal(res3.candle.low, 218.0);
    assert.equal(res3.candle.close, 218.0);
    assert.equal(res3.candle.volume, 1000);

    // Next bar boundary (timestamp 1000300 advances to 1000200 bucket)
    const res4 = aggregator.processTick(symbol, timeframe, { price: 222.0, size: 600, timestamp: 1000300 });
    assert.ok(res4);
    assert.equal(res4.isNew, true);
    assert.equal(res4.candle.open, 222.0);
    assert.equal(res4.candle.volume, 600);
  });

  it('8. Market Session Determination: Distinguishes 24/7 crypto from US equity session windows', () => {
    const nvda = InstrumentDirectoryService.getBySymbol('NVDA');
    assert.ok(nvda);
    const state = DataProviderRouter.determineMarketState(nvda);
    assert.ok(['REGULAR', 'PRE_MARKET', 'AFTER_HOURS', 'CLOSED'].includes(state));

    const btc = InstrumentDirectoryService.getBySymbol('BTC-USD');
    assert.ok(btc);
    const btcState = DataProviderRouter.determineMarketState(btc);
    assert.equal(btcState, 'ACTIVE_24_7');
  });

  it('9. Stale Data & Unavailability Handling: provider failure never generates mock data', async () => {
    const unavailable = new LiveMarketDataService({
      env: { YAHOO_MARKET_DATA_ENABLED: 'false' },
      fetchFn: async () => { throw new Error('network must not be called'); },
      logger: () => undefined,
    });
    await assert.rejects(
      () => unavailable.getQuote('SPY'),
      (error: unknown) => error instanceof MarketDataUnavailableError
    );
  });
});
