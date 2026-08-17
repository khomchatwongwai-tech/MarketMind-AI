import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RealtimeCandleAggregator } from '../src/services/realtime/RealtimeCandleAggregator';
import { TradingViewDatafeedAdapter } from '../src/services/realtime/TradingViewDatafeedAdapter';
import { RealTimeMarketManager } from '../src/services/realtime/RealTimeMarketManager';
import { ChartCandle } from '../src/types/chart';

describe('TradingView Real-Time Chart Integration & Datafeed Suite', () => {
  let aggregator: RealtimeCandleAggregator;
  let adapter: TradingViewDatafeedAdapter;
  let marketManager: RealTimeMarketManager;

  beforeEach(() => {
    aggregator = RealtimeCandleAggregator.getInstance();
    adapter = TradingViewDatafeedAdapter.getInstance();
    marketManager = RealTimeMarketManager.getInstance();
    aggregator.clear();
  });

  it('Step 1: Correctly converts timeframes & TradingView resolutions to seconds', () => {
    assert.strictEqual(aggregator.resolutionToSeconds('1m'), 60);
    assert.strictEqual(aggregator.resolutionToSeconds('1'), 60);
    assert.strictEqual(aggregator.resolutionToSeconds('2m'), 120);
    assert.strictEqual(aggregator.resolutionToSeconds('5m'), 300);
    assert.strictEqual(aggregator.resolutionToSeconds('5'), 300);
    assert.strictEqual(aggregator.resolutionToSeconds('15m'), 900);
    assert.strictEqual(aggregator.resolutionToSeconds('30m'), 1800);
    assert.strictEqual(aggregator.resolutionToSeconds('1h'), 3600);
    assert.strictEqual(aggregator.resolutionToSeconds('60'), 3600);
    assert.strictEqual(aggregator.resolutionToSeconds('4h'), 14400);
    assert.strictEqual(aggregator.resolutionToSeconds('1d'), 86400);
    assert.strictEqual(aggregator.resolutionToSeconds('1w'), 604800);
  });

  it('Step 2: Aggregates multiple real-time ticks within the same bar interval', () => {
    const symbol = 'SPY';
    const resolution = '5m';
    const baseTimeSec = 1700000000 - (1700000000 % 300); // exactly on 5m boundary

    // First tick: opens the candle
    const res1 = aggregator.processTick(symbol, resolution, {
      price: 500.0,
      size: 100,
      timestamp: baseTimeSec * 1000 + 5000,
    });
    assert.ok(res1 !== null);
    assert.strictEqual(res1!.isNew, true);
    assert.strictEqual(res1!.candle.open, 500.0);
    assert.strictEqual(res1!.candle.high, 500.0);
    assert.strictEqual(res1!.candle.low, 500.0);
    assert.strictEqual(res1!.candle.close, 500.0);
    assert.strictEqual(res1!.candle.volume, 100);

    // Second tick (higher price, within same 5m interval)
    const res2 = aggregator.processTick(symbol, resolution, {
      price: 502.5,
      size: 200,
      timestamp: baseTimeSec * 1000 + 30000,
    });
    assert.strictEqual(res2!.isNew, false);
    assert.strictEqual(res2!.candle.open, 500.0);
    assert.strictEqual(res2!.candle.high, 502.5);
    assert.strictEqual(res2!.candle.low, 500.0);
    assert.strictEqual(res2!.candle.close, 502.5);
    assert.strictEqual(res2!.candle.volume, 300);

    // Third tick (lower price)
    const res3 = aggregator.processTick(symbol, resolution, {
      price: 499.2,
      size: 50,
      timestamp: baseTimeSec * 1000 + 60000,
    });
    assert.strictEqual(res3!.isNew, false);
    assert.strictEqual(res3!.candle.high, 502.5);
    assert.strictEqual(res3!.candle.low, 499.2);
    assert.strictEqual(res3!.candle.close, 499.2);
    assert.strictEqual(res3!.candle.volume, 350);
  });

  it('Step 3: Creates a new candle when the timestamp advances past the bar boundary', () => {
    const symbol = 'NVDA';
    const resolution = '1m';
    const baseTimeSec = 1700000000 - (1700000000 % 60);

    aggregator.processTick(symbol, resolution, {
      price: 130.0,
      size: 50,
      timestamp: baseTimeSec * 1000 + 1000,
    });

    // Advance 65 seconds into the next 1m bar
    const nextTick = aggregator.processTick(symbol, resolution, {
      price: 131.5,
      size: 150,
      timestamp: (baseTimeSec + 65) * 1000,
    });

    assert.ok(nextTick !== null);
    assert.strictEqual(nextTick!.isNew, true);
    assert.strictEqual(nextTick!.candle.time, baseTimeSec + 60);
    assert.strictEqual(nextTick!.candle.open, 131.5);
    assert.strictEqual(nextTick!.candle.high, 131.5);
    assert.strictEqual(nextTick!.candle.low, 131.5);
    assert.strictEqual(nextTick!.candle.close, 131.5);
    assert.strictEqual(nextTick!.candle.volume, 150);
  });

  it('Step 4: Resolves symbol metadata accurately for all asset classes', () => {
    const stockInfo = adapter.resolveSymbol('AAPL');
    assert.strictEqual(stockInfo.type, 'stock');
    assert.strictEqual(stockInfo.timezone, 'America/New_York');
    assert.strictEqual(stockInfo.session, '0930-1600:23456');

    const cryptoInfo = adapter.resolveSymbol('BTC-USD');
    assert.strictEqual(cryptoInfo.type, 'crypto');
    assert.strictEqual(cryptoInfo.timezone, 'Etc/UTC');
    assert.strictEqual(cryptoInfo.session, '24x7');

    const forexInfo = adapter.resolveSymbol('EUR/USD');
    assert.strictEqual(forexInfo.type, 'forex');
    assert.strictEqual(forexInfo.pricescale, 10000);

    const futuresInfo = adapter.resolveSymbol('ES');
    assert.strictEqual(futuresInfo.type, 'futures');
    assert.strictEqual(futuresInfo.timezone, 'America/Chicago');
  });

  it('Step 5: Seeds aggregator from historical candles seamlessly', () => {
    const symbol = 'QQQ';
    const resolution = '15m';
    const seedCandle: ChartCandle = {
      time: 1700000000,
      open: 440.0,
      high: 442.0,
      low: 439.5,
      close: 441.8,
      volume: 120000,
    };

    aggregator.seedLastCandle(symbol, resolution, seedCandle);
    const active = aggregator.getActiveCandle(symbol, resolution);
    assert.ok(active !== null);
    assert.strictEqual(active!.close, 441.8);

    // Live tick on same interval updates high
    const updated = aggregator.processTick(symbol, resolution, {
      price: 443.0,
      size: 500,
      timestamp: 1700000000 * 1000 + 10000,
    });
    assert.strictEqual(updated!.candle.high, 443.0);
    assert.strictEqual(updated!.candle.volume, 120500);
  });

  it('Step 6: Real-time subscription receives and processes real market ticks', () => {
    const symbol = 'TSLA';
    const resolution = '5m';
    let receivedBar: any = null;

    adapter.subscribeBars(
      symbol,
      resolution,
      (bar) => {
        receivedBar = bar;
      },
      'test_sub_tsla'
    );

    // Emit live trade via MarketManager
    marketManager.emitTrade({
      symbol: 'TSLA',
      price: 220.5,
      size: 500,
      timestamp: Date.now(),
      provider: 'Massive / Polygon Direct Stream',
      mode: 'REAL_TIME',
    });

    assert.ok(receivedBar !== null);
    assert.strictEqual(receivedBar.close, 220.5);

    adapter.unsubscribeBars('test_sub_tsla');
  });

  it('Step 7: Real-time diagnostics track engine, latency and traces', () => {
    const diag = adapter.getDiagnostics();
    assert.ok(diag.engine.includes('TRADINGVIEW LIGHTWEIGHT CHARTS'));
    assert.ok(diag.historicalBarsStatus !== undefined);
    assert.strictEqual(Array.isArray(diag.recentTraces), true);
  });
});
