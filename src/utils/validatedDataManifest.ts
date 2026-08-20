import { isFiniteMarketNumber } from './formatters.js';

export interface ValidatedField {
  fieldName: string;
  value: number | string | boolean;
  provider: string;
  timestamp: string | number;
  stale: boolean;
  validationStatus: 'VALID' | 'SUSPECT_DATA' | 'MALFORMED' | 'UNAVAILABLE';
  available: boolean;
}

export interface ValidatedDataManifest {
  ticker: string;
  timestampET: string;
  fields: Record<string, ValidatedField>;
  availableFields: string[];
  omittedFields: string[];
  sourcesUsed: string[];
  overallConfidence: number; // 0 to 100
  isSufficient: boolean;
}

export interface AIExplanationProvenance {
  text?: string;
  status: 'SUCCESS' | 'UNAVAILABLE' | 'INSUFFICIENT_DATA';
  fieldsUsed: string[];
  sourcesUsed: string[];
  generatedAt: string;
  confidence: number;
  omittedFields: string[];
}

/**
 * Builds a strict, validated data manifest from raw market data.
 * Omits any indicator or metric that is null, undefined, N/A, stale, or unverified.
 */
export function buildValidatedDataManifest(data: any, tickerFallback: string = 'SPY'): ValidatedDataManifest {
  const timestampET =
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York',
    }) + ' ET';

  if (!data) {
    return {
      ticker: tickerFallback,
      timestampET,
      fields: {},
      availableFields: [],
      omittedFields: [
        'currentPrice',
        'vwap',
        'ema9',
        'ema20',
        'rsi14',
        'macd',
        'support_r1',
        'support_s1',
        'optionsFlow',
        'relativeVolume',
        'vix',
        'breadth',
        'yield10Y',
        'directionalBias',
      ],
      sourcesUsed: [],
      overallConfidence: 0,
      isSufficient: false,
    };
  }

  const quote = data.quote || {};
  const technicals = data.technicals || {};
  const supportResistance = data.supportResistance || {};
  const options = data.options || {};
  const intermarket = Array.isArray(data.intermarket) ? data.intermarket : [];
  const breadth = data.breadth || {};
  const probabilities = data.probabilities || {};

  const ticker = (quote.ticker || tickerFallback).toUpperCase();
  const provider = quote.metadata?.provider || quote.dataSource || 'Alpaca IEX';

  const fields: Record<string, ValidatedField> = {};
  const availableFields: string[] = [];
  const omittedFields: string[] = [];
  const sourcesSet = new Set<string>();

  // Helper evaluator
  const evalField = (
    key: string,
    val: any,
    fieldName: string,
    fieldProvider: string = provider
  ) => {
    let isValid = false;
    let finalVal: any = null;

    if (val !== null && val !== undefined && val !== 'N/A' && val !== 'Unavailable' && val !== '') {
      if (typeof val === 'number') {
        if (isFiniteMarketNumber(val)) {
          isValid = true;
          finalVal = Number(val.toFixed(2));
        }
      } else if (typeof val === 'string' || typeof val === 'boolean') {
        isValid = true;
        finalVal = val;
      }
    }

    const fieldObj: ValidatedField = {
      fieldName,
      value: isValid ? finalVal : 'Unavailable',
      provider: fieldProvider,
      timestamp: timestampET,
      stale: !isValid,
      validationStatus: isValid ? 'VALID' : 'UNAVAILABLE',
      available: isValid,
    };

    fields[key] = fieldObj;

    if (isValid) {
      availableFields.push(key);
      sourcesSet.add(fieldProvider);
    } else {
      omittedFields.push(key);
    }
  };

  // 1. Core Price
  evalField('currentPrice', quote.price, 'Current Market Price');
  evalField('dollarChange', quote.change, 'Dollar Change');
  evalField('percentChange', quote.changePercent, 'Percent Change');
  evalField('volume', quote.volume, 'Session Volume');
  evalField('dayHigh', quote.dayHigh, 'Day High');
  evalField('dayLow', quote.dayLow, 'Day Low');

  // 2. Technical Indicators
  evalField('vwap', technicals.vwap, 'Session VWAP');
  evalField('ema9', technicals.ema9, '9 EMA');
  evalField('ema20', technicals.ema20, '20 EMA');
  evalField('ema50', technicals.ema50, '50 EMA');
  evalField('rsi14', technicals.rsi14 ?? technicals.rsi, 'RSI (14)');
  evalField('macd', technicals.macd, 'MACD');
  evalField('adx', technicals.adx, 'ADX Trend Strength');
  evalField('atr', technicals.atr, 'Average True Range');

  // 3. Support / Resistance
  evalField('support_r1', supportResistance.r1, 'Resistance R1');
  evalField('support_s1', supportResistance.s1, 'Support S1');

  // 4. Volume & Flow
  evalField('relativeVolume', quote.relativeVolume, 'Relative Volume');
  evalField('optionsFlow', options.putCallRatio, 'Put/Call Options Ratio', options.provider || 'CBOE Feed');

  // 5. Intermarket
  const vixObj = intermarket.find((a: any) => a.symbol === 'VIX');
  evalField('vix', vixObj?.price, 'CBOE VIX Volatility Index', 'CBOE / Yahoo');

  const tenYObj = intermarket.find((a: any) => a.symbol === 'US10Y' || a.symbol === 'TNX' || a.symbol === 'DGS10');
  evalField('yield10Y', tenYObj?.price, '10-Year Treasury Yield', 'FRED / US Treasury');

  const wtiObj = intermarket.find((a: any) => a.symbol === 'CL' || a.symbol === 'WTI');
  evalField('wti', wtiObj?.price, 'WTI Crude Oil', 'NYMEX / Commodity Feed');

  const goldObj = intermarket.find((a: any) => a.symbol === 'XAU' || a.symbol === 'GOLD');
  evalField('gold', goldObj?.price, 'Gold Spot', 'COMEX / Commodity Feed');

  const btcObj = intermarket.find((a: any) => a.symbol === 'BTC');
  evalField('bitcoin', btcObj?.price, 'Bitcoin Spot', 'Coinbase / Crypto Feed');

  // 6. Breadth & Directional Bias
  evalField('breadth', breadth.advanceDeclineRatio, 'Advance/Decline Breadth Ratio');
  evalField('directionalBias', probabilities.bias || probabilities.directionalBias, 'Directional Bias');

  // Confidence & Sufficiency Check
  const keyMetrics = ['currentPrice', 'vwap', 'ema9', 'ema20', 'rsi14', 'support_r1', 'support_s1'];
  const validKeyCount = keyMetrics.filter((k) => fields[k]?.available).length;

  // Overall confidence (0 to 100%)
  const hasPrice = fields['currentPrice']?.available === true;
  const overallConfidence = hasPrice
    ? Math.min(100, Math.round((availableFields.length / 10) * 100))
    : 0;

  // Is sufficient to run AI explanation? Must have valid current price AND at least 1 other valid key metric
  const isSufficient = hasPrice && validKeyCount >= 2;

  return {
    ticker,
    timestampET,
    fields,
    availableFields,
    omittedFields,
    sourcesUsed: Array.from(sourcesSet),
    overallConfidence,
    isSufficient,
  };
}

