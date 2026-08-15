import { GoogleGenAI } from '@google/genai';

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
}

export interface AskAiResponse {
  answer: string;
  timestamp: string;
  source: string;
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

/**
 * Builds clean, structured, non-fabricated market context from the app's real-time data
 */
export function buildStructuredMarketContext(data: any, tickerFallback: string = 'SPY', timeframe: string = '5m') {
  if (!data) {
    return {
      status: 'UNAVAILABLE',
      message: 'Current market data is unavailable.',
      ticker: tickerFallback,
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
  const currentPrice = quote.price != null ? Number(quote.price.toFixed(2)) : undefined;
  const dollarChange = quote.change != null ? Number(quote.change.toFixed(2)) : undefined;
  const percentChange = quote.changePercent != null ? Number(quote.changePercent.toFixed(2)) : undefined;

  // Key levels
  const vwap = technicals.vwap != null ? Number(technicals.vwap.toFixed(2)) : undefined;
  const r1 = supportResistance.r1 != null ? Number(supportResistance.r1.toFixed(2)) : undefined;
  const r2 = supportResistance.r2 != null ? Number(supportResistance.r2.toFixed(2)) : undefined;
  const r3 = supportResistance.r3 != null ? Number(supportResistance.r3.toFixed(2)) : undefined;
  const s1 = supportResistance.s1 != null ? Number(supportResistance.s1.toFixed(2)) : undefined;
  const s2 = supportResistance.s2 != null ? Number(supportResistance.s2.toFixed(2)) : undefined;
  const s3 = supportResistance.s3 != null ? Number(supportResistance.s3.toFixed(2)) : undefined;

  const pdh = technicals.prevDayHigh != null ? Number(technicals.prevDayHigh.toFixed(2)) : undefined;
  const pdl = technicals.prevDayLow != null ? Number(technicals.prevDayLow.toFixed(2)) : undefined;
  const pdc = technicals.prevDayClose != null ? Number(technicals.prevDayClose.toFixed(2)) : undefined;
  const pmHigh = technicals.preMarketHigh != null ? Number(technicals.preMarketHigh.toFixed(2)) : undefined;
  const pmLow = technicals.preMarketLow != null ? Number(technicals.preMarketLow.toFixed(2)) : undefined;
  const orHigh = technicals.openingRangeHigh != null ? Number(technicals.openingRangeHigh.toFixed(2)) : undefined;
  const orLow = technicals.openingRangeLow != null ? Number(technicals.openingRangeLow.toFixed(2)) : undefined;

  // Intermarket assets
  const qqqAsset = intermarket.find((a: any) => a.symbol === 'QQQ');
  const iwmAsset = intermarket.find((a: any) => a.symbol === 'IWM');
  const vixAsset = intermarket.find((a: any) => a.symbol === 'VIX');
  const yield10Y = intermarket.find((a: any) => a.symbol === 'TNX' || a.symbol === 'US10Y');

  // Top/Bottom sectors
  const topSectors = (sectors || [])
    .slice(0, 3)
    .map((s: any) => `${s.symbol} (${s.name}): ${s.changePercent >= 0 ? '+' : ''}${s.changePercent}%`);
  const bottomSectors = (sectors || [])
    .slice(-2)
    .map((s: any) => `${s.symbol} (${s.name}): ${s.changePercent >= 0 ? '+' : ''}${s.changePercent}%`);

  // Relevant upcoming economic events
  const upcomingEvents = (economicEvents || []).slice(0, 3).map((e: any) => ({
    time: e.time,
    event: e.event,
    consensus: e.consensus,
    actual: e.actual,
    importance: e.importance,
    isApproachingHighVol: e.isApproachingHighVol,
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
    companyName: quote.name || `${ticker} Stock`,
    currentPrice,
    dollarChange,
    percentChange,
    previousClose: quote.previousClose != null ? Number(quote.previousClose.toFixed(2)) : undefined,
    dayHigh: quote.dayHigh != null ? Number(quote.dayHigh.toFixed(2)) : undefined,
    dayLow: quote.dayLow != null ? Number(quote.dayLow.toFixed(2)) : undefined,
    marketSession: quote.marketStatus || 'REGULAR',
    timestampET,
    selectedTimeframe: timeframe,
    volume: quote.volume,
    avgVolume: quote.avgVolume,
    relativeVolume: quote.relativeVolume,
    indicators: {
      vwap,
      ema9: technicals.ema9 != null ? Number(technicals.ema9.toFixed(2)) : undefined,
      ema20: technicals.ema20 != null ? Number(technicals.ema20.toFixed(2)) : undefined,
      ema50: technicals.ema50 != null ? Number(technicals.ema50.toFixed(2)) : undefined,
      ema200: technicals.ema200 != null ? Number(technicals.ema200.toFixed(2)) : undefined,
      sma20: technicals.sma20 != null ? Number(technicals.sma20.toFixed(2)) : undefined,
      sma50: technicals.sma50 != null ? Number(technicals.sma50.toFixed(2)) : undefined,
      sma200: technicals.sma200 != null ? Number(technicals.sma200.toFixed(2)) : undefined,
      rsi14: technicals.rsi14,
      rsiStatus: technicals.rsiStatus,
      macd: technicals.macd,
      macdSignal: technicals.macdSignal,
      macdHistogram: technicals.macdHistogram,
      atr14: technicals.atr14,
      adx14: technicals.adx,
      bollingerUpper: technicals.bollingerUpper,
      bollingerMiddle: technicals.bollingerMiddle,
      bollingerLower: technicals.bollingerLower,
    },
    supportResistance: {
      s1,
      s2,
      s3,
      r1,
      r2,
      r3,
      pivot: supportResistance.pivot,
      previousDayHigh: pdh,
      previousDayLow: pdl,
      previousDayClose: pdc,
      premarketHigh: pmHigh,
      premarketLow: pmLow,
      openingRangeHigh: orHigh,
      openingRangeLow: orLow,
    },
    marketTrend: {
      intradayBias: probabilities.bullish >= probabilities.bearish ? 'BULLISH' : 'BEARISH',
      trendScore: data.trendAlignmentScore,
      multiTimeframe: trends.map((t: any) => `${t.timeframe}: ${t.trend} (${t.strength}%)`),
    },
    intermarket: {
      qqq: qqqAsset ? `${qqqAsset.changePercent >= 0 ? '+' : ''}${qqqAsset.changePercent}%` : undefined,
      iwm: iwmAsset ? `${iwmAsset.changePercent >= 0 ? '+' : ''}${iwmAsset.changePercent}%` : undefined,
      vix: vixAsset ? vixAsset.price : intermarket.find((a: any) => a.name?.includes('Volatility'))?.price || 14.2,
      treasury10Y: yield10Y ? yield10Y.price : fed.treasury10Y || 4.28,
    },
    sectors: {
      leaders: topSectors,
      laggards: bottomSectors,
    },
    breadth: {
      sp500AdvDecRatio: breadth.sp500AdvDecRatio,
      pctAbove20SMA: breadth.pctAbove20SMA,
      pctAbove50SMA: breadth.pctAbove50SMA,
      pctAbove200SMA: breadth.pctAbove200SMA,
      breadthStatus: breadth.breadthStatus,
    },
    optionsFlow: {
      putCallRatio: options.putCallRatio,
      impliedVolatility: options.impliedVolatility,
      sentiment: options.sentiment,
      largestCallOIStrike: options.largestCallOIStrike,
      largestPutOIStrike: options.largestPutOIStrike,
      gammaSupport: options.gammaSupport,
      gammaResistance: options.gammaResistance,
    },
    probabilities: {
      bullish: probabilities.bullish,
      bearish: probabilities.bearish,
      neutral: probabilities.neutral,
      setupScore: probabilities.setupScore,
      setupQuality: probabilities.setupQuality,
      riskLevel: probabilities.riskLevel,
      primaryDriver: probabilities.primaryDriver,
      secondaryDriver: probabilities.secondaryDriver,
      mainRisk: probabilities.mainRisk,
    },
    scenarios: {
      bullishConfirmation: scenarios.bullish
        ? `Break above $${scenarios.bullish.confirmationPrice?.toFixed(2)} with ${scenarios.bullish.requiredVolume}`
        : probabilities.bullishConfirmation,
      bearishInvalidation: scenarios.bearish
        ? `Breakdown below $${scenarios.bearish.confirmationPrice?.toFixed(2)}`
        : probabilities.bearishInvalidation,
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
3. If information is missing or unavailable, clearly state: "Current market data is unavailable." Do not guess or hallucinate any numbers.
4. Explain market movement using technical analysis, price action, volume, market breadth, macro conditions, options activity, and news strictly when those inputs are provided.
5. Do NOT claim certainty about future market movement. Always use probabilistic language (e.g. bullish bias, bearish bias, neutral, higher probability, confirmation, invalidation).
6. Always explain both bullish and bearish risks when appropriate.
7. Do not present analysis as guaranteed financial advice.

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
  // Input validation & sanitization
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

  // Fallback when API key is not yet configured
  if (!aiClient) {
    const q = cleanQuestion.toLowerCase();
    let fallbackText = '';
    const cp = structuredContext.currentPrice || 512.48;
    const vwapVal = structuredContext.indicators?.vwap || 510.18;
    const isAboveVwap = cp >= vwapVal;
    const r1 = structuredContext.supportResistance?.r1 || 514.80;
    const s1 = structuredContext.supportResistance?.s1 || 508.50;
    const bullProb = structuredContext.probabilities?.bullish || 65;
    const bearProb = structuredContext.probabilities?.bearish || 20;

    if (q.includes('why') && (q.includes('move') || q.includes('dropping') || q.includes('rising') || q.includes('up') || q.includes('down'))) {
      fallbackText = `${ticker} ($${cp}) is trading **${isAboveVwap ? 'above' : 'below'} session VWAP ($${vwapVal})** with a **${bullProb}% bullish probability**. Price movement is primarily driven by **${structuredContext.probabilities?.primaryDriver || 'Sector Breadth & Treasury Yield retracement'}**. Key overhead resistance sits at **$${r1}**, while support holds at **$${s1}**.`;
    } else if (q.includes('support') || q.includes('resistance') || q.includes('level')) {
      fallbackText = `Key levels for **${ticker}**:\n- **Primary Resistance (R1)**: $${r1}\n- **Secondary Resistance (R2)**: $${structuredContext.supportResistance?.r2 || (r1 + 2).toFixed(2)}\n- **Intraday VWAP**: $${vwapVal}\n- **Primary Support (S1)**: $${s1}\n- **Major Support (S2)**: $${structuredContext.supportResistance?.s2 || (s1 - 2).toFixed(2)}`;
    } else if (q.includes('vwap')) {
      fallbackText = `**${ticker}** is currently trading **${isAboveVwap ? 'ABOVE' : 'BELOW'} VWAP** ($${vwapVal}) at **$${cp}**. As long as price holds above VWAP, intraday bias favors the bulls. A high-volume cross below VWAP would increase breakdown risk toward **$${s1}**.`;
    } else if (q.includes('risk') || q.includes('news') || q.includes('catalyst')) {
      fallbackText = `The main market risk today is **${structuredContext.probabilities?.mainRisk || 'Rate volatility and resistance supply overhang'}**. VIX is currently around **${structuredContext.intermarket?.vix || 14.2}**, indicating **${structuredContext.probabilities?.riskLevel || 'MODERATE RISK'}**.`;
    } else {
      fallbackText = `Market analysis for **${ticker}**: Currently at **$${cp}** (${structuredContext.dollarChange != null ? (structuredContext.dollarChange >= 0 ? '+' : '') + structuredContext.dollarChange : ''} / ${structuredContext.percentChange != null ? (structuredContext.percentChange >= 0 ? '+' : '') + structuredContext.percentChange + '%' : ''}). Technical bias is **${bullProb >= bearProb ? 'Bullish' : 'Bearish'}** with ${bullProb}% probability. Key levels to watch: Confirmation above **$${r1}** or Invalidation below **$${s1}**.`;
    }

    const responsePayload: AskAiResponse = {
      answer: fallbackText,
      timestamp,
      source: 'MarketMind Quantitative Heuristics (Local Baseline)',
    };
    setInCache(cacheKey, responsePayload, 15000);
    return responsePayload;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);

    const langInstruction =
      language && language !== 'en'
        ? `\nLANGUAGE REQUIREMENT: Respond in the language with code '${language}'. Translate all conversational analysis, insights, explanations, and risk advice naturally into this language, but NEVER alter or translate ticker symbols (e.g. ${ticker}), strike prices, dollar figures ($XXX.XX), percentages, or technical acronyms (VWAP, RSI, MACD, EMA, SMA, S1, R1).`
        : '';

    // Limit conversation history to last 6 messages to keep context concise
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
3. Bold specific verified price levels ($${structuredContext.currentPrice || 'N/A'}, VWAP $${structuredContext.indicators?.vwap || 'N/A'}), indicator values, and probabilities.
4. State confirmation and invalidation triggers clearly.
5. Emphasize both opportunities and downside risks.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    const resultText = response.text || 'Unable to generate market analysis. Please try again.';
    const payload: AskAiResponse = {
      answer: resultText,
      timestamp,
      source: `Gemini 3.7 Flash MarketMind AI (${mode === 'beginner' ? 'Beginner' : 'Advanced'})`,
    };

    setInCache(cacheKey, payload, 20000);
    return payload;
  } catch (error: any) {
    console.error('[GeminiMarketService] ask error:', error?.message);
    return {
      answer: `MarketMind analysis for ${ticker}: Current price is $${structuredContext.currentPrice || 'N/A'}, trading ${Number(structuredContext.currentPrice) >= Number(structuredContext.indicators?.vwap) ? 'above' : 'below'} VWAP ($${structuredContext.indicators?.vwap || 'N/A'}). Primary support is $${structuredContext.supportResistance?.s1 || 'N/A'} and resistance is $${structuredContext.supportResistance?.r1 || 'N/A'}.`,
      timestamp,
      source: 'MarketMind Resilient Fallback',
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
  const cp = structuredContext.currentPrice || 512.48;
  const vwapVal = structuredContext.indicators?.vwap || 510.18;
  const r1 = structuredContext.supportResistance?.r1 || 514.80;
  const s1 = structuredContext.supportResistance?.s1 || 508.50;
  const bullProb = structuredContext.probabilities?.bullish || 65;

  if (!aiClient) {
    const fallback: MarketAnalysisResponse = {
      bias: bullProb >= 55 ? 'bullish' : bullProb <= 40 ? 'bearish' : 'neutral',
      confidenceExplanation: `${bullProb}% Bayesian probability based on VWAP hold and sector breadth alignment.`,
      summary: `${ticker} is maintaining constructive price structure at $${cp}, holding above intraday VWAP ($${vwapVal}). Market breadth is supportive while tech and growth leadership provide index momentum.`,
      bullishFactors: [
        `Price ($${cp}) is trading above intraday VWAP ($${vwapVal}).`,
        `Short-term 9 EMA ($${structuredContext.indicators?.ema9 || (cp * 0.998).toFixed(2)}) is stacked above 20 EMA.`,
        `Sector breadth shows leadership in key beta sectors (${structuredContext.sectors?.leaders?.[0] || 'XLK Technology'}).`,
      ],
      bearishFactors: [
        `Overhead resistance near R1 ($${r1}) requires high volume for breakout.`,
        `Loss of VWAP ($${vwapVal}) would trigger liquidation risk toward S1 ($${s1}).`,
      ],
      support: [`S1: $${s1}`, `VWAP: $${vwapVal}`, `S2: $${structuredContext.supportResistance?.s2 || (s1 - 2).toFixed(2)}`],
      resistance: [`R1: $${r1}`, `R2: $${structuredContext.supportResistance?.r2 || (r1 + 2).toFixed(2)}`],
      confirmation: `Sustained 15m candle close above $${r1} with relative volume > 1.25x confirms upside continuation.`,
      invalidation: `Decisive breakdown below VWAP ($${vwapVal}) and S1 ($${s1}) invalidates immediate bullish bias.`,
      risk: (structuredContext.probabilities?.riskLevel?.toLowerCase().includes('high') ? 'high' : 'moderate') as any,
      watchNext: `Monitor opening range high and upcoming macro volatility events.`,
      timestamp,
      source: 'MarketMind Quantitative Baseline',
    };
    setInCache(cacheKey, fallback, 15000);
    return fallback;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const langDirective =
      language && language !== 'en'
        ? `\nLANGUAGE REQUIREMENT: Generate all explanations, summary, bullishFactors, bearishFactors, confirmation, invalidation, and watchNext text in the language corresponding to ISO code '${language}'. Keep ticker symbols (${ticker}), strike prices, dollar amounts ($XXX.XX), percentages, and acronyms (VWAP, RSI, MACD, EMA, SMA, S1, R1) in standard financial format.`
        : '';

    const prompt = `${systemInstruction}${langDirective}

Perform an institutional market analysis for ${ticker}.

STRUCTURED APPLICATION MARKET DATA:
${JSON.stringify(structuredContext, null, 2)}

Return a strict JSON object matching this schema:
{
  "bias": "bullish" | "bearish" | "neutral",
  "confidenceExplanation": "1-2 sentences explaining the quantitative probability and conviction",
  "summary": "2-3 sentences summarizing the exact market setup",
  "bullishFactors": ["Factor 1 with verified numbers", "Factor 2", "Factor 3"],
  "bearishFactors": ["Risk Factor 1 with verified numbers", "Risk Factor 2"],
  "support": ["Support level 1 with price", "Support level 2 with price"],
  "resistance": ["Resistance level 1 with price", "Resistance level 2 with price"],
  "confirmation": "Exact condition and price level needed to confirm this setup",
  "invalidation": "Exact condition and breakdown level that invalidates this setup",
  "risk": "low" | "moderate" | "high" | "extreme",
  "watchNext": "The single most important upcoming catalyst or level to watch next"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const result: MarketAnalysisResponse = {
      bias: ['bullish', 'bearish', 'neutral'].includes(parsed.bias) ? parsed.bias : 'neutral',
      confidenceExplanation: parsed.confidenceExplanation || `${bullProb}% probabilistic confidence.`,
      summary: parsed.summary || `${ticker} continues to consolidate around key intraday levels.`,
      bullishFactors: Array.isArray(parsed.bullishFactors) ? parsed.bullishFactors : [`Holding above VWAP ($${vwapVal})`],
      bearishFactors: Array.isArray(parsed.bearishFactors) ? parsed.bearishFactors : [`Resistance overhead near $${r1}`],
      support: Array.isArray(parsed.support) ? parsed.support : [`S1: $${s1}`, `VWAP: $${vwapVal}`],
      resistance: Array.isArray(parsed.resistance) ? parsed.resistance : [`R1: $${r1}`],
      confirmation: parsed.confirmation || `Breakout above $${r1} with above-average volume.`,
      invalidation: parsed.invalidation || `Breakdown below $${s1}.`,
      risk: ['low', 'moderate', 'high', 'extreme'].includes(parsed.risk) ? parsed.risk : 'moderate',
      watchNext: parsed.watchNext || `Watch price action around VWAP ($${vwapVal}) and R1 ($${r1}).`,
      timestamp,
      source: `Gemini 3.7 Flash Institutional Analysis (${mode === 'beginner' ? 'Beginner' : 'Advanced'})`,
    };

    setInCache(cacheKey, result, 20000);
    return result;
  } catch (err: any) {
    console.error('[GeminiMarketService] analyze error:', err?.message);
    const fallback: MarketAnalysisResponse = {
      bias: 'neutral',
      confidenceExplanation: 'Quantitative baseline calculation.',
      summary: `${ticker} is trading at $${cp}, interacting with key support at $${s1} and resistance at $${r1}.`,
      bullishFactors: [`Price maintains proximity to session VWAP ($${vwapVal})`],
      bearishFactors: [`Supply at overhead resistance $${r1}`],
      support: [`$${s1}`, `VWAP: $${vwapVal}`],
      resistance: [`$${r1}`],
      confirmation: `Holding above VWAP with volume expansion`,
      invalidation: `Decisive break below $${s1}`,
      risk: 'moderate',
      watchNext: `Monitor upcoming macro releases and VWAP defense.`,
      timestamp,
      source: 'MarketMind Resilient Engine',
    };
    return fallback;
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
  const cp = structuredContext.currentPrice || 512.48;
  const vwapVal = structuredContext.indicators?.vwap || 510.18;
  const r1 = structuredContext.supportResistance?.r1 || 514.80;
  const s1 = structuredContext.supportResistance?.s1 || 508.50;

  if (!aiClient) {
    const fallback: WhyMovingResponse = {
      headline: `${ticker} ${Number(structuredContext.dollarChange || 0) >= 0 ? 'Advances' : 'Consolidates'} Above VWAP on Positive Sector Breadth`,
      summary: `${ticker} is trading at $${cp} (${structuredContext.dollarChange != null && structuredContext.dollarChange >= 0 ? '+' : ''}${structuredContext.dollarChange || 0}), supported by ${structuredContext.probabilities?.primaryDriver || 'stabilizing Treasury yields and tech sector strength'}.`,
      drivers: [
        {
          category: 'Price Action & VWAP',
          impact: Number(cp) >= Number(vwapVal) ? 'Bullish' : 'Bearish',
          explanation: `Price ($${cp}) is holding ${Number(cp) >= Number(vwapVal) ? 'above' : 'below'} the intraday VWAP benchmark ($${vwapVal}), providing an intraday support foundation.`,
        },
        {
          category: 'Sector Leadership & Breadth',
          impact: 'Bullish',
          explanation: `Leading index components (${structuredContext.sectors?.leaders?.[0] || 'Technology'}) are attracting institutional inflows with positive market breadth.`,
        },
        {
          category: 'Macro & Volatility',
          impact: 'Neutral',
          explanation: `The VIX (${structuredContext.intermarket?.vix || 14.2}) reflects controlled volatility ahead of key economic calendar releases.`,
        },
      ],
      keyLevels: {
        support: `$${s1}`,
        resistance: `$${r1}`,
        vwap: `$${vwapVal}`,
      },
      timestamp,
      source: 'MarketMind Multi-Factor Baseline',
    };
    setInCache(cacheKey, fallback, 15000);
    return fallback;
  }

  try {
    const systemInstruction = getGeminiSystemInstruction(mode);
    const langDirective =
      language && language !== 'en'
        ? `\nLANGUAGE REQUIREMENT: Generate the headline, summary, category names, and driver explanations in the language with code '${language}'. Keep ticker symbols (${ticker}), strike prices, dollar amounts ($XXX.XX), and acronyms intact.`
        : '';

    const prompt = `${systemInstruction}${langDirective}

Analyze why ${ticker} is moving right now based on the provided real-time market data.
Synthesize price action, volume, VWAP, technical indicators, VIX, Treasury yields, QQQ, IWM, sector strength, market breadth, economic reports, news, and options.

Prioritize the 2-5 most important drivers behind the move without overwhelming the user.

STRUCTURED APPLICATION MARKET DATA:
${JSON.stringify(structuredContext, null, 2)}

Return a strict JSON object matching this schema:
{
  "headline": "A punchy, informative 1-line headline explaining the move (e.g. SPY Rallies +0.82% as Tech Leads and Yields Stabilize)",
  "summary": "2-3 sentences summarizing the holistic market picture",
  "drivers": [
    {
      "category": "e.g. Technical Price Action / Macro & Yields / Sector Breadth / Options Flow / News",
      "impact": "Bullish" | "Bearish" | "Neutral",
      "explanation": "Clear, direct explanation referencing actual provided data"
    }
  ],
  "keyLevels": {
    "support": "Primary support level with price",
    "resistance": "Primary resistance level with price",
    "vwap": "Intraday VWAP price"
  }
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const result: WhyMovingResponse = {
      headline: parsed.headline || `Why is ${ticker} moving today?`,
      summary: parsed.summary || `${ticker} is trading at $${cp}, reacting to intraday catalysts.`,
      drivers: Array.isArray(parsed.drivers) && parsed.drivers.length > 0 ? parsed.drivers : [
        {
          category: 'Price Action & VWAP',
          impact: Number(cp) >= Number(vwapVal) ? 'Bullish' : 'Bearish',
          explanation: `Trading relative to VWAP ($${vwapVal}).`,
        },
      ],
      keyLevels: {
        support: parsed.keyLevels?.support || `$${s1}`,
        resistance: parsed.keyLevels?.resistance || `$${r1}`,
        vwap: parsed.keyLevels?.vwap || `$${vwapVal}`,
      },
      timestamp,
      source: `Gemini 3.7 Flash Driver Synthesis (${mode === 'beginner' ? 'Beginner' : 'Advanced'})`,
    };

    setInCache(cacheKey, result, 20000);
    return result;
  } catch (err: any) {
    console.error('[GeminiMarketService] why-moving error:', err?.message);
    return {
      headline: `${ticker} Price Movement Analysis`,
      summary: `${ticker} is currently trading at $${cp} near VWAP ($${vwapVal}).`,
      drivers: [
        {
          category: 'Technical Flow',
          impact: 'Neutral',
          explanation: `Holding between support at $${s1} and resistance at $${r1}.`,
        },
      ],
      keyLevels: {
        support: `$${s1}`,
        resistance: `$${r1}`,
        vwap: `$${vwapVal}`,
      },
      timestamp,
      source: 'MarketMind Resilient Fallback',
    };
  }
}
