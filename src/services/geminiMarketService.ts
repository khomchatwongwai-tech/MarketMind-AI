import { GoogleGenAI } from '@google/genai';
import { getLanguageInstruction } from './aiLanguageHelper.js';
import {
  buildValidatedDataManifest,
  getStrictGuardrailInstruction,
  AIExplanationProvenance,
  ValidatedDataManifest,
} from '../utils/validatedDataManifest.js';

export interface MarketAnalysisResponse {
  bias: 'bullish' | 'bearish' | 'neutral';
  confidenceExplanation: string;
  summary: string;
  bullishFactors: string[];
  bearishFactors: string[];
  support: string[];
  resistance: string[];
  confirmation: string;
  invalidation: string;
  risk: 'low' | 'moderate' | 'high' | 'extreme';
  watchNext: string;
  timestamp: string;
  source: string;
  status?: 'VERIFIED' | 'UNAVAILABLE';
  provenance?: AIExplanationProvenance;
}

export interface WhyMovingResponse {
  headline: string;
  summary: string;
  drivers: Array<{
    category: string;
    impact: 'Bullish' | 'Bearish' | 'Neutral';
    explanation: string;
  }>;
  keyLevels: {
    support: string;
    resistance: string;
    vwap: string;
  };
  timestamp: string;
  source: string;
  status?: 'VERIFIED' | 'UNAVAILABLE';
  provenance?: AIExplanationProvenance;
}

export interface AskAiResponse {
  answer: string;
  timestamp: string;
  source: string;
  status?: 'VERIFIED' | 'UNAVAILABLE';
  structuredAnalysis?: MarketAnalysisResponse | null;
  whyMoving?: WhyMovingResponse | null;
  provenance?: AIExplanationProvenance;
}

// In-memory Short-TTL cache for cost control and rapid click debouncing
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const aiResponseCache = new Map<string, CacheEntry>();

function getFromCache(key: string): any | null {
  const entry = aiResponseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    aiResponseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setInCache(key: string, data: any, ttlMs: number = 20000) {
  aiResponseCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Builds clean, structured, non-fabricated market context from the app's real-time data
 */
export function buildStructuredMarketContext(data: any, tickerFallback: string = 'SPY', timeframe: string = '5m') {
  if (!data) {
    return {
      status: 'UNAVAILABLE',
      message: 'Current market data is unavailable.',
      ticker: tickerFallback,
      currentPrice: null,
      currentPriceStatus: 'UNAVAILABLE',
    };
  }

  const quote = data.quote || {};
  const technicals = data.technicals || {};
  const supportResistance = data.supportResistance || {};
  const probabilities = data.probabilities || {};

  const ticker = quote.ticker || tickerFallback;
  const currentPrice = quote.price != null ? Number(quote.price.toFixed(2)) : null;
  const currentPriceStatus = currentPrice !== null ? 'VERIFIED' : 'UNAVAILABLE';
  const dollarChange = quote.change != null ? Number(quote.change.toFixed(2)) : null;
  const percentChange = quote.changePercent != null ? Number(quote.changePercent.toFixed(2)) : null;

  // Key levels
  const vwap = technicals.vwap != null ? Number(technicals.vwap.toFixed(2)) : null;
  const r1 = supportResistance.r1 != null ? Number(supportResistance.r1.toFixed(2)) : null;
  const s1 = supportResistance.s1 != null ? Number(supportResistance.s1.toFixed(2)) : null;

  const timestampET =
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York',
    }) + ' ET';

  return {
    ticker,
    companyName: quote.name || `${ticker} Security`,
    currentPrice,
    currentPriceStatus,
    dollarChange,
    percentChange,
    previousClose: quote.previousClose != null ? Number(quote.previousClose.toFixed(2)) : null,
    dayHigh: quote.dayHigh != null ? Number(quote.dayHigh.toFixed(2)) : null,
    dayLow: quote.dayLow != null ? Number(quote.dayLow.toFixed(2)) : null,
    indicators: {
      vwap,
      vwapStatus: vwap !== null ? 'VERIFIED' : 'UNAVAILABLE',
      ema9: technicals.ema9 != null ? Number(technicals.ema9.toFixed(2)) : null,
      ema20: technicals.ema20 != null ? Number(technicals.ema20.toFixed(2)) : null,
      ema50: technicals.ema50 != null ? Number(technicals.ema50.toFixed(2)) : null,
      rsi: technicals.rsi14 != null ? Number(technicals.rsi14.toFixed(2)) : null,
    },
    supportResistance: {
      r1,
      s1,
    },
    probabilities: {
      bullish: probabilities.bullish ?? null,
      bearish: probabilities.bearish ?? null,
      directionalBias: probabilities.bias ?? null,
      primaryDriver: probabilities.primaryDriver ?? null,
      riskLevel: probabilities.riskLevel ?? 'MODERATE RISK',
    },
    timestampET,
  };
}

