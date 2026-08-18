/**
 * MarketMind AI - Institutional Copilot & Intelligence Engine Test Suite
 * Validates deterministic risk calculation, zero fabrication, intent classification,
 * model identification, conversation memory, and fail-closed error handling.
 */

import assert from 'node:assert/strict';
import test, { describe, beforeEach } from 'node:test';
import { InstitutionalCopilotService, getGeminiModel } from '../src/services/ai/institutionalCopilotService';
import { PortfolioRiskEngine } from '../src/services/ai/portfolioRiskEngine';
import { MarketRegimeEngine } from '../src/services/ai/marketRegimeEngine';
import { IntentRouter } from '../src/services/ai/intentRouter';
import { ConversationMemoryManager } from '../src/services/ai/conversationMemory';
import { HoldingPosition } from '../src/types/portfolio';

describe('Institutional Copilot & Intelligence Engine', () => {
  beforeEach(() => {
    InstitutionalCopilotService.setAiClientForTests(null);
  });

  test('1. Model Identification - reports configured model or defaults to gemini-2.5-flash', () => {
    const model = getGeminiModel();
    assert.ok(typeof model === 'string');
    assert.ok(model.length > 0);
    assert.equal(model, process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  });

  test('2. Intent Classifier & Router - Ticker Analysis', () => {
    const res = IntentRouter.classify('What is the outlook on NVDA?');
    assert.equal(res.intent, 'TICKER_ANALYSIS');
    assert.equal(res.primarySymbol, 'NVDA');
  });

  test('2. Intent Classifier & Router - Why Moving', () => {
    const res = IntentRouter.classify('Why is AAPL moving down today?');
    assert.equal(res.intent, 'WHY_MOVING');
    assert.equal(res.primarySymbol, 'AAPL');
    assert.equal(res.requiresMacro, true);
  });

  test('2. Intent Classifier & Router - Portfolio Risk', () => {
    const res = IntentRouter.classify('What is my biggest portfolio risk and exposure?');
    assert.equal(res.intent, 'PORTFOLIO_RISK');
    assert.equal(res.requiresPortfolio, true);
  });

  test('2. Intent Classifier & Router - Watchlist Analysis', () => {
    const res = IntentRouter.classify('Which stock on my watchlist has the strongest momentum?');
    assert.equal(res.intent, 'WATCHLIST_ANALYSIS');
    assert.equal(res.requiresWatchlist, true);
  });

  test('2. Intent Classifier & Router - Cross Asset Comparison', () => {
    const res = IntentRouter.classify('Compare NVDA vs AMD momentum');
    assert.equal(res.intent, 'CROSS_ASSET_COMPARISON');
    assert.ok(res.comparisonSymbols?.includes('NVDA'));
    assert.ok(res.comparisonSymbols?.includes('AMD'));
  });

  test('2. Intent Classifier & Router - Macro Calendar', () => {
    const res = IntentRouter.classify('When is the next CPI release and what did the last FOMC say?');
    assert.equal(res.intent, 'MACRO_CALENDAR');
    assert.equal(res.requiresMacro, true);
  });

  test('3. Deterministic Portfolio Risk Engine - Concentration & Allocation', () => {
    const mockHoldings: HoldingPosition[] = [
      {
        id: 'h1',
        accountId: 'acc1',
        symbol: 'NVDA',
        companyName: 'NVIDIA Corporation',
        assetClass: 'EQUITY',
        quantity: 100,
        averageCost: 100,
        currentPrice: 150,
        marketValue: 15000,
        costBasis: 10000,
        dailyChangeDollar: 300,
        dailyChangePercent: 2.04,
        unrealizedGainDollar: 5000,
        unrealizedGainPercent: 50,
        portfolioWeight: 0.6,
        marketMindScore: 85,
        riskRating: 'HIGH',
        sector: 'Technology',
        beta: 1.65,
      },
      {
        id: 'h2',
        accountId: 'acc1',
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        assetClass: 'EQUITY',
        quantity: 50,
        averageCost: 150,
        currentPrice: 200,
        marketValue: 10000,
        costBasis: 7500,
        dailyChangeDollar: 100,
        dailyChangePercent: 1.01,
        unrealizedGainDollar: 2500,
        unrealizedGainPercent: 33.33,
        portfolioWeight: 0.4,
        marketMindScore: 78,
        riskRating: 'MEDIUM',
        sector: 'Technology',
        beta: 1.1,
      },
    ];

    const risk = PortfolioRiskEngine.computeRiskMetrics(mockHoldings, 5000);
    assert.equal(risk.totalPortfolioValue, 30000);
    assert.equal(risk.totalCostBasis, 17500);
    assert.equal(risk.totalUnrealizedPnl, 7500);
    assert.equal(risk.largestPosition?.symbol, 'NVDA');
    assert.equal(risk.largestPosition?.weightPercent, 50);
    assert.equal(risk.sectorAllocations[0].sector, 'Technology');
    assert.equal(risk.sectorAllocations[0].weightPercent, Number(((25000 / 30000) * 100).toFixed(2)));
    assert.ok(Math.abs((risk.weightedBeta || 0) - 1.43) < 0.1);
    assert.equal(risk.riskLevel, 'HIGH');
    assert.ok(risk.identifiedRiskFactors.some((f) => f.includes('concentration')));
  });

  test('3. Deterministic Portfolio Risk Engine - Empty Portfolio Safeguard', () => {
    const risk = PortfolioRiskEngine.computeRiskMetrics([], 1000);
    assert.equal(risk.totalPortfolioValue, 1000);
    assert.equal(risk.holdingsCount, 0);
    assert.equal(risk.largestPosition, null);
    assert.equal(risk.cashAllocationPercent, 100);
    assert.equal(risk.riskLevel, 'LOW');
  });

  test('4. Deterministic Market Regime Engine - High Volatility', () => {
    const regime = MarketRegimeEngine.evaluateRegime({ vix: 28.5 });
    assert.equal(regime.regime, 'HIGH_VOLATILITY_COMPRESSION');
    assert.equal(regime.vixState, 'ELEVATED');
  });

  test('4. Deterministic Market Regime Engine - Risk-On Expansion', () => {
    const regime = MarketRegimeEngine.evaluateRegime({
      spyChangePercent: 1.2,
      qqqChangePercent: 1.6,
      vix: 13.5,
      advancersCount: 2200,
      declinersCount: 800,
    });
    assert.equal(regime.regime, 'RISK_ON_EXPANSION');
    assert.equal(regime.vixState, 'COMPRESSED');
  });

  test('4. Deterministic Market Regime Engine - Risk-Off Defensive', () => {
    const regime = MarketRegimeEngine.evaluateRegime({
      spyChangePercent: -1.5,
      qqqChangePercent: -2.1,
      vix: 22.0,
    });
    assert.equal(regime.regime, 'RISK_OFF_DEFENSIVE');
  });

  test('5. Conversational Memory - Bounded History Retention', () => {
    const sessionId = 'test_session_1';
    ConversationMemoryManager.clearSession(sessionId);

    ConversationMemoryManager.recordTurn(sessionId, 'user', 'Analyze NVDA', { focusedSymbol: 'NVDA' });
    ConversationMemoryManager.recordTurn(sessionId, 'assistant', 'NVDA is trading at $150 above VWAP.', { focusedSymbol: 'NVDA' });

    const history = ConversationMemoryManager.getFormattedHistory(sessionId);
    assert.equal(history.length, 2);
    assert.equal(history[0].role, 'user');
    assert.equal(history[1].role, 'model');
  });

  test('5. Conversational Memory - Fresh Data Priority Over Stale Memory', async () => {
    const sessionId = 'test_session_stale_override';
    ConversationMemoryManager.clearSession(sessionId);

    ConversationMemoryManager.recordTurn(sessionId, 'user', 'Analyze SPY at $500');
    ConversationMemoryManager.recordTurn(sessionId, 'assistant', 'SPY is at $500.');

    // Query with NEW live price $560.25
    const res = await InstitutionalCopilotService.askCopilot({
      query: 'What about the upside now?',
      sessionId,
      activeSymbol: 'SPY',
      rawMarketData: {
        quote: { symbol: 'SPY', price: 560.25, change: 4.5, changePercent: 0.81 },
        technicals: { vwap: 558.1, r1: 565.0, s1: 555.0 },
      },
    });

    assert.ok(res.observedFacts.some((f) => f.includes('560.25')));
    assert.equal(res.status, 'VERIFIED');
  });

  test('6. Zero Fabrication - Missing Market Data Fails Closed', async () => {
    const res = await InstitutionalCopilotService.askCopilot({
      query: 'Analyze XYZ',
      activeSymbol: 'XYZ',
      rawMarketData: null,
    });

    assert.equal(res.status, 'UNAVAILABLE');
    assert.ok(res.answer.toLowerCase().includes('unavailable'));
  });

  test('6. Zero Fabrication - Missing Portfolio Returns Safe Cash Baseline', async () => {
    const res = await InstitutionalCopilotService.askCopilot({
      query: 'What is my portfolio risk?',
      holdings: [],
    });

    assert.equal(res.portfolioRiskSummary?.riskLevel, 'LOW');
    assert.ok(res.answer.toLowerCase().includes('cash') || res.answer.toLowerCase().includes('portfolio'));
  });
});
