import {
  OptionContract,
  OptionsRiskGuardianScore,
  RiskGuardianTier,
  OptionsOrderLeg,
} from '../../types/optionsTrader';

export interface EvaluateOptionsRiskParams {
  contract: OptionContract;
  quantity?: number;
  portfolioValue?: number;
  hasEarningsBeforeExp?: boolean;
  hasMacroEventBeforeExp?: boolean;
}

export class OptionsRiskGuardianEngine {
  /**
   * Calculate comprehensive Options Risk Guardian™ Score (0 - 100)
   */
  public evaluateContractRisk(params: EvaluateOptionsRiskParams): OptionsRiskGuardianScore {
    const {
      contract,
      quantity = 1,
      portfolioValue,
      hasEarningsBeforeExp = false,
      hasMacroEventBeforeExp = false,
    } = params;

    let score = 20; // Baseline base risk
    const factors: {
      name: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      scoreContribution: number;
    }[] = [];

    // 1. Expiration / DTE Factor
    if (contract.dte === 0) {
      score += 35;
      factors.push({
        name: '0DTE Same-Day Expiration',
        description: 'Contract expires today. Rapid exponential theta decay, extreme gamma sensitivity, and risk of 100% loss.',
        severity: 'critical',
        scoreContribution: 35,
      });
    } else if (contract.dte <= 3) {
      score += 20;
      factors.push({
        name: 'Short Expiration (<3 DTE)',
        description: 'High theta decay acceleration approaching expiration weekend.',
        severity: 'high',
        scoreContribution: 20,
      });
    } else if (contract.dte <= 14) {
      score += 10;
      factors.push({
        name: 'Near-Term Expiration (4-14 DTE)',
        description: 'Moderate time value decay curve.',
        severity: 'medium',
        scoreContribution: 10,
      });
    } else {
      factors.push({
        name: 'Comfortable Time Horizon (>14 DTE)',
        description: 'Lower immediate daily time decay rate.',
        severity: 'low',
        scoreContribution: 0,
      });
    }

    // 2. Implied Volatility (IV) Factor
    if (contract.iv > 0.60) {
      score += 20;
      factors.push({
        name: 'Extreme Implied Volatility (IV > 60%)',
        description: 'Option premium carries significant volatility pricing risk (potential IV crush).',
        severity: 'high',
        scoreContribution: 20,
      });
    } else if (contract.iv > 0.40) {
      score += 10;
      factors.push({
        name: 'Elevated Volatility (IV 40-60%)',
        description: 'High extrinsic value pricing requiring substantial underlying movement.',
        severity: 'medium',
        scoreContribution: 10,
      });
    }

    // 3. Liquidity & Spread Factor
    const spread = contract.ask - contract.bid;
    const spreadPct = contract.mid > 0 ? (spread / contract.mid) * 100 : 10;

    if (spreadPct > 8.0 || contract.volume < 100) {
      score += 15;
      factors.push({
        name: 'Wide Bid/Ask Spread & Low Volume',
        description: `Spread is ${spreadPct.toFixed(1)}% of premium with low volume (${contract.volume} contracts). Slippage risk on entry/exit.`,
        severity: 'high',
        scoreContribution: 15,
      });
    } else if (spreadPct > 4.0) {
      score += 5;
      factors.push({
        name: 'Moderate Bid/Ask Spread',
        description: `Spread is ${spreadPct.toFixed(1)}% of premium. Use limit orders to avoid market execution slippage.`,
        severity: 'medium',
        scoreContribution: 5,
      });
    } else {
      factors.push({
        name: 'Tight Institutional Liquidity',
        description: `Spread is tight (${spreadPct.toFixed(1)}%) with active volume (${contract.volume.toLocaleString()}).`,
        severity: 'low',
        scoreContribution: 0,
      });
    }

    // 4. Moneyness / OTM Risk
    if (contract.outOfTheMoney) {
      const distPct = Math.abs((contract.strike - contract.breakeven) / contract.strike) * 100;
      if (contract.delta < 0.20 && contract.delta > -0.20) {
        score += 10;
        factors.push({
          name: 'Deep Out-Of-The-Money (Low Delta)',
          description: `Contract has delta of ${(contract.delta * 100).toFixed(1)}, meaning low probability of expiring in-the-money without large catalyst.`,
          severity: 'medium',
          scoreContribution: 10,
        });
      }
    }

    // 5. Catalyst Events Proximity
    if (hasEarningsBeforeExp) {
      score += 15;
      factors.push({
        name: 'Earnings Announcement Before Expiration',
        description: 'Underlying reports earnings before contract expiration. Extreme binary gap risk and post-earnings IV crush.',
        severity: 'high',
        scoreContribution: 15,
      });
    }

    if (hasMacroEventBeforeExp) {
      score += 10;
      factors.push({
        name: 'Major Macro Event (FOMC / CPI)',
        description: 'Federal Reserve rate decision or CPI release scheduled before expiration.',
        severity: 'medium',
        scoreContribution: 10,
      });
    }

    // Bound score strictly between 0 and 100
    const finalScore = Math.min(100, Math.max(5, score));

    // Determine Tier
    let tier: RiskGuardianTier = 'LOW';
    if (finalScore >= 80) tier = 'VERY_HIGH';
    else if (finalScore >= 60) tier = 'ELEVATED';
    else if (finalScore >= 40) tier = 'MODERATE';
    else tier = 'LOW';

    // Position Size vs Portfolio Concentration Warning
    let positionSizeWarning: OptionsRiskGuardianScore['positionSizeWarning'] | undefined;
    const contractCost = contract.ask * 100 * quantity;

    if (portfolioValue && portfolioValue > 0) {
      const concPct = Number(((contractCost / portfolioValue) * 100).toFixed(1));
      const isHigh = concPct >= 5.0;

      positionSizeWarning = {
        estimatedCost: contractCost,
        portfolioValue,
        portfolioConcentrationPercent: concPct,
        isHighConcentration: isHigh,
        recommendation: isHigh
          ? `Allocating ${concPct}% ($${contractCost.toLocaleString()}) of total portfolio ($${portfolioValue.toLocaleString()}) to single options trade exceeds the standard 2-5% risk threshold.`
          : `Position represents a prudent ${concPct}% allocation of connected portfolio.`,
      };

      if (concPct > 10.0) {
        score += 10;
      }
    }

    let warningMessage: string | undefined;
    if (contract.dte === 0) {
      warningMessage = 'HIGH-RISK 0DTE OPTION: Rapid theta decay and total loss risk if not closed before market bell.';
    } else if (tier === 'VERY_HIGH') {
      warningMessage = 'CRITICAL RISK PROFILE: Elevated volatility, approaching catalysts, or short expiration window.';
    }

    return {
      score: finalScore,
      tier,
      factors,
      warningMessage,
      positionSizeWarning,
    };
  }