/**
 * Returns Gemini System Prompt for standard operations
 */
export function getGeminiSystemInstruction(mode: 'beginner' | 'advanced' = 'advanced'): string {
  const modeGuidance =
    mode === 'beginner'
      ? `EXPLANATION STYLE (BEGINNER MODE):
- Use plain, intuitive, professional financial English.
- Avoid overly dense quant jargon without quick 1-sentence explanations.
- Explain WHY price moved in terms of buyers, sellers, catalyst supply, and key levels.`
      : `EXPLANATION STYLE (ADVANCED MODE):
- Use precise quantitative and technical terminology (e.g. VWAP adherence, EMA stack, order block, liquidity gap, delta).
- Be direct, concise, and structured.`;

  return `You are MarketMind AI, an elite institutional market research engine.

STRICT CONSTRAINTS:
1. ONLY utilize verified quantitative market data explicitly provided in the prompt.
2. DO NOT fabricate or NEVER invent market prices, levels, volume numbers, news headlines, or economic data.
3. If an indicator or metric is missing, unverified, or unavailable (or if Current market data is unavailable), state clearly that it is unavailable.
4. Gemini may explain verified information and distinguish facts from interpretation. Gemini must not substitute missing facts.
5. Do NOT claim certainty about future market movement. Always use probabilistic language.

${modeGuidance}`;
}

/**
 * Executes Ask MarketMind AI chat query
 */
