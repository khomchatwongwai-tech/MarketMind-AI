/**
 * MarketMind AI - Deterministic Portfolio Risk & Analytics Engine
 * Computes exact mathematical risk, concentration, beta, and allocation metrics BEFORE Gemini reasoning.
 * CRITICAL RULE: Never fabricate or estimate portfolio numbers. All calculations must be 100% deterministic.
 */

import { HoldingPosition } from '../../types/portfolio';

export interface PortfolioRiskMetrics {
  totalPortfolioValue: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number;
  cashBalance: number;
  cashAllocationPercent: number;
  largestPosition: {
    symbol: string;
    companyName: string;
    marketValue: number;
    weightPercent: number;
  } | null;
  top3ConcentrationPercent: number;
  top3Holdings: Array<{ symbol: string; weightPercent: number }>;
  sectorAllocations: Array<{ sector: string; marketValue: number; weightPercent: number }>;
  weightedBeta: number | null;
  diversificationScore: number; // 0-100 (100 = highly diversified, 0 = single concentrated asset)
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  identifiedRiskFactors: string[];
  earningsExposureCount: number;
  holdingsCount: number;
}

export class PortfolioRiskEngine {
  /**
   * Calculate comprehensive deterministic risk metrics for a user's portfolio
   */
  public static computeRiskMetrics(
    holdings: HoldingPosition[] = [],
    cashBalance = 0
  ): PortfolioRiskMetrics {
    if (!holdings || holdings.length === 0) {
      return {
        totalPortfolioValue: Math.max(0, cashBalance),
        totalCostBasis: 0,
        totalUnrealizedPnl: 0,
        totalUnrealizedPnlPercent: 0,
        cashBalance: Math.max(0, cashBalance),
        cashAllocationPercent: 100,
        largestPosition: null,
        top3ConcentrationPercent: 0,
        top3Holdings: [],
        sectorAllocations: [],
        weightedBeta: null,
        diversificationScore: cashBalance > 0 ? 50 : 0,
        riskLevel: 'LOW',
        identifiedRiskFactors: ['Portfolio is 100% in cash or has no active equity holdings.'],
        earningsExposureCount: 0,
        holdingsCount: 0,
      };
    }

    let totalHoldingsValue = 0;
    let totalCostBasis = 0;
    let totalWeightedBeta = 0;
    let betaEligibleWeight = 0;
    let earningsCount = 0;

    const sectorMap = new Map<string, number>();

    // Calculate holding values
    const enriched = holdings.map((h) => {
      const value = h.marketValue || (h.quantity * (h.currentPrice || h.averageCost));
      const cost = h.costBasis || (h.quantity * h.averageCost);
      totalHoldingsValue += value;
      totalCostBasis += cost;

      // Sector aggregation
      const sector = h.sector || 'Unassigned';
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);

      if (typeof h.beta === 'number' && !isNaN(h.beta) && h.beta > 0) {
        totalWeightedBeta += h.beta * value;
        betaEligibleWeight += value;
      }

      if (h.nextEarningsDate) {
        earningsCount++;
      }

      return {
        ...h,
        calculatedValue: value,
      };
    });

    const totalPortfolioValue = totalHoldingsValue + Math.max(0, cashBalance);
    const totalUnrealizedPnl = totalHoldingsValue - totalCostBasis;
    const totalUnrealizedPnlPercent = totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;
    const cashAllocationPercent = totalPortfolioValue > 0 ? (cashBalance / totalPortfolioValue) * 100 : 0;

    // Sort holdings by value DESC
    const sorted = [...enriched].sort((a, b) => b.calculatedValue - a.calculatedValue);

    // Largest position
    const top1 = sorted[0];
    const largestWeight = totalPortfolioValue > 0 ? (top1.calculatedValue / totalPortfolioValue) * 100 : 0;
    const largestPosition = top1
      ? {
          symbol: top1.symbol,
          companyName: top1.companyName || top1.symbol,
          marketValue: top1.calculatedValue,
          weightPercent: Number(largestWeight.toFixed(2)),
        }
      : null;

