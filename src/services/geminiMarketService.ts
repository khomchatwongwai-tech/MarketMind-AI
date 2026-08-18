import { GoogleGenAI } from '@google/genai';
import { getLanguageInstruction } from './aiLanguageHelper';

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
}

export interface AskAiResponse {
  answer: string;
  timestamp: string;
  source: string;
  status?: 'VERIFIED' | 'UNAVAILABLE';
  structuredAnalysis?: MarketAnalysisResponse | null;
  whyMoving?: WhyMovingResponse | null;
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
  const breadth = data.breadth || {};
  const options = data.options || {};
  const sectors = data.sectors || [];
  const economicEvents = data.economicEvents || [];
  const news = data.news || [];
  const intermarket = data.intermarket || [];
  const fed = data.fed || {};
  const trends = data.trends || [];
  const scenarios = data.scenarios || {};

  const ticker = quote.ticker || tickerFallback;
  const currentPrice = quote.price != null ? Number(quote.price.toFixed(2)) : null;
  const currentPriceStatus = currentPrice !== null ? 'VERIFIED' : 'UNAVAILABLE';
  const dollarChange = quote.change != null ? Number(quote.change.toFixed(2)) : null;
  const percentChange = quote.changePercent != null ? Number(quote.changePercent.toFixed(2)) : null;

  // Key levels
  const vwap = technicals.vwap != null ? Number(technicals.vwap.toFixed(2)) : null;
  const vwapStatus = vwap !== null ? 'VERIFIED' : 'UNAVAILABLE';
  const r1 = supportResistance.r1 != null ? Number(supportResistance.r1.toFixed(2)) : null;
  const r2 = supportResistance.r2 != null ? Number(supportResistance.r2.toFixed(2)) : null;
  const r3 = supportResistance.r3 != null ? Number(supportResistance.r3.toFixed(2)) : null;
  const s1 = supportResistance.s1 != null ? Number(supportResistance.s1.toFixed(2)) : null;
  const s2 = supportResistance.s2 != null ? Number(supportResistance.s2.toFixed(2)) : null;
  const s3 = supportResistance.s3 != null ? Number(supportResistance.s3.toFixed(2)) : null;

  const pdh = technicals.prevDayHigh != null ? Number(technicals.prevDayHigh.toFixed(2)) : null;
  const pdl = technicals.prevDayLow != null ? Number(technicals.prevDayLow.toFixed(2)) : null;
  const pdc = technicals.prevDayClose != null ? Number(technicals.prevDayClose.toFixed(2)) : null;
  const pmHigh = technicals.preMarketHigh != null ? Number(technicals.preMarketHigh.toFixed(2)) : null;
  const pmLow = technicals.preMarketLow != null ? Number(technicals.preMarketLow.toFixed(2)) : null;
  const orHigh = technicals.openingRangeHigh != null ? Number(technicals.openingRangeHigh.toFixed(2)) : null;
  const orLow = technicals.openingRangeLow != null ? Number(technicals.openingRangeLow.toFixed(2)) : null;

  // Intermarket assets
  const qqqAsset = intermarket.find((a: any) => a.symbol === 'QQQ');
  const iwmAsset = intermarket.find((a: any) => a.symbol === 'IWM');
  const vixAsset = intermarket.find((a: any) => a.symbol === 'VIX');
  const yield10Y = intermarket.find((a: any) => a.symbol === 'TNX' || a.symbol === 'US10Y');

  // Top/Bottom sectors
  const topSectors = (sectors || [])
    .slice(0, 3)
    .map((s: any) => `${s.symbol} (${s.name}): ${s.changePercent != null ? (s.changePercent >= 0 ? '+' : '') + s.changePercent + '%' : 'N/A'}`);
  const bottomSectors = (sectors || [])
    .slice(-2)
    .map((s: any) => `${s.symbol} (${s.name}): ${s.changePercent != null ? (s.changePercent >= 0 ? '+' : '') + s.changePercent + '%' : 'N/A'}`);

  // Relevant upcoming economic events
  const upcomingEvents = (economicEvents || []).slice(0, 3).map((e: any) => ({
    time: e.time || 'N/A',
    event: e.event || 'N/A',
    consensus: e.consensus ?? null,
    actual: e.actual ?? null,
    importance: e.importance || 'MEDIUM',
    isApproachingHighVol: e.isApproachingHighVol || false,
  }));

