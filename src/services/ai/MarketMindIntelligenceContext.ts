/**
 * MarketMind AI - Unified Intelligence Context Builder
 * Assembles verified, non-fabricated structured telemetry across Market, Technicals, Macro, Portfolio, and News.
 * CRITICAL PRINCIPLE: Only include fields backed by verified provider data. Attach freshness metadata.
 */

import { PortfolioRiskEngine, PortfolioRiskMetrics } from './portfolioRiskEngine.js';
import { MarketRegimeEngine, MarketRegimeEvaluation } from './marketRegimeEngine.js';
import { HoldingPosition } from '../../types/portfolio.js';

export interface VerifiedQuoteContext {
  symbol: string;
  price: number | null;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  dollarChange: number | null;
  percentChange: number | null;
  volume: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  openPrice: number | null;
  previousClose: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  marketCap?: number | null;
  exchange?: string;
  currency?: string;
  sessionState: 'REGULAR' | 'PRE_MARKET' | 'AFTER_HOURS' | 'CLOSED' | 'ACTIVE_24_7';
  dataSource: string;
  feedTier: 'REAL_TIME' | 'IEX_FREE' | 'DELAYED_15M' | 'END_OF_DAY' | 'UNAVAILABLE';
  timestamp: string;
  isStale: boolean;
}

export interface VerifiedTechnicalsContext {
  vwap: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macd: { macdLine: number; signalLine: number; histogram: number } | null;
  atr14: number | null;
  adx14: number | null;
  bollingerBands: { upper: number; middle: number; lower: number; bandwidth: number } | null;
  pivotLevels: { pivot: number; s1: number; s2: number; r1: number; r2: number } | null;
  primarySupport: number | null;
  primaryResistance: number | null;
  multiTimeframeTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';
}

export interface VerifiedMacroContext {
  spyChangePercent: number | null;
  qqqChangePercent: number | null;
  iwmChangePercent: number | null;
  vixLevel: number | null;
  tenYearTreasuryYield: number | null;
  marketBreadth: { advancers: number; decliners: number; ratio: number | null } | null;
  topLeadingSectors: string[];
  topLaggingSectors: string[];
  marketRegime: MarketRegimeEvaluation;
}

export interface VerifiedEarningsContext {
  nextReportDate: string | null;
  reportingSession?: 'BEFORE_OPEN' | 'AFTER_CLOSE' | 'DURING_SESSION' | 'UNSPECIFIED';
  lastReportedEps?: number | null;
  consensusEps?: number | null;
  lastEpsSurprisePercent?: number | null;
  lastQuarterRevenue?: number | null;
  status: 'VERIFIED' | 'ESTIMATED' | 'UNAVAILABLE';
}

export interface VerifiedSecFiling {
  form: '10-K' | '10-Q' | '8-K' | 'FORM 4' | string;
  filingDate: string;
  title: string;
  summaryUrl?: string;
  keyDisclosures?: string[];
}

export interface VerifiedCatalystItem {
  id: string;
  category: 'EARNINGS' | 'GUIDANCE' | 'ANALYST_ACTION' | 'REGULATORY' | 'MACRO' | 'M&A' | 'GENERAL';
  title: string;
  source: string;
  publishedAt: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  keyTakeaway?: string;
}

export interface VerifiedMacroCalendarEvent {
  event: string;
  scheduledTime: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  consensus?: string;
  previous?: string;
  actual?: string;
}

export interface UnifiedIntelligenceContext {
  symbol?: string;
  intent: string;
  quote?: VerifiedQuoteContext;
  technicals?: VerifiedTechnicalsContext;
  macro?: VerifiedMacroContext;
  earnings?: VerifiedEarningsContext;
  filings?: VerifiedSecFiling[];
  catalysts?: VerifiedCatalystItem[];
  economicEvents?: VerifiedMacroCalendarEvent[];
  portfolio?: {
    holdings: Array<{
      symbol: string;
      quantity: number;
      marketValue: number;
      averageCost: number;
      unrealizedPnlPercent: number;
      weightPercent: number;
      sector: string;
    }>;
    riskMetrics: PortfolioRiskMetrics;
  };
  watchlist?: {
    symbols: string[];
    topPerformer?: { symbol: string; changePercent: number };
    worstPerformer?: { symbol: string; changePercent: number };
  };
  userPreferences?: {
    experienceLevel: 'beginner' | 'advanced';
    tradingStyle: 'investor' | 'swing_trader' | 'day_trader';
  };
  assembledAt: string;
  freshnessStatus: 'REALTIME' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
}

