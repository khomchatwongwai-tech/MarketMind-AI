import { MarketBias, Probabilities, RiskLevel, SetupQuality } from '../types/market';

export interface FactorWeights {
  technicals: number; // e.g. 25
  priceAction: number; // e.g. 20
  marketBreadth: number; // e.g. 15
  optionsSentiment: number; // e.g. 10
  macroEconomics: number; // e.g. 10
  newsSentiment: number; // e.g. 10
  intermarket: number; // e.g. 10
}

export const DEFAULT_WEIGHTS: FactorWeights = {
  technicals: 25,
  priceAction: 20,
  marketBreadth: 15,
  optionsSentiment: 10,
  macroEconomics: 10,
  newsSentiment: 10,
  intermarket: 10,
};

export interface FactorScores {
  technicals: number; // -100 to +100
  priceAction: number; // -100 to +100
  marketBreadth: number; // -100 to +100
  optionsSentiment: number; // -100 to +100
  macroEconomics: number; // -100 to +100
  newsSentiment: number; // -100 to +100
  intermarket: number; // -100 to +100
}

export function calculateWeightedProbability(
  scores: FactorScores,
  weights: FactorWeights = DEFAULT_WEIGHTS,
  vix: number = 14.2,
  priceAboveVwap: boolean = true,
  rsi: number = 62.4
): Probabilities {
  const totalWeight =
    weights.technicals +
    weights.priceAction +
    weights.marketBreadth +
    weights.optionsSentiment +
    weights.macroEconomics +
    weights.newsSentiment +
    weights.intermarket;

  // Calculate composite weighted raw directional score (-100 to +100)
  const compositeScore =
    (scores.technicals * weights.technicals +
      scores.priceAction * weights.priceAction +
      scores.marketBreadth * weights.marketBreadth +
      scores.optionsSentiment * weights.optionsSentiment +
      scores.macroEconomics * weights.macroEconomics +
      scores.newsSentiment * weights.newsSentiment +
      scores.intermarket * weights.intermarket) /
    totalWeight;

  // Logistic / Softmax Calibration to guarantee Bullish + Bearish + Neutral = 100%
  // Neutral absorbs probability when scores are near zero or factors conflict heavily
  const factorSpread = Math.abs(compositeScore);
  const factorAgreementCount = [
    scores.technicals,
    scores.priceAction,
    scores.marketBreadth,
    scores.optionsSentiment,
    scores.macroEconomics,
    scores.newsSentiment,
    scores.intermarket,
  ].filter((s) => (compositeScore > 0 ? s > 15 : s < -15)).length;

  // Confidence is calculated from factor agreement
  const confidenceScore = Math.min(
    96,
    Math.max(30, Math.round((factorAgreementCount / 7) * 70 + (factorSpread / 100) * 30))
  );

  let bullishProb = 0;
  let bearishProb = 0;
  let neutralProb = 0;

  if (compositeScore > 5) {
    // Bullish Lean
    const rawBull = 40 + compositeScore * 0.45;
    bullishProb = Math.min(85, Math.max(45, Math.round(rawBull)));
    const remaining = 100 - bullishProb;
    neutralProb = Math.round(remaining * (0.55 - (factorSpread / 200)));
    bearishProb = 100 - bullishProb - neutralProb;
  } else if (compositeScore < -5) {
    // Bearish Lean
    const rawBear = 40 + Math.abs(compositeScore) * 0.45;
    bearishProb = Math.min(85, Math.max(45, Math.round(rawBear)));
    const remaining = 100 - bearishProb;
    neutralProb = Math.round(remaining * (0.55 - (factorSpread / 200)));
    bullishProb = 100 - bearishProb - neutralProb;
  } else {
    // Rangebound / Neutral
    neutralProb = 50 + Math.round((10 - factorSpread) * 2.5);
    bullishProb = Math.round((100 - neutralProb) / 2 + compositeScore);
    bearishProb = 100 - neutralProb - bullishProb;
  }

  // Ensure bounds and exact sum of 100%
  bullishProb = Math.max(5, Math.min(90, bullishProb));
  bearishProb = Math.max(5, Math.min(90, bearishProb));
  neutralProb = 100 - (bullishProb + bearishProb);
  if (neutralProb < 5) {
    neutralProb = 5;
    if (bullishProb > bearishProb) bullishProb = 95 - bearishProb;
    else bearishProb = 95 - bullishProb;
  }

  // Setup Score (0 - 100)
  const setupScore = Math.min(
    98,
    Math.max(35, Math.round(confidenceScore * 0.6 + factorSpread * 0.4))
  );

  let setupQuality: SetupQuality = 'Moderate setup';
  if (setupScore >= 90) setupQuality = 'Exceptional setup';
  else if (setupScore >= 80) setupQuality = 'Strong setup';
  else if (setupScore >= 70) setupQuality = 'Good setup';
  else if (setupScore >= 60) setupQuality = 'Moderate setup';
  else setupQuality = 'NO TRADE / WAIT FOR CONFIRMATION';

  // Risk Meter Calculation
  let riskLevel: RiskLevel = 'MODERATE RISK';
  if (vix > 24 || Math.abs(scores.macroEconomics) > 75) {
    riskLevel = 'EXTREME RISK';
  } else if (vix > 18 || rsi > 75 || rsi < 25) {
    riskLevel = 'HIGHER RISK';
  } else if (vix <= 14.5 && confidenceScore > 65) {
    riskLevel = 'LOWER RISK';
  } else {
    riskLevel = 'MODERATE RISK';
  }

  return {
    bullish: bullishProb,
    bearish: bearishProb,
    neutral: neutralProb,
    aiConfidence: confidenceScore,
    setupScore,
    setupQuality,
    riskLevel,
    primaryDriver:
      compositeScore >= 0
        ? 'Treasury Yield Moderation & Tech Momentum'
        : 'Yield Curve Volatility & Defensive Rotation',
    secondaryDriver: priceAboveVwap
      ? 'Intraday VWAP Defense by Institutional Sweeps'
      : 'Sellers Pressuring Below 20-Day Moving Average',
    mainRisk:
      vix > 18
        ? 'High Volatility Environment (VIX elevated)'
        : 'Key resistance wall overhead requiring relative volume confirmation',
    bullishConfirmation: 'Break and 15M candle close above key resistance with relative volume > 1.25x.',
    bearishInvalidation: 'Loss of intraday VWAP with consecutive lower lows.',
    aiSummary: `SPY is showing ${
      compositeScore > 15
        ? 'solid bullish momentum'
        : compositeScore < -15
        ? 'bearish distribution pressure'
        : 'consolidation in a tight trading range'
    }. Price is ${priceAboveVwap ? 'holding above VWAP' : 'trading below VWAP'} with RSI at ${rsi.toFixed(
      1
    )}.`,
  };
}
