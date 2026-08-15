import { MarketMindScoreBreakdown } from '../types/marketProviders';
import { ComprehensiveMarketData } from './marketDataService';

export function calculateMarketMindScore(data: ComprehensiveMarketData): MarketMindScoreBreakdown {
  const { quote, technicals, supportResistance, trends, breadth, sectors, options } = data;
  const price = quote.price;

  // 1. Trend Factor (0-100)
  const isAboveSma200 = price >= technicals.sma200;
  const isAboveSma50 = price >= technicals.sma50;
  const isAboveEma20 = price >= technicals.ema20;
  let trendScore = 50;
  if (isAboveSma200) trendScore += 20; else trendScore -= 20;
  if (isAboveSma50) trendScore += 15; else trendScore -= 15;
  if (isAboveEma20) trendScore += 15; else trendScore -= 15;
  trendScore = Math.max(5, Math.min(95, trendScore));

  // 2. Momentum Factor (0-100)
  let momentumScore = 50 + (quote.changePercent * 6);
  momentumScore = Math.max(10, Math.min(90, momentumScore));

  // 3. RSI Factor (0-100)
  const rsi = technicals.rsi14 || 50;
  let rsiScore = 50;
  if (rsi >= 50 && rsi <= 68) rsiScore = 85; // healthy bullish zone
  else if (rsi > 68 && rsi <= 78) rsiScore = 70; // bullish but getting extended
  else if (rsi > 78) rsiScore = 40; // overbought risk
  else if (rsi >= 35 && rsi < 50) rsiScore = 45; // neutral to sluggish
  else if (rsi < 35 && rsi >= 25) rsiScore = 65; // oversold bounce zone
  else rsiScore = 30;

  // 4. MACD Factor (0-100)
  let macdScore = technicals.macdHistogram >= 0 ? 75 : 35;
  if (technicals.macd >= technicals.macdSignal) macdScore += 10;

  // 5. Moving Averages Alignment (0-100)
  const maAlignedBull = technicals.ema9 >= technicals.ema20 && technicals.ema20 >= technicals.ema50;
  const maScore = maAlignedBull ? 88 : price >= technicals.ema50 ? 60 : 32;

  // 6. VWAP Factor (0-100)
  const vwapScore = price >= technicals.vwap ? 80 : 35;

  // 7. Relative Volume Factor (0-100)
  const rVol = quote.relativeVolume || 1.1;
  let rVolScore = 50;
  if (rVol >= 1.5 && quote.changePercent >= 0) rVolScore = 90;
  else if (rVol >= 1.2 && quote.changePercent >= 0) rVolScore = 75;
  else if (rVol >= 1.5 && quote.changePercent < 0) rVolScore = 25; // high volume selling
  else if (rVol < 0.8) rVolScore = 45; // low volume churn

  // 8. Volatility (ATR / Bands) (0-100)
  const volScore = technicals.bollingerBandwidth < 4.5 ? 70 : 50; // compression before expansion

  // 9. Support & Resistance (0-100)
  const distToR1 = Math.abs(supportResistance.r1 - price);
  const distToS1 = Math.abs(price - supportResistance.s1);
  let srScore = 55;
  if (price > supportResistance.r1) srScore = 85; // breakout
  else if (price < supportResistance.s1) srScore = 25; // breakdown
  else if (distToS1 < distToR1) srScore = 68; // holding support

  // 10. News Sentiment (0-100)
  const newsScore = quote.changePercent >= 0.5 ? 78 : quote.changePercent <= -0.5 ? 32 : 55;

  // 11. Sector Strength (0-100)
  const sectorScore = 65;

  // 12. Market Breadth (0-100)
  const breadthScore = breadth.sp500AdvDecRatio >= 1.2 ? 75 : breadth.sp500AdvDecRatio < 0.8 ? 35 : 52;

  // 13. Macro Environment (0-100)
  const macroScore = 62;

  // 14. Options Activity (0-100)
  const pcr = options?.putCallRatio || 0.85;
  let optionsScore = 55;
  if (pcr < 0.7) optionsScore = 78; // strong call volume
  else if (pcr > 1.2) optionsScore = 35; // defensive put hedging

  // Weighted Combination
  const totalScore = Math.round(
    trendScore * 0.15 +
    momentumScore * 0.12 +
    rsiScore * 0.08 +
    macdScore * 0.08 +
    maScore * 0.10 +
    vwapScore * 0.10 +
    rVolScore * 0.08 +
    volScore * 0.05 +
    srScore * 0.08 +
    newsScore * 0.06 +
    sectorScore * 0.03 +
    breadthScore * 0.04 +
    macroScore * 0.04 +
    optionsScore * 0.04
  );

  const finalScore = Math.max(1, Math.min(99, totalScore));

  const bias = finalScore >= 60 ? 'BULLISH' : finalScore <= 40 ? 'BEARISH' : 'NEUTRAL';
  const confidence =
    finalScore >= 80 || finalScore <= 20
      ? 'HIGH'
      : finalScore >= 65 || finalScore <= 35
      ? 'MEDIUM_HIGH'
      : 'MEDIUM';

  const momentum =
    quote.changePercent >= 1.2
      ? 'STRONG_BULLISH'
      : quote.changePercent > 0
      ? 'MODERATE_BULLISH'
      : quote.changePercent <= -1.2
      ? 'STRONG_BEARISH'
      : quote.changePercent < 0
      ? 'MODERATE_BEARISH'
      : 'NEUTRAL';

  const technicalStructure =
    price >= technicals.vwap && price >= technicals.ema20
      ? 'Bullish Structure (Above VWAP & 20 EMA)'
      : price < technicals.vwap && price < technicals.ema20
      ? 'Bearish Breakdown (Below VWAP & 20 EMA)'
      : 'Consolidation / Mixed Structure';

  const newsSentiment =
    quote.changePercent >= 1.0
      ? 'VERY_POSITIVE'
      : quote.changePercent > 0
      ? 'POSITIVE'
      : quote.changePercent <= -1.0
      ? 'VERY_NEGATIVE'
      : quote.changePercent < 0
      ? 'NEGATIVE'
      : 'NEUTRAL';

  const volumeConfirmation =
    rVol >= 1.4 ? 'STRONG' : rVol >= 1.0 ? 'MODERATE' : 'WEAK';

  const macroRisk =
    breadth.sp500AdvDecRatio < 0.7 ? 'HIGH' : breadth.sp500AdvDecRatio < 1.0 ? 'ELEVATED' : 'MEDIUM';

  return {
    score: finalScore,
    bias,
    confidence,
    momentum,
    technicalStructure,
    newsSentiment,
    volumeConfirmation,
    macroRisk,
    disclaimer:
      'The MarketMind Intelligence Score is a multi-factor algorithmic quantitative metric designed for market intelligence and risk awareness. It does not represent guaranteed future performance or personalized investment advice.',
    factors: {
      trendScore,
      momentumScore,
      rsiScore,
      macdScore,
      movingAverageScore: maScore,
      vwapScore,
      relativeVolumeScore: rVolScore,
      volatilityScore: volScore,
      supportResistanceScore: srScore,
      newsSentimentScore: newsScore,
      sectorStrengthScore: sectorScore,
      marketBreadthScore: breadthScore,
      macroEnvironmentScore: macroScore,
      optionsActivityScore: optionsScore,
    },
  };
}
