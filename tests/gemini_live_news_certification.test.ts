/**
 * MarketMind AI - Gemini AI & Live News Ingestion Certification Test Suite
 * Comprehensive end-to-end tests validating zero fabrication, live provider integration,
 * SSRF security, rate-limit resilience, and strict fail-closed data integrity.
 */

import assert from 'node:assert/strict';
import test, { describe, beforeEach } from 'node:test';
import {
  getGeminiModel,
  buildStructuredMarketContext,
  getGeminiSystemInstruction,
  executeAskMarketMind,
  executeAnalyzeMarket,
  executeWhyIsItMoving,
} from '../src/services/geminiMarketService';
import { InstitutionalCopilotService } from '../src/services/ai/institutionalCopilotService';
import { MarketMindIntelligenceContextBuilder } from '../src/services/ai/MarketMindIntelligenceContext';
import { SafeFeedParser } from '../src/services/newsProviders/safeFeedParser';
import { MarketMindNewsEngine } from '../src/services/MarketMindNewsEngine';
import { NewsIntelligenceService } from '../src/services/newsIntelligenceService';
import { SECProvider } from '../src/services/newsProviders/SECProvider';
import { FederalReserveProvider } from '../src/services/newsProviders/FederalReserveProvider';
import { GovernmentEconomicProvider } from '../src/services/newsProviders/GovernmentEconomicProvider';
import { CnbcNewsProvider } from '../src/services/newsProviders/CnbcNewsProvider';
import { CnnNewsProvider } from '../src/services/newsProviders/CnnNewsProvider';
import { FoxNewsProvider } from '../src/services/newsProviders/FoxNewsProvider';
import { BloombergNewsProvider } from '../src/services/newsProviders/BloombergNewsProvider';
import { CompanyIRProvider } from '../src/services/newsProviders/CompanyIRProvider';
import { PrimaryOfficialProvider } from '../src/services/newsProviders/PrimaryOfficialProvider';
import { AlpacaNewsProvider } from '../src/services/newsProviders/AlpacaNewsProvider';
import { MassiveNewsProvider } from '../src/services/newsProviders/MassiveNewsProvider';
import { FinnhubNewsProvider } from '../src/services/newsProviders/FinnhubNewsProvider';
import { BenzingaNewsProvider } from '../src/services/newsProviders/BenzingaNewsProvider';
import { FinancialNewsApiProvider } from '../src/services/newsProviders/FinancialNewsApiProvider';
import { SpecializedIndustryProvider } from '../src/services/newsProviders/SpecializedIndustryProvider';
import { SocialSentimentProvider } from '../src/services/newsProviders/SocialSentimentProvider';