  // Recent news
  const recentNews = (news || []).slice(0, 3).map((n: any) => ({
    headline: n.headline,
    sentiment: n.sentiment,
    impactScore: n.impactScore,
    publishedTime: n.publishedTime,
  }));

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
    marketSession: quote.marketStatus || 'REGULAR',
    timestampET,
    selectedTimeframe: timeframe,
    volume: quote.volume ?? null,
    avgVolume: quote.avgVolume ?? null,
    relativeVolume: quote.relativeVolume ?? null,
    indicators: {
      vwap,
      vwapStatus,
      ema9: technicals.ema9 != null ? Number(technicals.ema9.toFixed(2)) : null,
      ema20: technicals.ema20 != null ? Number(technicals.ema20.toFixed(2)) : null,
      ema50: technicals.ema50 != null ? Number(technicals.ema50.toFixed(2)) : null,
      ema200: technicals.ema200 != null ? Number(technicals.ema200.toFixed(2)) : null,
      sma20: technicals.sma20 != null ? Number(technicals.sma20.toFixed(2)) : null,
      sma50: technicals.sma50 != null ? Number(technicals.sma50.toFixed(2)) : null,
      sma200: technicals.sma200 != null ? Number(technicals.sma200.toFixed(2)) : null,
      rsi14: technicals.rsi14 ?? null,
      rsiStatus: technicals.rsiStatus ?? null,
      macd: technicals.macd ?? null,
      macdSignal: technicals.macdSignal ?? null,
      macdHistogram: technicals.macdHistogram ?? null,
      atr14: technicals.atr14 ?? null,
      adx14: technicals.adx ?? null,
      bollingerUpper: technicals.bollingerUpper ?? null,
      bollingerMiddle: technicals.bollingerMiddle ?? null,
      bollingerLower: technicals.bollingerLower ?? null,
    },
    supportResistance: {
      s1,
      s2,
      s3,
      r1,
      r2,
      r3,
      pivot: supportResistance.pivot ?? null,
      previousDayHigh: pdh,
      previousDayLow: pdl,
      previousDayClose: pdc,
      premarketHigh: pmHigh,
      premarketLow: pmLow,
      openingRangeHigh: orHigh,
      openingRangeLow: orLow,
    },
    marketTrend: {
      intradayBias: probabilities.bullish != null && probabilities.bearish != null ? (probabilities.bullish >= probabilities.bearish ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      trendScore: data.trendAlignmentScore ?? null,
      multiTimeframe: trends.map((t: any) => `${t.timeframe}: ${t.trend} (${t.strength}%)`),
    },
    intermarket: {
      qqq: qqqAsset && qqqAsset.changePercent != null ? `${qqqAsset.changePercent >= 0 ? '+' : ''}${qqqAsset.changePercent}%` : null,
      iwm: iwmAsset && iwmAsset.changePercent != null ? `${iwmAsset.changePercent >= 0 ? '+' : ''}${iwmAsset.changePercent}%` : null,
      vix: vixAsset?.price ?? null,
      treasury10Y: yield10Y?.price ?? fed.treasury10Y ?? null,
    },
    sectors: {
      leaders: topSectors,
      laggards: bottomSectors,
    },
    breadth: {
      sp500AdvDecRatio: breadth.sp500AdvDecRatio ?? null,
      pctAbove20SMA: breadth.pctAbove20SMA ?? null,
      pctAbove50SMA: breadth.pctAbove50SMA ?? null,
      pctAbove200SMA: breadth.pctAbove200SMA ?? null,
      breadthStatus: breadth.breadthStatus ?? null,
    },
    optionsFlow: {
      putCallRatio: options.putCallRatio ?? null,
      impliedVolatility: options.impliedVolatility ?? null,
      sentiment: options.sentiment ?? null,
      largestCallOIStrike: options.largestCallOIStrike ?? null,
      largestPutOIStrike: options.largestPutOIStrike ?? null,
      gammaSupport: options.gammaSupport ?? null,
      gammaResistance: options.gammaResistance ?? null,
    },
    probabilities: {
      bullish: probabilities.bullish ?? null,
      bearish: probabilities.bearish ?? null,
      neutral: probabilities.neutral ?? null,
      setupScore: probabilities.setupScore ?? null,
      setupQuality: probabilities.setupQuality ?? null,
      riskLevel: probabilities.riskLevel ?? 'MODERATE',
      primaryDriver: probabilities.primaryDriver ?? null,
      secondaryDriver: probabilities.secondaryDriver ?? null,
      mainRisk: probabilities.mainRisk ?? null,
    },
    scenarios: {
      bullishConfirmation: scenarios.bullish?.confirmationPrice != null
        ? `Break above $${scenarios.bullish.confirmationPrice?.toFixed(2)} with ${scenarios.bullish.requiredVolume || 'volume confirmation'}`
        : probabilities.bullishConfirmation || null,
      bearishInvalidation: scenarios.bearish?.confirmationPrice != null
        ? `Breakdown below $${scenarios.bearish.confirmationPrice?.toFixed(2)}`
        : probabilities.bearishInvalidation || null,
    },
    upcomingEvents,
    recentNews,
  };
}

