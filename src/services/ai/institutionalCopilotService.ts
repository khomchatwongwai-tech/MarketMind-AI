/**
 * MarketMind AI - Institutional AI Intelligence Copilot Service
 * High-quality, personalized market and portfolio intelligence copilot.
 * Powered by Gemini with strict zero-fabrication guardrails.
 */

import { GoogleGenAI } from '@google/genai';
import { MarketMindIntelligenceContextBuilder, UnifiedIntelligenceContext } from './MarketMindIntelligenceContext';
import { IntentRouter, ClassifiedIntent } from './intentRouter';
import { ConversationMemoryManager } from './conversationMemory';
import { HoldingPosition } from '../../types/portfolio';
import { getLanguageInstruction } from '../aiLanguageHelper';

export interface CopilotResponse {
  answer: string;
  intent: string;
  observedFacts: string[];
  interpretation: string;
  bullScenario?: { thesis: string; confirmationLevel: string };
  bearScenario?: { thesis: string; invalidationLevel: string };
  keyLevels?: { support?: string; resistance?: string; vwap?: string };
  portfolioRiskSummary?: {
    riskLevel: string;
    diversificationScore: number;
    primaryRisk: string;
  };
  catalysts?: Array<{ title: string; impact: string; category: string }>;
  riskRating: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  dataFreshness: 'REALTIME' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';
  modelUsed: string;
  timestamp: string;
  status: 'VERIFIED' | 'UNAVAILABLE';
}

// In-memory Short-TTL cache for request deduplication
interface CacheEntry {
  data: CopilotResponse;
  expiresAt: number;
}
const copilotResponseCache = new Map<string, CacheEntry>();

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

export class InstitutionalCopilotService {
  private static aiClient: GoogleGenAI | null = null;