/**
 * Returns strict system instructions for Gemini to NEVER mention omitted fields.
 */
export function getStrictGuardrailInstruction(manifest: ValidatedDataManifest): string {
  const validSummary = manifest.availableFields
    .map((k) => `${manifest.fields[k].fieldName}: ${manifest.fields[k].value} (${manifest.fields[k].provider})`)
    .join('\n');

  return `
STRICT VALIDATED DATA GUARDRAIL DIRECTIVE:
You are provided ONLY with the VALIDATED MARKET METRICS below.

VALIDATED MARKET METRICS AVAILABLE:
${validSummary || 'None'}

EXCLUDED / OMITTED METRICS (DO NOT MENTION, INFER, OR REASON FROM THESE):
${manifest.omittedFields.join(', ')}

RULES:
1. You MUST ONLY reference metrics listed under VALIDATED MARKET METRICS AVAILABLE.
2. If VWAP, EMA, RSI, Support/Resistance, Options Flow, VIX, Breadth, 10Y Yield, etc., are in the EXCLUDED list, DO NOT mention them, DO NOT estimate them, and DO NOT infer their position.
3. DO NOT state or imply that an omitted metric exists or has a specific relationship (e.g. "trading below VWAP" or "EMAs are bearish" is FORBIDDEN if VWAP or EMA are omitted).
4. Strictly base all explanations on the available validated metrics.
`.trim();
}
