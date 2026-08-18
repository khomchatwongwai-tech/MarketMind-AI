/**
 * MarketMind AI - Deterministic Market Regime Engine
 * Evaluates current market environment state (Risk-On, Risk-Off, Bullish Trend, etc.) using strictly verified technical inputs.
 */

export type MarketRegimeType =
  | 'RISK_ON_EXPANSION'
  | 'RISK_OFF_DEFENSIVE'
  | 'TRENDING_BULLISH'
  | 'TRENDING_BEARISH'
  | 'RANGE_BOUND_CONSOLIDATION'
  | 'HIGH_VOLATILITY_COMPRESSION'
  | 'EVENT_DRIVEN_TRANSITION';

export interface MarketRegimeEvaluation {
  regime: MarketRegimeType;
  label: string;
  summary: string;
  vixLevel: number | null;
  vixState: 'ELEVATED' | 'NORMAL' | 'COMPRESSED' | 'UNAVAILABLE';
  breadthRatio: number | null;
  dominantTheme: string;
  actionableContext: string;
  timestamp: string;
}

export class MarketRegimeEngine {
  /**
   * Deterministically classifies the market regime from verified market telemetry
   */
  public static evaluateRegime(params: {
    spyPrice?: number;
    spyChangePercent?: number;
    qqqChangePercent?: number;
    vix?: number;
    advancersCount?: number;
    declinersCount?: number;
    yield10Year?: number;
  }): MarketRegimeEvaluation {
    const timestamp = new Date().toISOString();
    const vix = params.vix ?? null;
    const spyChg = params.spyChangePercent ?? 0;
    const qqqChg = params.qqqChangePercent ?? 0;

    let vixState: 'ELEVATED' | 'NORMAL' | 'COMPRESSED' | 'UNAVAILABLE' = 'UNAVAILABLE';
    if (vix !== null) {
      if (vix >= 24) vixState = 'ELEVATED';
      else if (vix <= 14) vixState = 'COMPRESSED';
      else vixState = 'NORMAL';
    }

    let breadthRatio: number | null = null;
    if (params.advancersCount !== undefined && params.declinersCount !== undefined && params.declinersCount > 0) {
      breadthRatio = Number((params.advancersCount / params.declinersCount).toFixed(2));
    }

    // Deterministic Rule Engine
    if (vix !== null && vix >= 26) {
      return {
        regime: 'HIGH_VOLATILITY_COMPRESSION',
        label: 'High Volatility Defensive Regime',
        summary: `VIX at ${vix.toFixed(1)} indicates elevated macro risk premiums and widened intraday ranges.`,
        vixLevel: vix,
        vixState,
        breadthRatio,
        dominantTheme: 'Macro Risk & Capital Preservation',
        actionableContext: 'Favor defined-risk structures, tighter position sizes, and respect critical support zones.',
        timestamp,
      };
    }

    if (spyChg > 0.8 && qqqChg > 1.0 && (breadthRatio === null || breadthRatio > 1.5)) {
      return {
        regime: 'RISK_ON_EXPANSION',
        label: 'Risk-On Growth Expansion',
        summary: `Broad market indices advancing with strong tech leadership (QQQ ${qqqChg > 0 ? '+' : ''}${qqqChg.toFixed(2)}%) and positive participation.`,
        vixLevel: vix,
        vixState,
        breadthRatio,
        dominantTheme: 'Growth Leadership & Momentum Continuation',
        actionableContext: 'Trend-following setups above intraday VWAP offer favorable risk/reward on pullbacks.',
        timestamp,
      };
    }

    if (spyChg < -0.8 && qqqChg < -1.0) {
      return {
        regime: 'RISK_OFF_DEFENSIVE',
        label: 'Risk-Off Market Distribution',
        summary: `Institutional selling pressure across major index benchmarks with negative breadth.`,
        vixLevel: vix,
        vixState,
        breadthRatio,
        dominantTheme: 'Broad Liquidity Withdrawal',
        actionableContext: 'Avoid chasing oversold bounces without structural volume confirmation at major support.',
        timestamp,
      };
    }

    if (spyChg >= 0.2 && spyChg <= 0.8) {
      return {
        regime: 'TRENDING_BULLISH',
        label: 'Constructive Bullish Trend',
        summary: 'Market holding positive territory with steady intraday structure and controlled volatility.',
        vixLevel: vix,
        vixState,
        breadthRatio,
        dominantTheme: 'Orderly Uptrend Progression',
        actionableContext: 'Focus on leading relative strength sectors holding above key moving averages.',
        timestamp,
      };
    }

    if (spyChg <= -0.2 && spyChg >= -0.8) {
      return {
        regime: 'TRENDING_BEARISH',
        label: 'Orderly Pullback / Consolidation',
        summary: 'Market digesting recent gains with mild profit taking across index weights.',
        vixLevel: vix,
        vixState,
        breadthRatio,
        dominantTheme: 'Consolidation & Range Retest',
        actionableContext: 'Monitor whether key indices hold above their 20-day moving average and prior swing lows.',
        timestamp,
      };
    }

    return {
      regime: 'RANGE_BOUND_CONSOLIDATION',
      label: 'Range-Bound Rotational Market',
      summary: 'Indices oscillating within established trading bounds with selective stock picking and sector rotation.',
      vixLevel: vix,
      vixState,
      breadthRatio,
      dominantTheme: 'Sector Rotation & Level-to-Level Trading',
      actionableContext: 'Buy support, sell resistance, and avoid expecting sustained breakouts without volume catalysts.',
      timestamp,
    };
  }
}