  /**
   * Evaluate multi-leg strategy risk
   */
  public evaluateStrategyRisk(legs: OptionsOrderLeg[], portfolioValue?: number): OptionsRiskGuardianScore {
    if (!legs.length) {
      return {
        score: 30,
        tier: 'LOW',
        factors: [],
      };
    }

    // Aggregate primary leg
    const primary = legs[0];
    const is0DTE = primary.expiration === new Date().toISOString().split('T')[0];
    let score = is0DTE ? 75 : 45;

    const hasShortUncovered = legs.some(
      (l) => (l.action === 'SELL_TO_OPEN' || l.action === 'SELL_TO_CLOSE') && legs.length === 1
    );

    if (hasShortUncovered) {
      score += 30;
    }

    const finalScore = Math.min(100, score);
    const tier: RiskGuardianTier =
      finalScore >= 80 ? 'VERY_HIGH' : finalScore >= 60 ? 'ELEVATED' : finalScore >= 40 ? 'MODERATE' : 'LOW';

    return {
      score: finalScore,
      tier,
      factors: [
        {
          name: `${legs.length}-Leg Options Structure`,
          description: `Defined risk structure across ${legs.map((l) => `${l.action} ${l.strike}${l.type[0]}`).join(', ')}`,
          severity: is0DTE ? 'high' : 'low',
          scoreContribution: is0DTE ? 30 : 10,
        },
      ],
    };
  }
}

export const optionsRiskGuardianEngine = new OptionsRiskGuardianEngine();