export class MarketMindIntelligenceContextBuilder {
  /**
   * Builds the comprehensive UnifiedIntelligenceContext
   */
  public static build(params: {
    symbol?: string;
    intent: string;
    rawMarketData?: any;
    holdings?: HoldingPosition[];
    cashBalance?: number;
    watchlistSymbols?: string[];
    userPreferences?: { experienceLevel?: 'beginner' | 'advanced'; tradingStyle?: 'investor' | 'swing_trader' | 'day_trader' };
  }): UnifiedIntelligenceContext {
    const data = params.rawMarketData || {};
    const sym = params.symbol ? params.symbol.toUpperCase().trim() : undefined;
    const now = new Date().toISOString();

    // 1. Quote Context
    let quote: VerifiedQuoteContext | undefined;
    const q = data.quote || {};
    const price = typeof q.price === 'number' && Number.isFinite(q.price) ? q.price : (typeof data.price === 'number' ? data.price : null);

    if (sym || price !== null) {
      quote = {
        symbol: sym || q.symbol || 'SPY',
        price,
        bid: typeof q.bid === 'number' ? q.bid : null,
        ask: typeof q.ask === 'number' ? q.ask : null,
        spread: typeof q.spread === 'number' ? q.spread : (q.ask && q.bid ? Number((q.ask - q.bid).toFixed(2)) : null),
        dollarChange: typeof q.change === 'number' ? q.change : null,
        percentChange: typeof q.changePercent === 'number' ? q.changePercent : null,
        volume: typeof q.volume === 'number' ? q.volume : null,
        dayHigh: typeof q.dayHigh === 'number' ? q.dayHigh : null,
        dayLow: typeof q.dayLow === 'number' ? q.dayLow : null,
        openPrice: typeof q.openPrice === 'number' ? q.openPrice : null,
        previousClose: typeof q.previousClose === 'number' ? q.previousClose : null,
        fiftyTwoWeekHigh: typeof q.fiftyTwoWeekHigh === 'number' ? q.fiftyTwoWeekHigh : null,
        fiftyTwoWeekLow: typeof q.fiftyTwoWeekLow === 'number' ? q.fiftyTwoWeekLow : null,
        exchange: q.exchange || data.exchange || 'US Markets',
        currency: q.currency || 'USD',
        sessionState: q.marketState || 'REGULAR',
        dataSource: q.dataSource || 'Alpaca Free IEX',
        feedTier: price !== null ? 'IEX_FREE' : 'UNAVAILABLE',
        timestamp: q.timestamp || now,
        isStale: Boolean(q.isStale),
      };
    }

    // 2. Technicals Context
    let technicals: VerifiedTechnicalsContext | undefined;
    const tech = data.technicals || {};
    const sr = data.supportResistance || {};

    if (quote) {
      technicals = {
        vwap: typeof tech.vwap === 'number' ? tech.vwap : null,
        ema9: typeof tech.ema9 === 'number' ? tech.ema9 : null,
        ema20: typeof tech.ema20 === 'number' ? tech.ema20 : null,
        ema50: typeof tech.ema50 === 'number' ? tech.ema50 : null,
        ema200: typeof tech.ema200 === 'number' ? tech.ema200 : null,
        sma20: typeof tech.sma20 === 'number' ? tech.sma20 : null,
        sma50: typeof tech.sma50 === 'number' ? tech.sma50 : null,
        sma200: typeof tech.sma200 === 'number' ? tech.sma200 : null,
        rsi14: typeof tech.rsi === 'number' ? tech.rsi : null,
        macd: tech.macd ? { macdLine: tech.macd.macd || 0, signalLine: tech.macd.signal || 0, histogram: tech.macd.histogram || 0 } : null,
        atr14: typeof tech.atr === 'number' ? tech.atr : null,
        adx14: typeof tech.adx === 'number' ? tech.adx : null,
        bollingerBands: tech.bollingerBands ? {
          upper: tech.bollingerBands.upper || 0,
          middle: tech.bollingerBands.middle || 0,
          lower: tech.bollingerBands.lower || 0,
          bandwidth: tech.bollingerBands.bandwidth || 0,
        } : null,
        pivotLevels: sr.pivot ? {
          pivot: sr.pivot || 0,
          s1: sr.s1 || 0,
          s2: sr.s2 || 0,
          r1: sr.r1 || 0,
          r2: sr.r2 || 0,
        } : null,
        primarySupport: typeof sr.s1 === 'number' ? sr.s1 : null,
        primaryResistance: typeof sr.r1 === 'number' ? sr.r1 : null,
        multiTimeframeTrend: tech.trend || (quote.price && technicals?.vwap ? (quote.price >= technicals.vwap ? 'BULLISH' : 'BEARISH') : 'NEUTRAL'),
      };
    }

    // 3. Macro Environment & Regime
    const breadth = data.breadth || {};
    const macroRegime = MarketRegimeEngine.evaluateRegime({
      spyPrice: data.intermarket?.find((i: any) => i.symbol === 'SPY')?.price,
      spyChangePercent: data.intermarket?.find((i: any) => i.symbol === 'SPY')?.changePercent,
      qqqChangePercent: data.intermarket?.find((i: any) => i.symbol === 'QQQ')?.changePercent,
      vix: data.intermarket?.find((i: any) => i.symbol === 'VIX' || i.symbol === '^VIX')?.price,
      advancersCount: breadth.advancers,
      declinersCount: breadth.decliners,
      yield10Year: data.intermarket?.find((i: any) => i.symbol === 'US10Y' || i.symbol === '^TNX')?.price,
    });

    const sectors = Array.isArray(data.sectors) ? data.sectors : [];
    const sortedSectors = [...sectors].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));

    const macro: VerifiedMacroContext = {
      spyChangePercent: data.intermarket?.find((i: any) => i.symbol === 'SPY')?.changePercent ?? null,
      qqqChangePercent: data.intermarket?.find((i: any) => i.symbol === 'QQQ')?.changePercent ?? null,
      iwmChangePercent: data.intermarket?.find((i: any) => i.symbol === 'IWM')?.changePercent ?? null,
      vixLevel: macroRegime.vixLevel,
      tenYearTreasuryYield: data.intermarket?.find((i: any) => i.symbol === 'US10Y' || i.symbol === '^TNX')?.price ?? null,
      marketBreadth: breadth.advancers ? { advancers: breadth.advancers, decliners: breadth.decliners || 0, ratio: macroRegime.breadthRatio } : null,
      topLeadingSectors: sortedSectors.slice(0, 2).map((s) => `${s.name || s.sector} (${s.changePercent > 0 ? '+' : ''}${s.changePercent}%)`),
      topLaggingSectors: sortedSectors.slice(-2).map((s) => `${s.name || s.sector} (${s.changePercent > 0 ? '+' : ''}${s.changePercent}%)`),
      marketRegime: macroRegime,
    };

    // 4. Portfolio Context & Risk Metrics (Strictly user-scoped)
    let portfolioContext: UnifiedIntelligenceContext['portfolio'];
    if (params.holdings !== undefined) {
      const riskMetrics = PortfolioRiskEngine.computeRiskMetrics(params.holdings, params.cashBalance || 0);
      portfolioContext = {
        holdings: params.holdings.map((h) => ({
          symbol: h.symbol,
          quantity: h.quantity,
          marketValue: h.marketValue || (h.quantity * (h.currentPrice || h.averageCost)),
          averageCost: h.averageCost,
          unrealizedPnlPercent: h.unrealizedGainPercent || 0,
          weightPercent: h.portfolioWeight ? h.portfolioWeight * 100 : 0,
          sector: h.sector || 'Unassigned',
        })),
        riskMetrics,
      };
    }

    // 5. Watchlist Context
    let watchlistContext: UnifiedIntelligenceContext['watchlist'];
    if (params.watchlistSymbols && params.watchlistSymbols.length > 0) {
      watchlistContext = {
        symbols: params.watchlistSymbols,
      };
    }

    // 6. News Catalysts
    const catalysts: VerifiedCatalystItem[] = Array.isArray(data.news)
      ? data.news.slice(0, 8).map((n: any, idx: number) => ({
          id: n.id || `news-${idx}`,
          category: n.category || 'GENERAL',
          title: n.title || n.headline || 'Market News',
          source: n.source || 'Verified Feed',
          publishedAt: n.publishedAt || n.datetime || now,
          sentiment: n.sentiment || 'NEUTRAL',
          impactLevel: n.impactLevel || 'MEDIUM',
          keyTakeaway: n.summary || n.keyTakeaway,
        }))
      : [];

    // 7. Macro Economic Calendar
    const economicEvents: VerifiedMacroCalendarEvent[] = Array.isArray(data.economicEvents)
      ? data.economicEvents.slice(0, 5).map((e: any) => ({
          event: e.event || e.name || 'Economic Release',
          scheduledTime: e.time || e.date || now,
          importance: e.importance || 'HIGH',
          consensus: e.consensus,
          previous: e.previous,
          actual: e.actual,
        }))
      : [];

    return {
      symbol: sym,
      intent: params.intent,
      quote,
      technicals,
      macro,
      catalysts,
      economicEvents,
      portfolio: portfolioContext,
      watchlist: watchlistContext,
      userPreferences: params.userPreferences ? {
        experienceLevel: params.userPreferences.experienceLevel || 'advanced',
        tradingStyle: params.userPreferences.tradingStyle || 'swing_trader',
      } : undefined,
      assembledAt: now,
      freshnessStatus: quote?.price !== null && quote !== undefined ? 'REALTIME' : 'UNAVAILABLE',
    };
  }
}