export async function executeAskMarketMind({
  question,
  ticker = 'SPY',
  mode = 'advanced',
  language = 'en',
  conversationHistory = [],
  marketData,
  aiClient = null,
}: {
  question: string;
  ticker?: string;
  mode?: 'beginner' | 'advanced';
  language?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  marketData: any;
  aiClient?: GoogleGenAI | null;
}): Promise<AskAiResponse> {
  const cleanQuestion = (question || '').trim().slice(0, 500);
  if (!cleanQuestion) {
    return {
      answer: 'Please enter a question about the market.',
      timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
      source: 'MarketMind Assistant',
    };
  }

  // 1. Build Validated Data Manifest
  const manifest = buildValidatedDataManifest(marketData, ticker);
  const timestamp = manifest.timestampET;

  // 2. Check Sufficiency Guardrail
  if (!manifest.isSufficient) {
    return {
      answer: `MARKET_DATA_UNAVAILABLE: Verified current market data for ${ticker} is unavailable. Insufficient verified market data to explain the move with confidence.`,
      timestamp,
      source: 'MarketMind Data Guard',
      status: 'UNAVAILABLE',
      provenance: {
        status: 'INSUFFICIENT_DATA',
        fieldsUsed: [],
        sourcesUsed: [],
        generatedAt: new Date().toISOString(),
        confidence: 0,
        omittedFields: manifest.omittedFields,
      },
    };
  }

  const cacheKey = `ask_${ticker}_${mode}_${language}_${cleanQuestion.toLowerCase()}_${manifest.fields.currentPrice?.value}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const cp = manifest.fields.currentPrice?.value as number;
  const vwapObj = manifest.fields.vwap;
  const r1Obj = manifest.fields.support_r1;
  const s1Obj = manifest.fields.support_s1;
  const probObj = manifest.fields.directionalBias;

  // 3. Fallback when AI client is null
  if (!aiClient) {
    const q = cleanQuestion.toLowerCase();
    let fallbackText = '';

    if (q.includes('why') && (q.includes('move') || q.includes('dropping') || q.includes('rising') || q.includes('up') || q.includes('down'))) {
      if (vwapObj?.available) {
        const isAboveVwap = cp >= (vwapObj.value as number);
        fallbackText = `${ticker} ($${cp}) is trading ${isAboveVwap ? 'above' : 'below'} session VWAP ($${vwapObj.value})${probObj?.available ? ` with ${probObj.value} bias` : ''}. ${r1Obj?.available ? `Overhead resistance sits at $${r1Obj.value}.` : ''} ${s1Obj?.available ? `Support holds at $${s1Obj.value}.` : ''}`;
      } else {
        fallbackText = `${ticker} ($${cp}) is trading at verified market price $${cp}${probObj?.available ? ` with ${probObj.value} bias` : ''}. ${r1Obj?.available ? `Overhead resistance sits at $${r1Obj.value}.` : ''} ${s1Obj?.available ? `Support holds at $${s1Obj.value}.` : ''}`;
      }
    } else if (q.includes('support') || q.includes('resistance') || q.includes('level')) {
      fallbackText = `Key verified levels for **${ticker}**:\n- **Primary Resistance (R1)**: ${r1Obj?.available ? `$${r1Obj.value}` : 'Unavailable'}\n- **Intraday VWAP**: ${vwapObj?.available ? `$${vwapObj.value}` : 'Unavailable'}\n- **Primary Support (S1)**: ${s1Obj?.available ? `$${s1Obj.value}` : 'Unavailable'}`;
    } else if (q.includes('vwap')) {
      fallbackText = vwapObj?.available
        ? `**${ticker}** is currently trading **${cp >= (vwapObj.value as number) ? 'ABOVE' : 'BELOW'} VWAP** ($${vwapObj.value}) at **$${cp}**.`
        : `Verified VWAP data for **${ticker}** is currently unavailable.`;
    } else {
      fallbackText = `Market summary for **${ticker}**: Currently at **$${cp}**. ${probObj?.available ? `Calculated bias is ${probObj.value}.` : ''}`;
    }

    const responsePayload: AskAiResponse = {
      answer: fallbackText.trim(),
      timestamp,
      source: 'MarketMind Quantitative Verified Facts',
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };
    setInCache(cacheKey, responsePayload, 15000);
    return responsePayload;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const guardrailInstruction = getStrictGuardrailInstruction(manifest);
    const langInstruction = `\n${getLanguageInstruction(language)}`;

    const recentHistoryText = (conversationHistory || [])
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${systemInstruction}
${guardrailInstruction}${langInstruction}

RECENT CONVERSATION HISTORY:
${recentHistoryText || 'No prior messages in this session.'}

USER QUESTION: "${cleanQuestion}"

INSTRUCTIONS FOR ANSWERING:
1. Address the question directly and concisely.
2. Bold specific verified price levels ($${cp}) present in the manifest.
3. If an indicator is in EXCLUDED list, DO NOT mention or infer it.
4. State confirmation and invalidation triggers clearly based strictly on available metrics.`;

    const response = await aiClient.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
    });

    const resultText = response.text || 'AI ANALYSIS TEMPORARILY UNAVAILABLE';
    const payload: AskAiResponse = {
      answer: resultText,
      timestamp,
      source: `MarketMind Intelligence (${getGeminiModel()}) [${mode === 'beginner' ? 'Beginner' : 'Advanced'}]`,
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };

    setInCache(cacheKey, payload, 20000);
    return payload;
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.log('[GeminiMarketService] AI query error:', errMsg.slice(0, 100));
    return {
      answer: `MarketMind analysis for ${ticker}: Current verified price is $${cp}.${vwapObj?.available ? ` Session VWAP is $${vwapObj.value}.` : ''}`,
      timestamp,
      source: `MarketMind Verified Data (${getGeminiModel()})`,
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };
  }
}

/**
 * Executes structured "ASK GEMINI TO ANALYZE"
 */
