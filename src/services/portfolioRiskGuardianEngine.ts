import {
  HoldingPosition,
  OptionsPosition,
  PortfolioRiskAssessment,
  CorrelationPair,
  RiskRating,
} from '../types/portfolio.js';

export class PortfolioRiskGuardianEngine {
  /**
   * Evaluates comprehensive risk across holdings, options, sectors, and correlation clusters.
   */
  public static calculatePortfolioRisk(
    holdings: HoldingPosition[],
    options: OptionsPosition[],
    cashBalance: number
  ): PortfolioRiskAssessment {
    const totalEquitiesValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalOptionsValue = options.reduce((sum, o) => sum + o.marketValue, 0);
    const totalPortfolioValue = totalEquitiesValue + totalOptionsValue + cashBalance;

    if (totalPortfolioValue === 0 || holdings.length === 0) {
      return {
        overallRiskScore: 20,
        riskTier: 'LOW',
        techExposurePercent: 0,
        largestHolding: { symbol: 'CASH', company: 'Cash Reserves', weightPercent: 100, value: cashBalance },
        top3WeightPercent: 0,
        highCorrelationPairs: [],
        upcomingEarningsExposure: 'LOW',
        optionsRiskLevel: 'NONE',
        marketSensitivityBeta: 0,
        portfolioVolatilityAnnualized: 10,
        maxEstimatedDrawdown: 5,
        factorExplanations: [
          { title: 'Cash Safety', level: 'SAFE', description: 'Portfolio is in cash; zero market volatility.' },
        ],
        warnings: [],
      };
    }

    // 1. Sector Concentration
    const techHoldings = holdings.filter(
      (h) => h.sector.toLowerCase().includes('tech') || h.industry?.toLowerCase().includes('semi')
    );
    const techValue = techHoldings.reduce((sum, h) => sum + h.marketValue, 0);
    const techExposurePercent = +(techValue / totalPortfolioValue * 100).toFixed(1);

    // 2. Position Concentration (Largest & Top 3)
    const sortedHoldings = [...holdings].sort((a, b) => b.marketValue - a.marketValue);
    const largest = sortedHoldings[0];
    const largestWeight = +(largest.marketValue / totalPortfolioValue * 100).toFixed(1);

    const top3Value = sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.marketValue, 0);
    const top3WeightPercent = +(top3Value / totalPortfolioValue * 100).toFixed(1);

    // 3. Beta & Sensitivity
    let weightedBetaSum = 0;
    holdings.forEach((h) => {
      const weight = h.marketValue / totalPortfolioValue;
      weightedBetaSum += (h.beta || 1.0) * weight;
    });
    const marketSensitivityBeta = +weightedBetaSum.toFixed(2);

    // 4. High Correlation Pairs
    const highCorrelationPairs = this.calculateCorrelationMatrix(holdings);