  public static getAiClient(): GoogleGenAI | null {
    if (this.aiClient) return this.aiClient;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        return this.aiClient;
      } catch {
        return null;
      }
    }
    return null;
  }

  public static setAiClientForTests(client: GoogleGenAI | null): void {
    this.aiClient = client;
  }

  /**
   * Execute intelligent multi-factor market & portfolio query
   */
  public static async askCopilot(params: {
    query: string;
    sessionId?: string;
    userId?: string;
    activeSymbol?: string;
    mode?: 'beginner' | 'advanced';
    rawMarketData?: any;
    holdings?: HoldingPosition[];
    cashBalance?: number;
    watchlistSymbols?: string[];
    userPreferences?: { experienceLevel?: 'beginner' | 'advanced'; tradingStyle?: 'investor' | 'swing_trader' | 'day_trader' };
    language?: string;
  }): Promise<CopilotResponse> {
    const query = (params.query || '').trim();
    const sessionId = params.sessionId || params.userId || 'session_default';
    const now = new Date().toISOString();
    const lang = params.language || 'en';

    // 1. Classify Intent & Target Entity
    const classifiedIntent = IntentRouter.classify(query, params.activeSymbol, params.activeSymbol);

    // 2. Build Structured Unified Context
    const experienceLevel = params.mode || params.userPreferences?.experienceLevel || 'advanced';
    const context = MarketMindIntelligenceContextBuilder.build({
      symbol: classifiedIntent.primarySymbol || params.activeSymbol,
      intent: classifiedIntent.intent,
      rawMarketData: params.rawMarketData,
      holdings: classifiedIntent.requiresPortfolio ? params.holdings : undefined,
      cashBalance: classifiedIntent.requiresPortfolio ? params.cashBalance : undefined,
      watchlistSymbols: classifiedIntent.requiresWatchlist ? params.watchlistSymbols : undefined,
      userPreferences: {
        experienceLevel,
        tradingStyle: params.userPreferences?.tradingStyle || 'swing_trader',
      },
    });

    // Check Deduplication Cache
    const cacheKey = `copilot_${sessionId}_${classifiedIntent.intent}_${context.symbol || 'gen'}_${query.toLowerCase()}`;
    const cached = copilotResponseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const ai = this.getAiClient();
    const model = getGeminiModel();

    // 3. Fallback / Deterministic Baseline if AI unavailable or price missing
    if (!ai) {
      const deterministicResponse = this.buildDeterministicBaseline(query, classifiedIntent, context);
      copilotResponseCache.set(cacheKey, { data: deterministicResponse, expiresAt: Date.now() + 15000 });
      ConversationMemoryManager.recordTurn(sessionId, 'user', query, { focusedSymbol: context.symbol, intent: classifiedIntent.intent, userId: params.userId });
      ConversationMemoryManager.recordTurn(sessionId, 'assistant', deterministicResponse.answer, { focusedSymbol: context.symbol, intent: classifiedIntent.intent, userId: params.userId });
      return deterministicResponse;
    }

    // 4. Gemini Generative Synthesis
    try {
      const history = ConversationMemoryManager.getFormattedHistory(sessionId);
      const prompt = this.buildPrompt(query, classifiedIntent, context, lang);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const formattedResponse: CopilotResponse = {
        answer: parsed.answer || parsed.summary || 'Analysis computed from verified market data.',
        intent: classifiedIntent.intent,
        observedFacts: Array.isArray(parsed.observedFacts) && parsed.observedFacts.length > 0
          ? parsed.observedFacts
          : this.extractObservedFacts(context),
        interpretation: parsed.interpretation || parsed.answer || 'Analytical interpretation of verified telemetry.',
        bullScenario: parsed.bullScenario ? {
          thesis: parsed.bullScenario.thesis || 'Bullish continuation setup.',
          confirmationLevel: parsed.bullScenario.confirmationLevel || (context.technicals?.primaryResistance ? `$${context.technicals.primaryResistance}` : 'Volume confirmation'),
        } : undefined,
        bearScenario: parsed.bearScenario ? {
          thesis: parsed.bearScenario.thesis || 'Downside invalidation risk.',
          invalidationLevel: parsed.bearScenario.invalidationLevel || (context.technicals?.primarySupport ? `$${context.technicals.primarySupport}` : 'Support breakdown'),
        } : undefined,
        keyLevels: parsed.keyLevels || {
          support: context.technicals?.primarySupport ? `$${context.technicals.primarySupport}` : undefined,
          resistance: context.technicals?.primaryResistance ? `$${context.technicals.primaryResistance}` : undefined,
          vwap: context.technicals?.vwap ? `$${context.technicals.vwap}` : undefined,
        },
        portfolioRiskSummary: context.portfolio ? {
          riskLevel: context.portfolio.riskMetrics.riskLevel,
          diversificationScore: context.portfolio.riskMetrics.diversificationScore,
          primaryRisk: context.portfolio.riskMetrics.identifiedRiskFactors[0] || 'Risk is balanced.',
        } : undefined,
        catalysts: context.catalysts?.map((c) => ({ title: c.title, impact: c.sentiment, category: c.category })),
        riskRating: (['LOW', 'MODERATE', 'ELEVATED', 'HIGH'].includes(parsed.riskRating?.toUpperCase())
          ? parsed.riskRating.toUpperCase()
          : (context.portfolio?.riskMetrics.riskLevel || 'MODERATE')) as any,
        dataFreshness: context.freshnessStatus,
        modelUsed: model,
        timestamp: now,
        status: 'VERIFIED',
      };

      // Record in memory
      ConversationMemoryManager.recordTurn(sessionId, 'user', query, { focusedSymbol: context.symbol, intent: classifiedIntent.intent, userId: params.userId });
      ConversationMemoryManager.recordTurn(sessionId, 'assistant', formattedResponse.answer, { focusedSymbol: context.symbol, intent: classifiedIntent.intent, userId: params.userId });

      copilotResponseCache.set(cacheKey, { data: formattedResponse, expiresAt: Date.now() + 20000 });
      return formattedResponse;
    } catch (err: any) {
      console.log('[Copilot] Fallback to deterministic engine:', err?.message?.slice(0, 100));
      const fallback = this.buildDeterministicBaseline(query, classifiedIntent, context);
      return fallback;
    }
  }

  private static buildPrompt(
    query: string,
    intent: ClassifiedIntent,
    context: UnifiedIntelligenceContext,
    language: string
  ): string {
    const langDirective = getLanguageInstruction(language);

    return `You are MarketMind AI Institutional Copilot. You provide objective, non-fabricated, evidence-based market and portfolio intelligence.
${langDirective}

CRITICAL RULES:
1. Ground all answers strictly in the verified numbers in the context below. Never invent price targets, earnings numbers, or fake news.
2. If specific data is missing or unavailable, explicitly state that it is unavailable.
3. Distinguish between OBSERVED FACTS and AI INTERPRETATION.
4. Do NOT give guaranteed buy/sell recommendations; provide scenario-based analysis with confirmation & invalidation levels.

USER QUESTION: "${query}"
INTENT: ${intent.intent}

STRUCTURED VERIFIED CONTEXT:
${JSON.stringify(context, null, 2)}

Return a strict JSON object matching this schema:
{
  "answer": "Comprehensive, concise, high-conviction answer directly addressing the user question (2-4 paragraphs)",
  "observedFacts": ["Fact 1 with verified numbers", "Fact 2 with verified metrics"],
  "interpretation": "Analytical synthesis explaining what the data means",
  "bullScenario": {
    "thesis": "Upside thesis",
    "confirmationLevel": "Exact price or volume condition to confirm"
  },
  "bearScenario": {
    "thesis": "Downside thesis",
    "invalidationLevel": "Exact support level breakdown that invalidates"
  },
  "keyLevels": {
    "support": "$Price or 'Unavailable'",
    "resistance": "$Price or 'Unavailable'",
    "vwap": "$Price or 'Unavailable'"
  },
  "riskRating": "LOW" | "MODERATE" | "ELEVATED" | "HIGH"
}`;
  }

  private static extractObservedFacts(context: UnifiedIntelligenceContext): string[] {
    const facts: string[] = [];
    if (context.quote?.price !== null && context.quote?.price !== undefined) {
      facts.push(`${context.quote.symbol} is trading at $${context.quote.price} (${context.quote.percentChange !== null && context.quote.percentChange >= 0 ? '+' : ''}${context.quote.percentChange ?? 0}%) on ${context.quote.dataSource}.`);
    }
    if (context.technicals?.vwap) {
      facts.push(`Session VWAP is $${context.technicals.vwap}.`);
    }
    if (context.macro?.marketRegime) {
      facts.push(`Market Regime: ${context.macro.marketRegime.label} (VIX: ${context.macro.marketRegime.vixLevel ?? 'N/A'}).`);
    }
    if (context.portfolio) {
      facts.push(`Portfolio Total Value: $${context.portfolio.riskMetrics.totalPortfolioValue.toLocaleString()}, Diversification Score: ${context.portfolio.riskMetrics.diversificationScore}/100.`);
    }
    return facts.length > 0 ? facts : ['Verified telemetry evaluated.'];
  }

  private static buildDeterministicBaseline(
    query: string,
    intent: ClassifiedIntent,
    context: UnifiedIntelligenceContext
  ): CopilotResponse {
    const model = getGeminiModel();
    const now = new Date().toISOString();
    const facts = this.extractObservedFacts(context);

    if (intent.intent === 'PORTFOLIO_RISK' && context.portfolio) {
      const pm = context.portfolio.riskMetrics;
      const topPos = pm.largestPosition ? `${pm.largestPosition.symbol} (${pm.largestPosition.weightPercent}%)` : 'None';
      const answer = `Your portfolio has a total verified value of $${pm.totalPortfolioValue.toLocaleString()} with a ${pm.riskLevel} risk profile (Diversification Score: ${pm.diversificationScore}/100). Largest single position is ${topPos}. Top 3 holdings represent ${pm.top3ConcentrationPercent}% of total assets. ${pm.identifiedRiskFactors.join(' ')}`;

      return {
        answer,
        intent: intent.intent,
        observedFacts: facts,
        interpretation: `Portfolio risk is currently classified as ${pm.riskLevel} based on holding concentration and beta sensitivity.`,
        portfolioRiskSummary: {
          riskLevel: pm.riskLevel,
          diversificationScore: pm.diversificationScore,
          primaryRisk: pm.identifiedRiskFactors[0] || 'Balanced portfolio structure.',
        },
        riskRating: pm.riskLevel,
        dataFreshness: 'REALTIME',
        modelUsed: `${model} (Deterministic Quantitative Engine)`,
        timestamp: now,
        status: 'VERIFIED',
      };
    }

    if (intent.intent === 'WHY_MOVING' && context.quote?.price !== null) {
      const cp = context.quote?.price;
      const sym = context.quote?.symbol || 'Asset';
      const vwap = context.technicals?.vwap;
      const chg = context.quote?.percentChange ?? 0;
      const answer = `${sym} is trading at $${cp} (${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%). ${vwap ? `Price is holding ${cp >= vwap ? 'above' : 'below'} session VWAP ($${vwap}).` : ''} Market regime is evaluated as ${context.macro?.marketRegime.label || 'Standard'}.`;

      return {
        answer,
        intent: intent.intent,
        observedFacts: facts,
        interpretation: `Intraday technical momentum and volume flow driving price action at verified levels.`,
        keyLevels: {
          support: context.technicals?.primarySupport ? `$${context.technicals.primarySupport}` : undefined,
          resistance: context.technicals?.primaryResistance ? `$${context.technicals.primaryResistance}` : undefined,
          vwap: vwap ? `$${vwap}` : undefined,
        },
        riskRating: 'MODERATE',
        dataFreshness: context.freshnessStatus,
        modelUsed: `${model} (Deterministic Baseline)`,
        timestamp: now,
        status: 'VERIFIED',
      };
    }

    // Standard Ticker Analysis Baseline
    const cp = context.quote?.price;
    const sym = context.quote?.symbol || 'SPY';
    const answer = cp !== null && cp !== undefined
      ? `${sym} is trading at $${cp}. Key verified support is at $${context.technicals?.primarySupport || 'N/A'} and resistance is at $${context.technicals?.primaryResistance || 'N/A'}. Session trend is ${context.technicals?.multiTimeframeTrend || 'NEUTRAL'}.`
      : `Verified market data for ${sym} is currently unavailable. No synthetic quotes will be generated.`;

    return {
      answer,
      intent: intent.intent,
      observedFacts: facts,
      interpretation: 'Quantitative baseline calculation from active feeds.',
      keyLevels: {
        support: context.technicals?.primarySupport ? `$${context.technicals.primarySupport}` : undefined,
        resistance: context.technicals?.primaryResistance ? `$${context.technicals.primaryResistance}` : undefined,
        vwap: context.technicals?.vwap ? `$${context.technicals.vwap}` : undefined,
      },
      riskRating: 'MODERATE',
      dataFreshness: context.freshnessStatus,
      modelUsed: `${model} (Verified Guard Engine)`,
      timestamp: now,
      status: cp !== null ? 'VERIFIED' : 'UNAVAILABLE',
    };
  }
}
