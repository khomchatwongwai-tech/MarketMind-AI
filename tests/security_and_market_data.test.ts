import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InstrumentResolver } from '../src/services/marketProviders/InstrumentResolver';
import { InstrumentDirectoryService } from '../src/services/marketProviders/InstrumentDirectoryService';

describe('Market Data & Instrument Directory Security Tests', () => {
  it('Resolves master instruments accurately without mock fallback corruption', () => {
    const result = InstrumentResolver.resolve('SPY');
    assert.ok(result, 'SPY instrument should resolve');
    assert.equal(result.normalizedSymbol, 'SPY');
    assert.equal(result.assetClass, 'ETF');
    assert.equal(result.instrument.exchange, 'NYSE Arca');

    const btcResult = InstrumentResolver.resolve('BTC-USD');
    assert.ok(btcResult, 'BTC-USD instrument should resolve');
    assert.equal(btcResult.assetClass, 'CRYPTO');
  });

  it('Correctly resolves all mandatory production instruments and multi-asset classes', () => {
    const symbolsToTest = [
      { sym: 'SPY', expectedClasses: ['ETF'] },
      { sym: 'AAPL', expectedClasses: ['STOCK'] },
      { sym: 'NVDA', expectedClasses: ['STOCK'] },
      { sym: 'IBM', expectedClasses: ['STOCK'] },
      { sym: 'BRK.B', expectedClasses: ['STOCK'] },
      { sym: 'BTC-USD', expectedClasses: ['CRYPTO', 'CRYPTO_PAIR'] },
      { sym: 'BTCUSDT', expectedClasses: ['CRYPTO', 'CRYPTO_PAIR'] },
      { sym: 'EUR/USD', expectedClasses: ['FOREX'] },
      { sym: 'EURUSD', expectedClasses: ['FOREX'] },
      { sym: 'ES=F', expectedClasses: ['FUTURES', 'FUTURE'] },
      { sym: 'CL=F', expectedClasses: ['FUTURES', 'FUTURE', 'COMMODITY'] },
    ];

    for (const item of symbolsToTest) {
      const res = InstrumentResolver.resolve(item.sym);
      assert.ok(res, `Failed to resolve ${item.sym}`);
      assert.ok(item.expectedClasses.includes(res.assetClass), `Mismatch asset class for ${item.sym}: got ${res.assetClass}`);
      assert.ok(res.instrument.symbol, `Missing normalized symbol for ${item.sym}`);
      assert.ok(res.instrument.exchange, `Missing exchange for ${item.sym}`);
      assert.ok(res.instrument.currency, `Missing currency for ${item.sym}`);
      assert.ok(res.instrument.name, `Missing name for ${item.sym}`);
    }
  });

  it('Instrument Directory returns normalized instruments with clean metadata', () => {
    const list = InstrumentDirectoryService.getAll();
    assert.ok(list.length > 0, 'Directory should contain master instruments');
    for (const inst of list) {
      assert.ok(inst.instrumentId, 'Instrument must have valid ID');
      assert.ok(inst.symbol, 'Instrument must have ticker');
      assert.ok(inst.name, 'Instrument must have display name');
      assert.ok(inst.assetClass, 'Instrument must have asset class');
    }
  });

  it('Fuzzy search returns matched instruments cleanly', () => {
    const searchResults = InstrumentDirectoryService.search('NVDA');
    assert.ok(searchResults.results.length > 0, 'NVDA should be found in search');
    assert.equal(searchResults.results[0].symbol, 'NVDA');
  });
});