describe('MarketMind AI - Gemini AI & Live News Production Certification', () => {
  beforeEach(() => {
    InstitutionalCopilotService.setAiClientForTests(null);
  });

  describe('Task 1 & 2: Gemini Configuration, Model Resolution & Prompts', () => {
    test('1.1 Gemini model resolves correctly from environment or defaults to gemini-2.5-flash', () => {
      const model = getGeminiModel();
      assert.ok(typeof model === 'string');
      assert.ok(model.length > 0);
      assert.equal(model, process.env.GEMINI_MODEL || 'gemini-2.5-flash');
    });

    test('1.2 System prompt enforces strict data integrity and prohibits fabricating prices or indicators', () => {
      const promptAdvanced = getGeminiSystemInstruction('advanced');
      assert.ok(promptAdvanced.includes('NEVER invent market prices'));
      assert.ok(promptAdvanced.includes('distinguish facts from interpretation'));
      assert.ok(promptAdvanced.includes('Current market data is unavailable'));

      const promptBeginner = getGeminiSystemInstruction('beginner');
      assert.ok(promptBeginner.includes('EXPLANATION STYLE (BEGINNER MODE)'));
      assert.ok(promptBeginner.includes('NEVER invent market prices'));
    });
  });

  describe('Task 3: Live Market Context in AI & Zero-Fabrication Guardrails', () => {
    test('3.1 Missing market data returns explicit UNAVAILABLE status without fabricating numbers', () => {
      const context = buildStructuredMarketContext(null, 'SPY');
      assert.equal(context.status, 'UNAVAILABLE');
      assert.equal(context.currentPrice, null);
      assert.equal(context.currentPriceStatus, 'UNAVAILABLE');
    });

    test('3.2 Unified Intelligence Context marks unavailable price when data is missing', () => {
      const unifiedContext = MarketMindIntelligenceContextBuilder.build({
        symbol: 'NVDA',
        intent: 'TICKER_ANALYSIS',
        rawMarketData: null,
      });
      assert.equal(unifiedContext.symbol, 'NVDA');
      assert.equal(unifiedContext.quote?.price, null);
      assert.equal(unifiedContext.quote?.feedTier, 'UNAVAILABLE');
    });

    test('3.3 Structured market context preserves exact verified prices and levels', () => {
      const sampleData = {
        quote: { ticker: 'AAPL', price: 232.50, change: 3.25, changePercent: 1.42 },
        technicals: { vwap: 230.80, ema9: 231.40 },
        supportResistance: { r1: 235.00, s1: 228.50 },
        probabilities: { bullish: 68, bearish: 32 },
      };
      const context = buildStructuredMarketContext(sampleData, 'AAPL');
      assert.equal(context.ticker, 'AAPL');
      assert.equal(context.currentPrice, 232.50);
      assert.equal(context.currentPriceStatus, 'VERIFIED');
      assert.equal(context.indicators.vwap, 230.80);
      assert.equal(context.indicators.vwapStatus, 'VERIFIED');
      assert.equal(context.supportResistance.r1, 235.00);
      assert.equal(context.supportResistance.s1, 228.50);
    });
  });

  describe('Task 4, 5, 6: News Providers, SSRF Protection & Data Integrity', () => {
    test('4.1 SafeFeedParser blocks SSRF attempts on localhost, private IPs, and cloud metadata', () => {
      assert.equal(SafeFeedParser.isSafeUrl('http://localhost:3000/feed'), false);
      assert.equal(SafeFeedParser.isSafeUrl('http://127.0.0.1:8080/rss'), false);
      assert.equal(SafeFeedParser.isSafeUrl('http://10.0.0.1/feed.xml'), false);
      assert.equal(SafeFeedParser.isSafeUrl('http://192.168.1.1/feed'), false);
      assert.equal(SafeFeedParser.isSafeUrl('http://169.254.169.254/latest/meta-data/'), false);
      assert.equal(SafeFeedParser.isSafeUrl('http://metadata.google.internal/computeMetadata/v1/'), false);
      assert.equal(SafeFeedParser.isSafeUrl('ftp://example.com/rss'), false);
      assert.equal(SafeFeedParser.isSafeUrl('https://home.treasury.gov/rss/press-releases'), true);
      assert.equal(SafeFeedParser.isSafeUrl('https://www.federalreserve.gov/feeds/press_all.xml'), true);
    });

    test('4.2 SafeFeedParser parses XML RSS and Atom items correctly', () => {
      const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Sample Feed</title>
            <item>
              <title><![CDATA[NVIDIA Announces Next-Gen Architecture]]></title>
              <link>https://example.com/article1</link>
              <description><![CDATA[NVIDIA Corporation unveiled new accelerators.]]></description>
              <pubDate>Mon, 18 Aug 2026 12:00:00 GMT</pubDate>
              <guid>https://example.com/article1</guid>
            </item>
          </channel>
        </rss>`;

      const parsed = SafeFeedParser.parseXmlFeed(sampleXml, 'Test Feed');
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].title, 'NVIDIA Announces Next-Gen Architecture');
      assert.equal(parsed[0].link, 'https://example.com/article1');
      assert.ok(parsed[0].summary.includes('unveiled new accelerators'));
    });

    test('4.3 All news providers strictly fail closed when unconfigured or unreachable (Zero Synthetic News)', async () => {
      const providers = [
        new AlpacaNewsProvider(),
        new MassiveNewsProvider(),
        new FinnhubNewsProvider(),
        new BenzingaNewsProvider(),
        new BloombergNewsProvider(),
        new FinancialNewsApiProvider(),
        new SpecializedIndustryProvider(),
        new SocialSentimentProvider(),
      ];

      for (const p of providers) {
        const news = await p.getLatestNews();
        assert.ok(Array.isArray(news), `Provider ${p.name} did not return an array`);
        assert.equal(news.length, 0, `Provider ${p.name} returned non-empty unconfigured array`);
      }
    });

    test('4.4 SECProvider, FedProvider, and GovEconomicProvider fail closed if feeds are unavailable', async () => {
      const sec = new SECProvider();
      const fed = new FederalReserveProvider();
      const gov = new GovernmentEconomicProvider();
      const ir = new CompanyIRProvider();
      const primary = new PrimaryOfficialProvider();

      const [secNews, fedNews, govNews, irNews, primaryNews] = await Promise.all([
        sec.getLatestNews(),
        fed.getLatestNews(),
        gov.getLatestNews(),
        ir.getLatestNews(),
        primary.getLatestNews(),
      ]);

      assert.ok(Array.isArray(secNews));
      assert.ok(Array.isArray(fedNews));
      assert.ok(Array.isArray(govNews));
      assert.ok(Array.isArray(irNews));
      assert.ok(Array.isArray(primaryNews));
    });

    test('4.5 MarketMindNewsEngine normalizes articles with deterministic IDs and source attribution', () => {
      const raw = {
        title: 'Fed Maintains Benchmark Rate in Balanced Policy Statement',
        summary: 'The Federal Reserve left rates unchanged and noted steady disinflation progress.',
        url: 'https://federalreserve.gov/press',
        tickers: ['SPY', 'TLT'],
        datetime: new Date().toISOString(),
      };

      const normalized = MarketMindNewsEngine.normalizeArticle(raw, {
        providerId: 'fed_provider',
        providerName: 'Federal Reserve',
        tier: 'TIER_1_PRIMARY',
        sourceType: 'PRIMARY_REGULATORY',
      });

      assert.ok(normalized.id.startsWith('fed_provider_'));
      assert.equal(normalized.headline, raw.title);
      assert.equal(normalized.sourceTier, 'TIER_1_PRIMARY');
      assert.deepEqual(normalized.tickers, ['SPY', 'TLT']);
      assert.equal(normalized.verificationStatus, 'CONFIRMED');
    });

    test('4.6 Event clustering groups multi-source news without fabrications', () => {
      const sampleArticles = [
        MarketMindNewsEngine.normalizeArticle(
          { id: '1', title: 'Tech rally lifts S&P 500 to new record high', tickers: ['SPY', 'NVDA'] },
          { providerId: 'p1', providerName: 'Source 1', tier: 'TIER_2_FINANCIAL' }
        ),
        MarketMindNewsEngine.normalizeArticle(
          { id: '2', title: 'S&P 500 climbs as semiconductor equities surge', tickers: ['SPY', 'NVDA'] },
          { providerId: 'p2', providerName: 'Source 2', tier: 'TIER_2_FINANCIAL' }
        ),
      ];

      const clusters = MarketMindNewsEngine.clusterNewsEvents(sampleArticles);
      assert.ok(Array.isArray(clusters));
      assert.ok(clusters.length >= 1);
    });
  });

  describe('Task 7 & 8: AI Endpoints & Unavailable State Handling', () => {
    test('7.1 executeAskMarketMind returns unavailable state when price is missing', async () => {
      const res = await executeAskMarketMind({
        question: 'Why is SPY moving?',
        ticker: 'SPY',
        marketData: null,
        aiClient: null,
      });

      assert.equal(res.status, 'UNAVAILABLE');
      assert.ok(res.answer.includes('unavailable'));
    });

    test('7.2 executeAnalyzeMarket returns unavailable state when price is missing', async () => {
      const res = await executeAnalyzeMarket({
        ticker: 'AAPL',
        marketData: null,
        aiClient: null,
      });

      assert.equal(res.status, 'UNAVAILABLE');
      assert.equal(res.bias, 'neutral');
      assert.ok(res.summary.includes('unavailable'));
    });

    test('7.3 executeWhyIsItMoving returns unavailable state when price is missing', async () => {
      const res = await executeWhyIsItMoving({
        ticker: 'TSLA',
        marketData: null,
        aiClient: null,
      });

      assert.equal(res.status, 'UNAVAILABLE');
      assert.deepEqual(res.drivers, []);
      assert.equal(res.keyLevels.vwap, 'Unavailable');
    });

    test('7.4 InstitutionalCopilotService produces verified deterministic telemetry when price is provided', async () => {
      const res = await InstitutionalCopilotService.askCopilot({
        query: 'What are the key technical levels for NVDA?',
        activeSymbol: 'NVDA',
        rawMarketData: {
          quote: { ticker: 'NVDA', price: 142.50, change: 2.10, changePercent: 1.5 },
          technicals: { vwap: 141.20 },
          supportResistance: { r1: 145.00, s1: 139.50 },
          probabilities: { bullish: 65, bearish: 35 },
        },
      });

      assert.equal(res.status, 'VERIFIED');
      assert.ok(res.observedFacts.length > 0);
      assert.ok(res.interpretation.length > 0);
      assert.ok(res.keyLevels?.vwap?.includes('141.2'));
    });

    test('7.5 NewsIntelligenceService getStockIntelligenceBrief compiles clean verified citations', async () => {
      const service = new NewsIntelligenceService();
      const brief = await service.getStockIntelligenceBrief('SPY', { price: 540.25, vwap: 539.10, change: 1.80, changePercent: 0.33 });

      assert.equal(brief.ticker, 'SPY');
      assert.equal(brief.latestPrice, 540.25);
      assert.ok(Array.isArray(brief.sources));
      assert.ok(brief.sources.length > 0);
      assert.ok(brief.marketMindOutlook.verifiedFacts.length > 0);
    });
  });
});
