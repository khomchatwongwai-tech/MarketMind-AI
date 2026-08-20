import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MARKET_UNIVERSE } from '../src/data/marketUniverse.js';

describe('Market Scanner Data Universe Suite', () => {
  it('contains valid universe items with required metadata fields', () => {
    assert.ok(MARKET_UNIVERSE.length >= 50, 'Market universe should contain at least 50 core assets');

    for (const item of MARKET_UNIVERSE) {
      assert.ok(item.symbol, 'Every universe item must have a symbol');
      assert.ok(item.name, 'Every universe item must have a name');
      assert.ok(['STOCK', 'ETF'].includes(item.type), 'Type must be STOCK or ETF');
      assert.ok(item.sector, 'Every universe item must have a sector');
      assert.ok(Array.isArray(item.presetTags), 'presetTags must be an array');
    }
  });

  it('correctly categorizes benchmark ETFs and mega-cap stocks in presets', () => {
    const sp500Items = MARKET_UNIVERSE.filter((i) => i.presetTags.includes('sp500'));
    const nasdaqItems = MARKET_UNIVERSE.filter((i) => i.presetTags.includes('nasdaq100'));
    const dowItems = MARKET_UNIVERSE.filter((i) => i.presetTags.includes('dow30'));
    const etfItems = MARKET_UNIVERSE.filter((i) => i.type === 'ETF');

    assert.ok(sp500Items.length >= 25, 'S&P 500 preset contains major components');
    assert.ok(nasdaqItems.length >= 15, 'Nasdaq 100 preset contains tech components');
    assert.ok(dowItems.length >= 10, 'Dow 30 preset contains Dow components');
    assert.ok(etfItems.length >= 10, 'ETF preset contains sector and index ETFs');
  });

  it('contains mandatory SPY, QQQ, NVDA, AAPL, MSFT benchmark symbols', () => {
    const tickers = new Set(MARKET_UNIVERSE.map((i) => i.symbol));
    assert.ok(tickers.has('SPY'));
    assert.ok(tickers.has('QQQ'));
    assert.ok(tickers.has('NVDA'));
    assert.ok(tickers.has('AAPL'));
    assert.ok(tickers.has('MSFT'));
  });
});