export async function executeAnalyzeMarket({
  ticker = 'SPY',
  mode = 'advanced',
  timeframe = '5m',
  language = 'en',
  marketData,
  aiClient = null,
}: {
  ticker?: string;
  mode?: 'beginner' | 'advanced';
  timeframe?: string;
  language?: string;
  marketData: any;
  aiClient?: GoogleGenAI | null;
}): Promise<MarketAnalysisResponse> {
  const manifest = buildValidatedDataManifest(marketData, ticker);
  const timestamp = manifest.timestampET;

  if (!manifest.isSufficient) {
    return {
      bias: 'neutral',
      confidenceExplanation: 'Verified market price is unavailable.',
      summary: `MARKET_DATA_UNAVAILABLE: Verified market analysis for ${ticker} is currently unavailable due to missing real-time quote data. Insufficient verified market data to explain the move with confidence.`,
      bullishFactors: [],
      bearishFactors: [],
      support: [],
      resistance: [],
      confirmation: 'Unavailable',
      invalidation: 'Unavailable',
      risk: 'moderate',
      watchNext: 'Awaiting verified market data feed.',
      timestamp,
      source: 'MarketMind Data Guard',
      status: 'UNAVAILABLE',
      provenance: {
        status: 'INSUFFICIENT_DATA',
        fieldsUsed: [],
        sourcesUsed: [],
        generatedAt: new Date().toISOString(),
        confidence: 0,
        omittedFields: manifest.omittedFields,
      },
    };
  }

  const cp = manifest.fields.currentPrice?.value as number;
  const vwapObj = manifest.fields.vwap;
  const r1Obj = manifest.fields.support_r1;
  const s1Obj = manifest.fields.support_s1;
  const ema9Obj = manifest.fields.ema9;

  const cacheKey = `analyze_${ticker}_${mode}_${timeframe}_${language}_${cp}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (!aiClient) {
    const fallback: MarketAnalysisResponse = {
      bias: 'neutral',
      confidenceExplanation: `Calculated probability based on verified price and indicator alignment.`,
      summary: `${ticker} is trading at verified price $${cp}${vwapObj?.available ? `, holding ${cp >= (vwapObj.value as number) ? 'above' : 'below'} intraday VWAP ($${vwapObj.value})` : ''}.`,
      bullishFactors: [
        vwapObj?.available && cp >= (vwapObj.value as number)
          ? `Price ($${cp}) is trading above intraday VWAP ($${vwapObj.value}).`
          : `Current verified price is $${cp}.`,
        ema9Obj?.available ? `Short-term 9 EMA is $${ema9Obj.value}.` : 'Verified price action active.',
      ],
      bearishFactors: [
        r1Obj?.available ? `Overhead resistance near R1 ($${r1Obj.value}).` : 'Resistance levels monitored.',
        s1Obj?.available ? `Downside support zone at S1 ($${s1Obj.value}).` : 'Support levels monitored.',
      ],
      support: s1Obj?.available ? [`S1: $${s1Obj.value}`] : [],
      resistance: r1Obj?.available ? [`R1: $${r1Obj.value}`] : [],
      confirmation: r1Obj?.available ? `Sustained breakout above $${r1Obj.value}.` : 'Volume confirmation on breakout.',
      invalidation: s1Obj?.available ? `Decisive breakdown below $${s1Obj.value}.` : 'Breakdown below support.',
      risk: 'moderate',
      watchNext: `Monitor price action around key verified levels.`,
      timestamp,
      source: 'MarketMind Verified Quantitative Baseline',
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };
    setInCache(cacheKey, fallback, 15000);
    return fallback;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const guardrailInstruction = getStrictGuardrailInstruction(manifest);
    const langDirective = `\n${getLanguageInstruction(language)}`;

    const prompt = `${systemInstruction}
${guardrailInstruction}${langDirective}

Perform an institutional market analysis for ${ticker}.

Return a strict JSON object matching this schema:
{
  "bias": "bullish" | "bearish" | "neutral",
  "confidenceExplanation": "1-2 sentences explaining the conviction based strictly on available metrics",
  "summary": "2-3 sentences summarizing market setup without fabricating omitted values",
  "bullishFactors": ["Factor 1 with verified numbers"],
  "bearishFactors": ["Risk Factor 1 with verified numbers"],
  "support": ["Support level or empty array"],
  "resistance": ["Resistance level or empty array"],
  "confirmation": "Exact condition and price level needed to confirm",
  "invalidation": "Exact condition and breakdown level that invalidates",
  "risk": "low" | "moderate" | "high" | "extreme",
  "watchNext": "Single most important catalyst or level"
}`;

    const response = await aiClient.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const result: MarketAnalysisResponse = {
      bias: ['bullish', 'bearish', 'neutral'].includes(parsed.bias) ? parsed.bias : 'neutral',
      confidenceExplanation: parsed.confidenceExplanation || `Verified quantitative confidence (${manifest.overallConfidence}%).`,
      summary: parsed.summary || `${ticker} is trading around key verified levels.`,
      bullishFactors: Array.isArray(parsed.bullishFactors) ? parsed.bullishFactors : [`Price at $${cp}`],
      bearishFactors: Array.isArray(parsed.bearishFactors) ? parsed.bearishFactors : [],
      support: Array.isArray(parsed.support) ? parsed.support : (s1Obj?.available ? [`S1: $${s1Obj.value}`] : []),
      resistance: Array.isArray(parsed.resistance) ? parsed.resistance : (r1Obj?.available ? [`R1: $${r1Obj.value}`] : []),
      confirmation: parsed.confirmation || (r1Obj?.available ? `Breakout above $${r1Obj.value}.` : 'Volume confirmation.'),
      invalidation: parsed.invalidation || (s1Obj?.available ? `Breakdown below $${s1Obj.value}.` : 'Break below support.'),
      risk: ['low', 'moderate', 'high', 'extreme'].includes(parsed.risk) ? parsed.risk : 'moderate',
      watchNext: parsed.watchNext || `Monitor price action around verified levels.`,
      timestamp,
      source: `MarketMind Institutional Analysis (${getGeminiModel()}) [${mode === 'beginner' ? 'Beginner' : 'Advanced'}]`,
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };

    setInCache(cacheKey, result, 20000);
    return result;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log('[GeminiMarketService] Gemini analysis error:', errMsg.slice(0, 100));
    return {
      bias: 'neutral',
      confidenceExplanation: 'Verified quantitative calculation.',
      summary: `${ticker} is trading at $${cp}.${s1Obj?.available ? ` Support holds at $${s1Obj.value}.` : ''}${r1Obj?.available ? ` Resistance at $${r1Obj.value}.` : ''}`,
      bullishFactors: vwapObj?.available ? [`Price is near session VWAP ($${vwapObj.value})`] : [`Current price is $${cp}`],
      bearishFactors: r1Obj?.available ? [`Supply at overhead resistance $${r1Obj.value}`] : [],
      support: s1Obj?.available ? [`$${s1Obj.value}`] : [],
      resistance: r1Obj?.available ? [`$${r1Obj.value}`] : [],
      confirmation: r1Obj?.available ? `Break above $${r1Obj.value}` : 'Volume confirmation',
      invalidation: s1Obj?.available ? `Break below $${s1Obj.value}` : 'Break below support',
      risk: 'moderate',
      watchNext: `Monitor verified support and resistance levels.`,
      timestamp,
      source: 'MarketMind Verified Engine',
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };
  }
}

/**
 * Executes special "Why Is It Moving?" feature
 */
export async function executeWhyIsItMoving({
  ticker = 'SPY',
  mode = 'advanced',
  language = 'en',
  marketData,
  aiClient = null,
}: {
  ticker?: string;
  mode?: 'beginner' | 'advanced';
  language?: string;
  marketData: any;
  aiClient?: GoogleGenAI | null;
}): Promise<WhyMovingResponse> {
  const manifest = buildValidatedDataManifest(marketData, ticker);
  const timestamp = manifest.timestampET;

  if (!manifest.isSufficient) {
    return {
      headline: `${ticker} Market Movement Analysis`,
      summary: `MARKET_DATA_UNAVAILABLE: Verified market price and driver information for ${ticker} is currently unavailable. Insufficient verified market data to explain the move with confidence.`,
      drivers: [],
      keyLevels: {
        support: 'Unavailable',
        resistance: 'Unavailable',
        vwap: 'Unavailable',
      },
      timestamp,
      source: 'MarketMind Data Guard',
      status: 'UNAVAILABLE',
      provenance: {
        status: 'INSUFFICIENT_DATA',
        fieldsUsed: [],
        sourcesUsed: [],
        generatedAt: new Date().toISOString(),
        confidence: 0,
        omittedFields: manifest.omittedFields,
      },
    };
  }

  const cp = manifest.fields.currentPrice?.value as number;
  const dollarChange = manifest.fields.dollarChange?.value as number | undefined;
  const vwapObj = manifest.fields.vwap;
  const r1Obj = manifest.fields.support_r1;
  const s1Obj = manifest.fields.support_s1;

  const cacheKey = `why_${ticker}_${mode}_${language}_${cp}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  if (!aiClient) {
    const driversList = [];
    if (vwapObj?.available) {
      const isAboveVwap = cp >= (vwapObj.value as number);
      driversList.push({
        category: 'Price Action & VWAP',
        impact: (isAboveVwap ? 'Bullish' : 'Bearish') as 'Bullish' | 'Bearish' | 'Neutral',
        explanation: `Price ($${cp}) is trading ${isAboveVwap ? 'above' : 'below'} session VWAP ($${vwapObj.value}).`,
      });
    } else {
      driversList.push({
        category: 'Price Action',
        impact: 'Neutral' as const,
        explanation: `Current verified price is $${cp}${dollarChange != null ? ` (${dollarChange >= 0 ? '+' : ''}${dollarChange})` : ''}.`,
      });
    }

    const fallback: WhyMovingResponse = {
      headline: `${ticker} ${Number(dollarChange || 0) >= 0 ? 'Advances' : 'Consolidates'} at $${cp}`,
      summary: `${ticker} is trading at $${cp}${dollarChange != null ? ` (${dollarChange >= 0 ? '+' : ''}${dollarChange})` : ''}.`,
      drivers: driversList,
      keyLevels: {
        support: s1Obj?.available ? `$${s1Obj.value}` : 'Unavailable',
        resistance: r1Obj?.available ? `$${r1Obj.value}` : 'Unavailable',
        vwap: vwapObj?.available ? `$${vwapObj.value}` : 'Unavailable',
      },
      timestamp,
      source: 'MarketMind Verified Quantitative Baseline',
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };
    setInCache(cacheKey, fallback, 15000);
    return fallback;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const guardrailInstruction = getStrictGuardrailInstruction(manifest);
    const langDirective = `\n${getLanguageInstruction(language)}`;

    const prompt = `${systemInstruction}
${guardrailInstruction}${langDirective}

Analyze why ${ticker} is moving right now based strictly on the provided verified market data.

Return a strict JSON object matching this schema:
{
  "headline": "A punchy, informative 1-line headline explaining the move based only on verified data",
  "summary": "2-3 sentences summarizing the holistic market picture without inventing facts",
  "drivers": [
    {
      "category": "e.g. Technical Price Action / Macro / Sector Breadth / News",
      "impact": "Bullish" | "Bearish" | "Neutral",
      "explanation": "Clear, direct explanation referencing actual provided data"
    }
  ],
  "keyLevels": {
    "support": "Primary support level or 'Unavailable'",
    "resistance": "Primary resistance level or 'Unavailable'",
    "vwap": "Intraday VWAP price or 'Unavailable'"
  }
}`;

    const response = await aiClient.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const result: WhyMovingResponse = {
      headline: parsed.headline || `Why is ${ticker} moving?`,
      summary: parsed.summary || `${ticker} is trading at $${cp}.`,
      drivers: Array.isArray(parsed.drivers) && parsed.drivers.length > 0 ? parsed.drivers : [
        {
          category: 'Price Action',
          impact: 'Neutral',
          explanation: `Trading at verified price $${cp}.`,
        },
      ],
      keyLevels: {
        support: s1Obj?.available ? `$${s1Obj.value}` : 'Unavailable',
        resistance: r1Obj?.available ? `$${r1Obj.value}` : 'Unavailable',
        vwap: vwapObj?.available ? `$${vwapObj.value}` : 'Unavailable',
      },
      timestamp,
      source: `MarketMind Catalyst Synthesis (${getGeminiModel()}) [${mode === 'beginner' ? 'Beginner' : 'Advanced'}]`,
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };

    setInCache(cacheKey, result, 20000);
    return result;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log('[GeminiMarketService] Why moving error fallback:', errMsg.slice(0, 100));
    return {
      headline: `${ticker} Price Movement Summary`,
      summary: `${ticker} is currently trading at $${cp}.${vwapObj?.available ? ` Session VWAP is $${vwapObj.value}.` : ''}`,
      drivers: [
        {
          category: 'Price Action',
          impact: 'Neutral',
          explanation: `Trading at verified price $${cp}.`,
        },
      ],
      keyLevels: {
        support: s1Obj?.available ? `$${s1Obj.value}` : 'Unavailable',
        resistance: r1Obj?.available ? `$${r1Obj.value}` : 'Unavailable',
        vwap: vwapObj?.available ? `$${vwapObj.value}` : 'Unavailable',
      },
      timestamp,
      source: 'MarketMind Verified Data Guard',
      status: 'VERIFIED',
      provenance: {
        status: 'SUCCESS',
        fieldsUsed: manifest.availableFields,
        sourcesUsed: manifest.sourcesUsed,
        generatedAt: new Date().toISOString(),
        confidence: manifest.overallConfidence,
        omittedFields: manifest.omittedFields,
      },
    };
  }
}
