import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildStructuredMarketContext, executeAskMarketMind, executeAnalyzeMarket, executeWhyIsItMoving } from '../src/services/geminiMarketService';
import { SmartAlertEngine } from '../src/services/smartAlertEngine';
import { InstitutionalMarketDataProvider } from '../src/services/marketProviders/InstitutionalMarketDataProvider';
import { AppConfig } from '../src/config/environment';

describe('Production Blocker & Zero Fabricated Data Tests', () => {
  it('buildStructuredMarketContext returns null and UNAVAILABLE when quote data is missing', () => {
    const context = buildStructuredMarketContext(null, 'SPY');
    assert.strictEqual(context.status, 'UNAVAILABLE');
    assert.strictEqual(context.currentPrice, null);
    assert.strictEqual(context.currentPriceStatus, 'UNAVAILABLE');
  });

  it('buildStructuredMarketContext preserves null values without injecting 512.48 or 510.18', () => {
    const emptyMarketData = {
      quote: { ticker: 'AAPL' },
      technicals: {},
      supportResistance: {},
    };
    const context = buildStructuredMarketContext(emptyMarketData, 'AAPL');
    assert.strictEqual(context.currentPrice, null);
    assert.strictEqual(context.indicators.vwap, null);
    assert.strictEqual(context.supportResistance.s1, null);
    assert.strictEqual(context.supportResistance.r1, null);
  });

  it('executeAskMarketMind handles missing current price gracefully without inventing numbers', async () => {
    const result = await executeAskMarketMind({
      question: 'Why is it moving?',
      ticker: 'TSLA',
      marketData: null,
      aiClient: null,
    });
    assert.strictEqual(result.status, 'UNAVAILABLE');
    assert.ok(result.answer.includes('unavailable') || result.answer.includes('UNAVAILABLE'));
  });

  it('executeAnalyzeMarket returns UNAVAILABLE when price is null and ai is null', async () => {
    const result = await executeAnalyzeMarket({
      ticker: 'NVDA',
      marketData: null,
      aiClient: null,
    });
    assert.strictEqual(result.status, 'UNAVAILABLE');
    assert.ok(result.summary.includes('unavailable'));
  });

  it('executeWhyIsItMoving returns UNAVAILABLE when price is null and ai is null', async () => {
    const result = await executeWhyIsItMoving({
      ticker: 'SPY',
      marketData: null,
      aiClient: null,
    });
    assert.strictEqual(result.status, 'UNAVAILABLE');
    assert.strictEqual(result.keyLevels.vwap, 'Unavailable');
  });

  it('SmartAlertEngine returns an empty array for new users', () => {
    const notifs = SmartAlertEngine.getNotifications();
    assert.ok(Array.isArray(notifs));
    assert.strictEqual(notifs.length, 0);
  });

  it('InstitutionalMarketDataProvider never fabricates an options chain', async () => {
    const provider = new InstitutionalMarketDataProvider();
    await assert.rejects(() => provider.getOptionsChain('SPY'), /Verified options-chain data/);
  });

  it('AppConfig.allowSimulatedMarketData is disabled by default in production', () => {
    // In standard production build environment, simulated market data fails closed
    if (AppConfig.isProduction) {
      assert.strictEqual(AppConfig.allowSimulatedMarketData, false);
      assert.strictEqual(AppConfig.isDemoMode, false);
    }
  });
});