/**
 * System Instruction for MarketMind AI
 */
export function getGeminiSystemInstruction(mode: 'beginner' | 'advanced' = 'advanced'): string {
  const modeGuidance =
    mode === 'beginner'
      ? `EXPLANATION STYLE (BEGINNER MODE):
- Explain market dynamics and indicator meanings in simple, intuitive, non-jargon language.
- Instead of saying "SPY rejected VWAP while breadth decayed", say: "SPY tried to move above its benchmark daily average price (VWAP) but faced selling pressure, while more individual stocks were falling than rising. This is currently a cautionary sign."
- Define terms simply when used (e.g. "VWAP is the average price institutions paid today", "Support is the price floor where buyers previously stepped in").`
      : `EXPLANATION STYLE (ADVANCED MODE):
- Use rigorous quantitative trading and market structure terminology (e.g. VWAP deviations, relative volume expansion, gamma walls, sector rotation, intermarket correlations, multi-timeframe alignment).
- Detail exact numerical thresholds, key inflection levels, and order flow context.`;

  return `You are MarketMind AI, an elite institutional AI market analysis assistant.

Your job is to explain market data supplied by the application.
You must distinguish facts from interpretation.

CRITICAL DATA INTEGRITY MANDATES:
1. NEVER invent market prices, option prices, VWAP, RSI, moving averages, volume, support, resistance, economic numbers, news headlines, probabilities, or timestamps.
2. Use ONLY the structured market data provided to you in the prompt.
3. If a required fact or indicator is unavailable (e.g. status: 'UNAVAILABLE' or null), clearly state: "Current market data is unavailable." Do not guess, estimate, or hallucinate any numbers.
4. Gemini may explain verified information. Gemini must not substitute missing facts.
5. Explain market movement using technical analysis, price action, volume, market breadth, macro conditions, options activity, and news strictly when those inputs are provided.
6. Do NOT claim certainty about future market movement. Always use probabilistic language (e.g. bullish bias, bearish bias, neutral, higher probability, confirmation, invalidation).
7. Always explain both bullish and bearish risks when appropriate.
8. Do not present analysis as guaranteed financial advice.

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
  aiClient,
}: {
  question: string;
  ticker?: string;
  mode?: 'beginner' | 'advanced';
  language?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  marketData: any;
  aiClient: GoogleGenAI | null;
}): Promise<AskAiResponse> {
  const cleanQuestion = (question || '').trim().slice(0, 500);
  if (!cleanQuestion) {
    return {
      answer: 'Please enter a question about the market.',
      timestamp: new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET',
      source: 'MarketMind Assistant',
    };
  }

  const structuredContext = buildStructuredMarketContext(marketData, ticker);
  const cacheKey = `ask_${ticker}_${mode}_${language}_${cleanQuestion.toLowerCase()}_${structuredContext.currentPrice}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const timestamp = structuredContext.timestampET || new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET';

  // Check if current price is unavailable
  if (structuredContext.currentPrice === null && (!aiClient || !marketData)) {
    return {
      answer: `Verified current market data for ${ticker} is unavailable.`,
      timestamp,
      source: 'MarketMind Data Guard',
      status: 'UNAVAILABLE',
    };
  }

  // Fallback when API key is not yet configured
  if (!aiClient) {
    const cp = structuredContext.currentPrice;
    if (cp === null) {
      return {
        answer: `Verified current market price for ${ticker} is unavailable.`,
        timestamp,
        source: 'MarketMind Data Guard',
        status: 'UNAVAILABLE',
      };
    }

    const vwapVal = structuredContext.indicators?.vwap;
    const isAboveVwap = vwapVal !== null ? cp >= vwapVal : null;
    const r1 = structuredContext.supportResistance?.r1;
    const s1 = structuredContext.supportResistance?.s1;
    const bullProb = structuredContext.probabilities?.bullish;
    const bearProb = structuredContext.probabilities?.bearish;

    const q = cleanQuestion.toLowerCase();
    let fallbackText = '';

    if (q.includes('why') && (q.includes('move') || q.includes('dropping') || q.includes('rising') || q.includes('up') || q.includes('down'))) {
      fallbackText = `${ticker} ($${cp}) is trading ${isAboveVwap !== null ? (isAboveVwap ? 'above' : 'below') : 'near'} session VWAP (${vwapVal !== null ? `$${vwapVal}` : 'unavailable'})${bullProb !== null ? ` with a ${bullProb}% bullish probability` : ''}. ${structuredContext.probabilities?.primaryDriver ? `Primary driver: ${structuredContext.probabilities.primaryDriver}.` : ''} ${r1 !== null ? `Overhead resistance sits at $${r1}.` : ''} ${s1 !== null ? `Support holds at $${s1}.` : ''}`;
    } else if (q.includes('support') || q.includes('resistance') || q.includes('level')) {
      fallbackText = `Key verified levels for **${ticker}**:\n- **Primary Resistance (R1)**: ${r1 !== null ? `$${r1}` : 'Unavailable'}\n- **Intraday VWAP**: ${vwapVal !== null ? `$${vwapVal}` : 'Unavailable'}\n- **Primary Support (S1)**: ${s1 !== null ? `$${s1}` : 'Unavailable'}`;
    } else if (q.includes('vwap')) {
      fallbackText = vwapVal !== null
        ? `**${ticker}** is currently trading **${isAboveVwap ? 'ABOVE' : 'BELOW'} VWAP** ($${vwapVal}) at **$${cp}**.`
        : `Verified VWAP data for **${ticker}** is currently unavailable.`;
    } else {
      fallbackText = `Market summary for **${ticker}**: Currently at **$${cp}** (${structuredContext.dollarChange != null ? (structuredContext.dollarChange >= 0 ? '+' : '') + structuredContext.dollarChange : ''} / ${structuredContext.percentChange != null ? (structuredContext.percentChange >= 0 ? '+' : '') + structuredContext.percentChange + '%' : ''}). ${bullProb !== null && bearProb !== null ? `Calculated bias is ${bullProb >= bearProb ? 'Bullish' : 'Bearish'} (${bullProb}% prob).` : ''}`;
    }

    const responsePayload: AskAiResponse = {
      answer: fallbackText.trim(),
      timestamp,
      source: 'MarketMind Quantitative Verified Facts',
      status: 'VERIFIED',
    };
    setInCache(cacheKey, responsePayload, 15000);
    return responsePayload;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const langInstruction = `\n${getLanguageInstruction(language)}`;

    const recentHistoryText = (conversationHistory || [])
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${systemInstruction}${langInstruction}

CURRENT APPLICATION MARKET DATA:
${JSON.stringify(structuredContext, null, 2)}

RECENT CONVERSATION HISTORY:
${recentHistoryText || 'No prior messages in this session.'}

USER QUESTION: "${cleanQuestion}"

INSTRUCTIONS FOR ANSWERING:
1. Address the question directly and concisely (2-4 clear paragraphs).
2. If the user refers to "it", "the stock", or asks without a ticker, they are referring to ${ticker}.
3. Bold specific verified price levels ($${structuredContext.currentPrice ?? 'Unavailable'}, VWAP $${structuredContext.indicators?.vwap ?? 'Unavailable'}), indicator values, and probabilities when verified.
4. If a requested value is null or unavailable, explicitly state that verified data is unavailable.
5. State confirmation and invalidation triggers clearly.
6. Emphasize both opportunities and downside risks.`;

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
    };

    setInCache(cacheKey, payload, 20000);
    return payload;
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    console.log('[GeminiMarketService] AI query encountered error:', errMsg.slice(0, 100));
    if (structuredContext.currentPrice !== null) {
      return {
        answer: `MarketMind analysis for ${ticker}: Current price is $${structuredContext.currentPrice}.${structuredContext.indicators?.vwap !== null ? ` Session VWAP is $${structuredContext.indicators?.vwap}.` : ''}${structuredContext.supportResistance?.s1 !== null ? ` Primary support holds at $${structuredContext.supportResistance?.s1}.` : ''}${structuredContext.supportResistance?.r1 !== null ? ` Primary resistance sits at $${structuredContext.supportResistance?.r1}.` : ''}`,
        timestamp,
        source: `MarketMind Verified Data (${getGeminiModel()})`,
        status: 'VERIFIED',
      };
    }
    return {
      answer: 'AI ANALYSIS TEMPORARILY UNAVAILABLE',
      timestamp,
      source: 'MarketMind Data Guard',
      status: 'UNAVAILABLE',
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
  aiClient,
}: {
  ticker?: string;
  mode?: 'beginner' | 'advanced';
  timeframe?: string;
  language?: string;
  marketData: any;
  aiClient: GoogleGenAI | null;
}): Promise<MarketAnalysisResponse> {
  const structuredContext = buildStructuredMarketContext(marketData, ticker, timeframe);
  const cacheKey = `analyze_${ticker}_${mode}_${timeframe}_${language}_${structuredContext.currentPrice}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const timestamp = structuredContext.timestampET || new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET';
  const cp = structuredContext.currentPrice;
  const vwapVal = structuredContext.indicators?.vwap;
  const r1 = structuredContext.supportResistance?.r1;
  const s1 = structuredContext.supportResistance?.s1;
  const bullProb = structuredContext.probabilities?.bullish ?? 50;

  if (cp === null) {
    return {
      bias: 'neutral',
      confidenceExplanation: 'Verified market price is unavailable.',
      summary: `Verified market analysis for ${ticker} is currently unavailable due to missing real-time quote data.`,
      bullishFactors: [],
      bearishFactors: [],
      support: [],
      resistance: [],
      confirmation: 'Unavailable',
      invalidation: 'Unavailable',
      risk: 'moderate',
      watchNext: 'Waiting for live data feed connection.',
      timestamp,
      source: 'MarketMind Data Guard',
      status: 'UNAVAILABLE',
    };
  }

  if (!aiClient) {
    const fallback: MarketAnalysisResponse = {
      bias: bullProb >= 55 ? 'bullish' : bullProb <= 40 ? 'bearish' : 'neutral',
      confidenceExplanation: `Calculated probability based on verified price and indicator alignment.`,
      summary: `${ticker} is trading at $${cp}${vwapVal !== null ? `, holding ${cp >= vwapVal ? 'above' : 'below'} intraday VWAP ($${vwapVal})` : ''}.`,
      bullishFactors: [
        vwapVal !== null && cp >= vwapVal ? `Price ($${cp}) is trading above intraday VWAP ($${vwapVal}).` : `Current price is $${cp}.`,
        structuredContext.indicators?.ema9 !== null ? `Short-term 9 EMA is $${structuredContext.indicators?.ema9}.` : 'Technical structure evaluated.',
      ],
      bearishFactors: [
        r1 !== null ? `Overhead resistance near R1 ($${r1}).` : 'Resistance levels to be monitored.',
        s1 !== null ? `Downside support zone at S1 ($${s1}).` : 'Support levels to be monitored.',
      ],
      support: s1 !== null ? [`S1: $${s1}`] : [],
      resistance: r1 !== null ? [`R1: $${r1}`] : [],
      confirmation: r1 !== null ? `Sustained breakout above $${r1}.` : 'Volume confirmation on breakout.',
      invalidation: s1 !== null ? `Decisive breakdown below $${s1}.` : 'Breakdown below support.',
      risk: (structuredContext.probabilities?.riskLevel?.toLowerCase().includes('high') ? 'high' : 'moderate') as any,
      watchNext: `Monitor price action around key intraday levels.`,
      timestamp,
      source: 'MarketMind Verified Quantitative Baseline',
      status: 'VERIFIED',
    };
    setInCache(cacheKey, fallback, 15000);
    return fallback;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const langDirective = `\n${getLanguageInstruction(language)}`;

    const prompt = `${systemInstruction}${langDirective}

Perform an institutional market analysis for ${ticker}.

STRUCTURED APPLICATION MARKET DATA:
${JSON.stringify(structuredContext, null, 2)}

Return a strict JSON object matching this schema:
{
  "bias": "bullish" | "bearish" | "neutral",
  "confidenceExplanation": "1-2 sentences explaining the quantitative probability and conviction based only on verified data",
  "summary": "2-3 sentences summarizing the exact market setup without fabricating missing values",
  "bullishFactors": ["Factor 1 with verified numbers", "Factor 2"],
  "bearishFactors": ["Risk Factor 1 with verified numbers", "Risk Factor 2"],
  "support": ["Support level 1 with price"],
  "resistance": ["Resistance level 1 with price"],
  "confirmation": "Exact condition and price level needed to confirm this setup",
  "invalidation": "Exact condition and breakdown level that invalidates this setup",
  "risk": "low" | "moderate" | "high" | "extreme",
  "watchNext": "The single most important upcoming catalyst or level to watch next"
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
      confidenceExplanation: parsed.confidenceExplanation || `${bullProb}% probabilistic confidence.`,
      summary: parsed.summary || `${ticker} is trading around key verified levels.`,
      bullishFactors: Array.isArray(parsed.bullishFactors) ? parsed.bullishFactors : (vwapVal !== null ? [`Holding above VWAP ($${vwapVal})`] : []),
      bearishFactors: Array.isArray(parsed.bearishFactors) ? parsed.bearishFactors : (r1 !== null ? [`Resistance overhead near $${r1}`] : []),
      support: Array.isArray(parsed.support) ? parsed.support : (s1 !== null ? [`S1: $${s1}`] : []),
      resistance: Array.isArray(parsed.resistance) ? parsed.resistance : (r1 !== null ? [`R1: $${r1}`] : []),
      confirmation: parsed.confirmation || (r1 !== null ? `Breakout above $${r1}.` : 'Volume confirmation.'),
      invalidation: parsed.invalidation || (s1 !== null ? `Breakdown below $${s1}.` : 'Break below support.'),
      risk: ['low', 'moderate', 'high', 'extreme'].includes(parsed.risk) ? parsed.risk : 'moderate',
      watchNext: parsed.watchNext || `Monitor price action around verified levels.`,
      timestamp,
      source: `MarketMind Institutional Analysis (${getGeminiModel()}) [${mode === 'beginner' ? 'Beginner' : 'Advanced'}]`,
      status: 'VERIFIED',
    };

    setInCache(cacheKey, result, 20000);
    return result;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log('[GeminiMarketService] Gemini analysis fallback:', errMsg.slice(0, 100));
    return {
      bias: 'neutral',
      confidenceExplanation: 'Verified quantitative calculation.',
      summary: `${ticker} is trading at $${cp}.${s1 !== null ? ` Support holds at $${s1}.` : ''}${r1 !== null ? ` Resistance at $${r1}.` : ''}`,
      bullishFactors: vwapVal !== null ? [`Price is near session VWAP ($${vwapVal})`] : [],
      bearishFactors: r1 !== null ? [`Supply at overhead resistance $${r1}`] : [],
      support: s1 !== null ? [`$${s1}`] : [],
      resistance: r1 !== null ? [`$${r1}`] : [],
      confirmation: r1 !== null ? `Break above $${r1}` : 'Volume confirmation',
      invalidation: s1 !== null ? `Break below $${s1}` : 'Break below support',
      risk: 'moderate',
      watchNext: `Monitor verified support and resistance levels.`,
      timestamp,
      source: 'MarketMind Verified Engine',
      status: 'VERIFIED',
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
  aiClient,
}: {
  ticker?: string;
  mode?: 'beginner' | 'advanced';
  language?: string;
  marketData: any;
  aiClient: GoogleGenAI | null;
}): Promise<WhyMovingResponse> {
  const structuredContext = buildStructuredMarketContext(marketData, ticker);
  const cacheKey = `why_${ticker}_${mode}_${language}_${structuredContext.currentPrice}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const timestamp = structuredContext.timestampET || new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET';
  const cp = structuredContext.currentPrice;
  const vwapVal = structuredContext.indicators?.vwap;
  const r1 = structuredContext.supportResistance?.r1;
  const s1 = structuredContext.supportResistance?.s1;

  if (cp === null) {
    return {
      headline: `${ticker} Market Movement Analysis`,
      summary: `Verified market price and driver information for ${ticker} is currently unavailable.`,
      drivers: [],
      keyLevels: {
        support: 'Unavailable',
        resistance: 'Unavailable',
        vwap: 'Unavailable',
      },
      timestamp,
      source: 'MarketMind Data Guard',
      status: 'UNAVAILABLE',
    };
  }

  if (!aiClient) {
    const fallback: WhyMovingResponse = {
      headline: `${ticker} ${Number(structuredContext.dollarChange || 0) >= 0 ? 'Advances' : 'Consolidates'} at $${cp}`,
      summary: `${ticker} is trading at $${cp} (${structuredContext.dollarChange != null && structuredContext.dollarChange >= 0 ? '+' : ''}${structuredContext.dollarChange ?? 0}).`,
      drivers: [
        {
          category: 'Price Action & VWAP',
          impact: vwapVal !== null ? (cp >= vwapVal ? 'Bullish' : 'Bearish') : 'Neutral',
          explanation: vwapVal !== null ? `Price ($${cp}) is trading ${cp >= vwapVal ? 'above' : 'below'} session VWAP ($${vwapVal}).` : `Current price is $${cp}.`,
        },
      ],
      keyLevels: {
        support: s1 !== null ? `$${s1}` : 'Unavailable',
        resistance: r1 !== null ? `$${r1}` : 'Unavailable',
        vwap: vwapVal !== null ? `$${vwapVal}` : 'Unavailable',
      },
      timestamp,
      source: 'MarketMind Verified Quantitative Baseline',
      status: 'VERIFIED',
    };
    setInCache(cacheKey, fallback, 15000);
    return fallback;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const langDirective = `\n${getLanguageInstruction(language)}`;

    const prompt = `${systemInstruction}${langDirective}

Analyze why ${ticker} is moving right now based strictly on the provided verified market data.

STRUCTURED APPLICATION MARKET DATA:
${JSON.stringify(structuredContext, null, 2)}

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
          impact: vwapVal !== null ? (cp >= vwapVal ? 'Bullish' : 'Bearish') : 'Neutral',
          explanation: `Trading at $${cp}.`,
        },
      ],
      keyLevels: {
        support: parsed.keyLevels?.support || (s1 !== null ? `$${s1}` : 'Unavailable'),
        resistance: parsed.keyLevels?.resistance || (r1 !== null ? `$${r1}` : 'Unavailable'),
        vwap: parsed.keyLevels?.vwap || (vwapVal !== null ? `$${vwapVal}` : 'Unavailable'),
      },
      timestamp,
      source: `MarketMind Catalyst Synthesis (${getGeminiModel()}) [${mode === 'beginner' ? 'Beginner' : 'Advanced'}]`,
      status: 'VERIFIED',
    };

    setInCache(cacheKey, result, 20000);
    return result;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log('[GeminiMarketService] Why moving error fallback:', errMsg.slice(0, 100));
    return {
      headline: `${ticker} Price Movement Summary`,
      summary: `${ticker} is currently trading at $${cp}.${vwapVal !== null ? ` Session VWAP is $${vwapVal}.` : ''}`,
      drivers: [
        {
          category: 'Technical Flow',
          impact: 'Neutral',
          explanation: `Trading at $${cp}.`,
        },
      ],
      keyLevels: {
        support: s1 !== null ? `$${s1}` : 'Unavailable',
        resistance: r1 !== null ? `$${r1}` : 'Unavailable',
        vwap: vwapVal !== null ? `$${vwapVal}` : 'Unavailable',
      },
      timestamp,
      source: 'MarketMind Verified Data Guard',
      status: 'VERIFIED',
    };
  }
}
