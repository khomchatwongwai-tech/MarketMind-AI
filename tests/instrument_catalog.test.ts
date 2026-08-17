import assert from 'node:assert/strict';
import test from 'node:test';
import { InstrumentDirectoryService, MASTER_INSTRUMENTS } from '../src/services/marketProviders/InstrumentDirectoryService';

test('expanded catalog covers every requested market family', () => {
  const required = ['STOCK', 'ADR', 'ETF', 'FUND', 'CRYPTO_PAIR', 'FOREX', 'FUTURES', 'COMMODITY', 'BOND', 'TREASURY', 'INDEX', 'OPTION', 'INDEX_OPTION', 'ECONOMIC_INDICATOR'];
  for (const assetClass of required) {
    assert.ok(MASTER_INSTRUMENTS.some((instrument) => instrument.assetClass === assetClass), `${assetClass} catalog is empty`);
  }
  assert.ok(MASTER_INSTRUMENTS.length >= 350, `expected broad catalog, received ${MASTER_INSTRUMENTS.length}`);
});

test('symbols and provider-native tickers resolve for ticker switching', () => {
  for (const symbol of ['NVDA', 'TSM', 'BTC-USD', 'EURUSD=X', 'ES=F', 'GC=F', '^TNX', '^GSPC', 'CPIAUCSL']) {
    const instrument = InstrumentDirectoryService.getBySymbol(symbol);
    assert.ok(instrument, `${symbol} did not resolve`);
    assert.ok(instrument.providerSymbol.length > 0);
  }
});

test('cross-asset search finds names, display tickers, and provider symbols', () => {
  assert.ok(InstrumentDirectoryService.search('Bitcoin').results.some((instrument) => instrument.providerSymbol === 'BTC-USD'));
  assert.ok(InstrumentDirectoryService.search('/ES').results.some((instrument) => instrument.providerSymbol === 'ES=F'));
  assert.ok(InstrumentDirectoryService.search('US10Y').results.some((instrument) => instrument.providerSymbol === '^TNX'));
});
