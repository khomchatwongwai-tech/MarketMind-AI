import { Probabilities, MarketQuote } from '../types/market.js';
import { isFiniteMarketNumber } from './formatters.js';

export type BiasState = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'UNAVAILABLE' | 'LOADING';

export interface BiasDiagnosticsResult {
  bias: BiasState;
  confidence: number | null;
  reasons: string[];
}

export function evaluateBiasDiagnostics(
  probabilities?: Partial<Probabilities> | null,
  quote?: Partial<MarketQuote> | null,
  macroQuotes?: Record<string, { price?: number | null }> | null,
  isLoading: boolean = false
): BiasDiagnosticsResult {
  if (isLoading) {
    return {
      bias: 'LOADING',
      confidence: null,
      reasons: ['Loading real-time market data...'],
    };
  }

  const hasValidProbabilities =
    probabilities &&
    isFiniteMarketNumber(probabilities.bullish) &&
    isFiniteMarketNumber(probabilities.bearish) &&
    isFiniteMarketNumber(probabilities.neutral);

  if (!hasValidProbabilities || probabilities?.status === 'UNAVAILABLE') {
    const reasons: string[] = [];

    if (Array.isArray(probabilities?.unavailableReasons) && probabilities.unavailableReasons.length > 0) {
      reasons.push(
        ...probabilities.unavailableReasons.map((r) =>
          String(r).replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]').trim()
        )
      );
    } else {
      if (macroQuotes) {
        if (!isFiniteMarketNumber(macroQuotes['VIX']?.price)) {
          reasons.push('Waiting for VIX');
        }
        if (
          !isFiniteMarketNumber(macroQuotes['US10Y']?.price) &&
          !isFiniteMarketNumber(macroQuotes['10Y']?.price)
        ) {
          reasons.push('Waiting for 10Y Treasury');
        }
      }

      if (quote) {
        if (!isFiniteMarketNumber(quote.relativeVolume)) {
          reasons.push('Waiting for relative volume');
        }
      }

      if (reasons.length === 0) {
        reasons.push('Waiting for breadth');
      }
    }

    return {
      bias: 'UNAVAILABLE',
      confidence: null,
      reasons,
    };
  }

  const b = probabilities.bullish!;
  const r = probabilities.bearish!;
  const n = probabilities.neutral!;

  let bias: BiasState = 'NEUTRAL';
  let confidence: number = Math.max(b, r, n);

  if (b > r && b >= n) {
    bias = 'BULLISH';
    confidence = b;
  } else if (r > b && r >= n) {
    bias = 'BEARISH';
    confidence = r;
  } else {
    bias = 'NEUTRAL';
    confidence = n;
  }

  return {
    bias,
    confidence: isFiniteMarketNumber(probabilities.aiConfidence) ? probabilities.aiConfidence! : confidence,
    reasons: [],
  };
}