    // Top 3 Concentration
    const top3 = sorted.slice(0, 3);
    const top3Val = top3.reduce((acc, curr) => acc + curr.calculatedValue, 0);
    const top3ConcentrationPercent = totalPortfolioValue > 0 ? Number(((top3Val / totalPortfolioValue) * 100).toFixed(2)) : 0;
    const top3Holdings = top3.map((h) => ({
      symbol: h.symbol,
      weightPercent: totalPortfolioValue > 0 ? Number(((h.calculatedValue / totalPortfolioValue) * 100).toFixed(2)) : 0,
    }));

    // Sector Allocations
    const sectorAllocations: Array<{ sector: string; marketValue: number; weightPercent: number }> = [];
    for (const [sector, value] of sectorMap.entries()) {
      const weightPercent = totalPortfolioValue > 0 ? Number(((value / totalPortfolioValue) * 100).toFixed(2)) : 0;
      sectorAllocations.push({
        sector,
        marketValue: value,
        weightPercent,
      });
    }
    sectorAllocations.sort((a, b) => b.weightPercent - a.weightPercent);

    // Weighted Beta
    const weightedBeta = betaEligibleWeight > 0 ? Number((totalWeightedBeta / betaEligibleWeight).toFixed(2)) : null;

    // Calculate Diversification Score (0-100)
    // Penalize: High top-1 (>25%), High top-3 (>60%), High single sector (>45%), low total holdings (<5)
    let divScore = 100;
    if (largestWeight > 30) divScore -= (largestWeight - 30) * 1.5;
    if (top3ConcentrationPercent > 60) divScore -= (top3ConcentrationPercent - 60) * 0.8;
    if (sectorAllocations[0] && sectorAllocations[0].weightPercent > 40) {
      divScore -= (sectorAllocations[0].weightPercent - 40) * 0.7;
    }
    if (holdings.length < 5) divScore -= (5 - holdings.length) * 6;
    divScore = Math.max(10, Math.min(100, Math.round(divScore)));

    // Determine Risk Level & Risk Factors
    const riskFactors: string[] = [];
    if (largestWeight >= 35) {
      riskFactors.push(`High single-stock concentration: ${top1.symbol} represents ${largestWeight.toFixed(1)}% of total portfolio value.`);
    }
    if (top3ConcentrationPercent >= 65) {
      riskFactors.push(`Top 3 positions represent ${top3ConcentrationPercent.toFixed(1)}% of total assets.`);
    }
    if (sectorAllocations[0] && sectorAllocations[0].weightPercent >= 45) {
      riskFactors.push(`Sector overweight: ${sectorAllocations[0].sector} comprises ${sectorAllocations[0].weightPercent.toFixed(1)}% of portfolio allocation.`);
    }
    if (weightedBeta && weightedBeta > 1.35) {
      riskFactors.push(`Elevated market volatility sensitivity: Portfolio beta is ${weightedBeta}x relative to S&P 500.`);
    }
    if (holdings.length <= 3) {
      riskFactors.push(`Limited holdings count (${holdings.length}): Portfolio lacks broad asset diversification.`);
    }

    let riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' = 'MODERATE';
    if (riskFactors.length === 0 && divScore >= 75) {
      riskLevel = 'LOW';
    } else if (riskFactors.length >= 2 || largestWeight >= 45 || top3ConcentrationPercent >= 75) {
      riskLevel = 'HIGH';
    } else if (riskFactors.length === 1 || largestWeight >= 30) {
      riskLevel = 'ELEVATED';
    }

    return {
      totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
      totalCostBasis: Number(totalCostBasis.toFixed(2)),
      totalUnrealizedPnl: Number(totalUnrealizedPnl.toFixed(2)),
      totalUnrealizedPnlPercent: Number(totalUnrealizedPnlPercent.toFixed(2)),
      cashBalance: Number(cashBalance.toFixed(2)),
      cashAllocationPercent: Number(cashAllocationPercent.toFixed(2)),
      largestPosition,
      top3ConcentrationPercent,
      top3Holdings,
      sectorAllocations,
      weightedBeta,
      diversificationScore: divScore,
      riskLevel,
      identifiedRiskFactors: riskFactors.length > 0 ? riskFactors : ['Portfolio risk is balanced across evaluated metrics.'],
      earningsExposureCount: earningsCount,
      holdingsCount: holdings.length,
    };
  }
}