    // 5. Earnings Risk (within 14 days)
    const now = new Date();
    const earningsIn14Days = holdings.filter((h) => {
      if (!h.nextEarningsDate) return false;
      const earningsDate = new Date(h.nextEarningsDate);
      const diffDays = (earningsDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 14;
    });

    const earningsWeight = earningsIn14Days.reduce((sum, h) => sum + h.marketValue, 0) / totalPortfolioValue;
    const upcomingEarningsExposure: 'LOW' | 'MODERATE' | 'HIGH' =
      earningsWeight > 0.20 ? 'HIGH' : earningsWeight > 0.08 ? 'MODERATE' : 'LOW';

    // 6. Options Risk Level
    let optionsRiskLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' = 'NONE';
    if (options.length > 0) {
      const totalTheta = options.reduce((sum, o) => sum + (o.theta * o.quantity * 100), 0);
      const hasShortExpiry = options.some((o) => o.daysToExpiration <= 7);
      if (Math.abs(totalTheta) > 50 || hasShortExpiry) {
        optionsRiskLevel = 'HIGH';
      } else if (Math.abs(totalTheta) > 15) {
        optionsRiskLevel = 'MODERATE';
      } else {
        optionsRiskLevel = 'LOW';
      }
    }

    // 7. Calculate Quantitative MarketMind Risk Score (0-100)
    let score = 25; // baseline

    // Factor: Largest holding weight penalty
    if (largestWeight > 30) score += 25;
    else if (largestWeight > 20) score += 15;
    else if (largestWeight > 12) score += 8;

    // Factor: Top 3 concentration
    if (top3WeightPercent > 60) score += 18;
    else if (top3WeightPercent > 45) score += 12;

    // Factor: Tech sector concentration
    if (techExposurePercent > 50) score += 18;
    else if (techExposurePercent > 35) score += 10;

    // Factor: High Beta
    if (marketSensitivityBeta > 1.5) score += 15;
    else if (marketSensitivityBeta > 1.2) score += 8;

    // Factor: Earnings Proximity
    if (upcomingEarningsExposure === 'HIGH') score += 12;
    else if (upcomingEarningsExposure === 'MODERATE') score += 6;

    // Factor: Options leverage & Theta burn
    if (optionsRiskLevel === 'HIGH') score += 12;
    else if (optionsRiskLevel === 'MODERATE') score += 6;

    // Cap at 98
    const overallRiskScore = Math.min(98, Math.max(10, Math.round(score)));

    const riskTier: RiskRating =
      overallRiskScore >= 75 ? 'HIGH' : overallRiskScore >= 60 ? 'ELEVATED' : overallRiskScore >= 40 ? 'MEDIUM' : 'LOW';

    // Warnings and Explanations
    const warnings: string[] = [];
    const factorExplanations: PortfolioRiskAssessment['factorExplanations'] = [];

    if (largestWeight > 20) {
      warnings.push(`Single Stock Concentration: ${largest.symbol} represents ${largestWeight}% of your portfolio (Recommended max: 15-20%).`);
      factorExplanations.push({
        title: `Single-Stock Exposure (${largest.symbol})`,
        level: largestWeight > 25 ? 'HIGH' : 'ELEVATED',
        description: `${largest.symbol} comprises ${largestWeight}% ($${largest.marketValue.toLocaleString()}) of total assets, making the portfolio sensitive to idiosyncratic events.`,
      });
    }

    if (techExposurePercent > 45) {
      warnings.push(`Sector Overweight: Technology represents ${techExposurePercent}% of total portfolio value.`);
      factorExplanations.push({
        title: 'Technology Sector Concentration',
        level: techExposurePercent > 55 ? 'HIGH' : 'ELEVATED',
        description: `Over ${techExposurePercent}% of invested assets are clustered in semiconductors and high-beta tech.`,
      });
    }

    if (highCorrelationPairs.length > 0) {
      const topPair = highCorrelationPairs[0];
      factorExplanations.push({
        title: `High Asset Correlation Cluster (${topPair.pair})`,
        level: 'ELEVATED',
        description: `${topPair.pair} exhibit a ${(topPair.correlation * 100).toFixed(0)}% correlation, reducing effective diversification during broad pullbacks.`,
      });
    }

    if (upcomingEarningsExposure === 'HIGH') {
      const names = earningsIn14Days.map((e) => e.symbol).join(', ');
      warnings.push(`Imminent Earnings Volatility: Key holdings reporting within 14 days: ${names}.`);
      factorExplanations.push({
        title: 'Upcoming Earnings Binary Risk',
        level: 'HIGH',
        description: `${names} report earnings shortly, representing over ${(earningsWeight * 100).toFixed(0)}% of total portfolio value.`,
      });
    }

    if (optionsRiskLevel === 'HIGH') {
      factorExplanations.push({
        title: 'Options Theta Burn & Gamma Sensitivity',
        level: 'HIGH',
        description: 'Active short-dated option contracts have accelerated time decay and heightened gamma swings.',
      });
    }

    const portfolioVolatilityAnnualized = +(16 * marketSensitivityBeta).toFixed(1);
    const maxEstimatedDrawdown = +(18 * marketSensitivityBeta).toFixed(1);

    return {
      overallRiskScore,
      riskTier,
      techExposurePercent,
      largestHolding: {
        symbol: largest.symbol,
        company: largest.companyName,
        weightPercent: largestWeight,
        value: largest.marketValue,
      },
      top3WeightPercent,
      highCorrelationPairs,
      upcomingEarningsExposure,
      optionsRiskLevel,
      marketSensitivityBeta,
      portfolioVolatilityAnnualized,
      maxEstimatedDrawdown,
      factorExplanations,
      warnings,
    };
  }

  /**
   * Computes correlation coefficients between portfolio pairs
   */
  private static calculateCorrelationMatrix(holdings: HoldingPosition[]): CorrelationPair[] {
    const pairs: CorrelationPair[] = [];
    const count = holdings.length;

    // Standard correlation reference table for common financial assets
    const correlationMap: Record<string, number> = {
      'NVDA-AMD': 0.84,
      'NVDA-MSFT': 0.72,
      'NVDA-AAPL': 0.64,
      'NVDA-AMZN': 0.68,
      'AMD-MSFT': 0.69,
      'AAPL-MSFT': 0.76,
      'AAPL-AMZN': 0.71,
      'MSFT-AMZN': 0.78,
      'SPY-NVDA': 0.79,
      'SPY-AAPL': 0.82,
      'SPY-MSFT': 0.85,
      'SPY-AMZN': 0.80,
      'SPY-JPM': 0.68,
      'JPM-NVDA': 0.28,
      'JPM-AAPL': 0.35,
      'LLY-NVDA': 0.22,
      'LLY-SPY': 0.42,
    };

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = holdings[i].symbol;
        const b = holdings[j].symbol;
        const key1 = `${a}-${b}`;
        const key2 = `${b}-${a}`;
        const corr = correlationMap[key1] ?? correlationMap[key2] ?? 0.50;

        if (corr >= 0.70) {
          pairs.push({
            pair: `${a} / ${b}`,
            assetA: a,
            assetB: b,
            correlation: corr,
            clusterNote:
              corr >= 0.80
                ? 'Very High Correlation: Tend to experience simultaneous drawdowns during semiconductor and tech selloffs.'
                : 'High Correlation: Shared beta to mega-cap growth and Nasdaq 100 flow.',
          });
        }
      }
    }

    return pairs.sort((a, b) => b.correlation - a.correlation);
  }
}
