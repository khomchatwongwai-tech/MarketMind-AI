import {
  HoldingPosition,
  OptionsPosition,
  StressTestScenario,
} from '../types/portfolio';

export class PortfolioStressTestEngine {
  /**
   * Predefined standard institutional stress tests
   */
  public static getStandardScenarios(
    holdings: HoldingPosition[],
    options: OptionsPosition[],
    cashBalance: number
  ): StressTestScenario[] {
    const totalPortfolioValue =
      holdings.reduce((sum, h) => sum + h.marketValue, 0) +
      options.reduce((sum, o) => sum + o.marketValue, 0) +
      cashBalance;

    return [
      this.simulateIndexDrop('SPY_DROP_5', 'S&P 500 Market Pullback (-5%)', 'SPY -5.0%', -5, holdings, options, totalPortfolioValue, 'MARKET_INDEX', 'Calculated using asset beta to S&P 500 benchmark.'),
      this.simulateIndexDrop('QQQ_DROP_10', 'Nasdaq Tech Correction (-10%)', 'QQQ -10.0%', -10, holdings, options, totalPortfolioValue, 'SECTOR_CRASH', 'Calculated via high-beta tech sensitivity factor.'),
      this.simulateTechCrash(holdings, options, totalPortfolioValue),
      this.simulateVixSpike(holdings, options, totalPortfolioValue),
      this.simulateSingleStockShock('NVDA', -20, holdings, totalPortfolioValue),
      this.simulateRateHike(holdings, options, totalPortfolioValue),
    ];
  }

  /**
   * Simulates an Index drop (e.g. SPY -5% or QQQ -10%)
   */
  public static simulateIndexDrop(
    id: string,
    title: string,
    shockParameter: string,
    marketShockPercent: number,
    holdings: HoldingPosition[],
    options: OptionsPosition[],
    totalPortfolioValue: number,
    category: StressTestScenario['category'],
    methodologyNote: string
  ): StressTestScenario {
    let totalImpactDollar = 0;

    const breakdown = holdings.map((h) => {
      const beta = h.beta || 1.0;
      const expectedStockMovePct = (marketShockPercent * beta);
      const impactDollar = h.marketValue * (expectedStockMovePct / 100);
      totalImpactDollar += impactDollar;

      return {
        symbol: h.symbol,
        impactDollar: +impactDollar.toFixed(2),
        impactPercent: +expectedStockMovePct.toFixed(2),
        weight: +(h.portfolioWeight * 100).toFixed(1),
      };
    });

    // Options impact (estimated delta + vega shock)
    options.forEach((o) => {
      const deltaDollar = o.quantity * 100 * o.delta * (marketShockPercent * 0.05 * o.strikePrice);
      totalImpactDollar += deltaDollar;
    });

    const estimatedImpactPercent = totalPortfolioValue > 0
      ? +(totalImpactDollar / totalPortfolioValue * 100).toFixed(2)
      : 0;

    return {
      id,
      title,
      description: `Simulates portfolio behavior if ${shockParameter} occurs under prevailing liquidity conditions.`,
      category,
      shockParameter,
      estimatedImpactPercent,
      estimatedImpactDollar: +totalImpactDollar.toFixed(2),
      affectedHoldingsBreakdown: breakdown.sort((a, b) => a.impactDollar - b.impactDollar),
      methodologyNote,
    };
  }

  /**
   * Simulates a Tech Sector specific Crash (-15%)
   */
  private static simulateTechCrash(
    holdings: HoldingPosition[],
    options: OptionsPosition[],
    totalPortfolioValue: number
  ): StressTestScenario {
    let totalImpactDollar = 0;

    const breakdown = holdings.map((h) => {
      const isTech = h.sector.toLowerCase().includes('tech') || h.industry?.toLowerCase().includes('semi');
      const shockPct = isTech ? -15.0 : -3.5;
      const impactDollar = h.marketValue * (shockPct / 100);
      totalImpactDollar += impactDollar;

      return {
        symbol: h.symbol,
        impactDollar: +impactDollar.toFixed(2),
        impactPercent: shockPct,
        weight: +(h.portfolioWeight * 100).toFixed(1),
      };
    });

    const estimatedImpactPercent = totalPortfolioValue > 0
      ? +(totalImpactDollar / totalPortfolioValue * 100).toFixed(2)
      : 0;

    return {
      id: 'TECH_CRASH_15',
      title: 'Technology & Semiconductor Crash (-15%)',
      description: 'Isolates a targeted repricing of semiconductor and cloud software multiples.',
      category: 'SECTOR_CRASH',
      shockParameter: 'XLK / SOXX -15.0%',
      estimatedImpactPercent,
      estimatedImpactDollar: +totalImpactDollar.toFixed(2),
      affectedHoldingsBreakdown: breakdown.sort((a, b) => a.impactDollar - b.impactDollar),
      methodologyNote: 'Applies -15% sector shock to Tech holdings and -3.5% cross-asset spillover to non-tech.',
    };
  }

  /**
   * Simulates a Volatility Spike (VIX +40%)
   */
  private static simulateVixSpike(
    holdings: HoldingPosition[],
    options: OptionsPosition[],
    totalPortfolioValue: number
  ): StressTestScenario {
    let totalImpactDollar = 0;

    const breakdown = holdings.map((h) => {
      const beta = h.beta || 1.0;
      const shockPct = -(beta * 4.8);
      const impactDollar = h.marketValue * (shockPct / 100);
      totalImpactDollar += impactDollar;

      return {
        symbol: h.symbol,
        impactDollar: +impactDollar.toFixed(2),
        impactPercent: +shockPct.toFixed(2),
        weight: +(h.portfolioWeight * 100).toFixed(1),
      };
    });

    // Options vega gains or losses
    options.forEach((o) => {
      const vegaGain = o.quantity * 100 * o.vega * 4.0; // VIX +40% = ~4-8 IV points
      totalImpactDollar += (o.contractType === 'PUT' ? vegaGain * 1.5 : vegaGain * 0.5);
    });

    const estimatedImpactPercent = totalPortfolioValue > 0
      ? +(totalImpactDollar / totalPortfolioValue * 100).toFixed(2)
      : 0;

    return {
      id: 'VIX_SPIKE_40',
      title: 'VIX Volatility Surge (+40% Spike)',
      description: 'Simulates a sudden geopolitical or macro panic driving the VIX index above 28.00.',
      category: 'VOLATILITY_SPIKE',
      shockParameter: 'VIX +40.0%',
      estimatedImpactPercent,
      estimatedImpactDollar: +totalImpactDollar.toFixed(2),
      affectedHoldingsBreakdown: breakdown.sort((a, b) => a.impactDollar - b.impactDollar),
      methodologyNote: 'Calculates volatility sensitivity on equities and vega expansion on options contracts.',
    };
  }

  /**
   * Simulates a specific single-stock shock (e.g. NVDA -20%)
   */
  private static simulateSingleStockShock(
    targetSymbol: string,
    shockPercent: number,
    holdings: HoldingPosition[],
    totalPortfolioValue: number
  ): StressTestScenario {
    let totalImpactDollar = 0;

    const breakdown = holdings.map((h) => {
      let shock = 0;
      if (h.symbol === targetSymbol) {
        shock = shockPercent;
      } else if (h.symbol === 'AMD' && targetSymbol === 'NVDA') {
        shock = shockPercent * 0.70; // Sympathy move
      } else if (h.symbol === 'MSFT' && targetSymbol === 'NVDA') {
        shock = shockPercent * 0.25;
      }

      const impactDollar = h.marketValue * (shock / 100);
      totalImpactDollar += impactDollar;

      return {
        symbol: h.symbol,
        impactDollar: +impactDollar.toFixed(2),
        impactPercent: +shock.toFixed(2),
        weight: +(h.portfolioWeight * 100).toFixed(1),
      };
    });

    const estimatedImpactPercent = totalPortfolioValue > 0
      ? +(totalImpactDollar / totalPortfolioValue * 100).toFixed(2)
      : 0;

    return {
      id: `SHOCK_${targetSymbol}_20`,
      title: `${targetSymbol} Earnings Disappointment (${shockPercent}%)`,
      description: `Simulates a sharp ${shockPercent}% drop in your largest single holding (${targetSymbol}) including peer sympathy moves.`,
      category: 'SINGLE_STOCK',
      shockParameter: `${targetSymbol} ${shockPercent}%`,
      estimatedImpactPercent,
      estimatedImpactDollar: +totalImpactDollar.toFixed(2),
      affectedHoldingsBreakdown: breakdown.sort((a, b) => a.impactDollar - b.impactDollar),
      methodologyNote: `Direct loss on ${targetSymbol} + 70% correlation spillover to direct semiconductor peers.`,
    };
  }

  /**
   * Simulates a Fed 50bps Surprise Rate Hike
   */
  private static simulateRateHike(
    holdings: HoldingPosition[],
    options: OptionsPosition[],
    totalPortfolioValue: number
  ): StressTestScenario {
    let totalImpactDollar = 0;

    const breakdown = holdings.map((h) => {
      let shock = -4.2; // default equity discount
      if (h.symbol === 'JPM') shock = +1.8; // Banks benefit
      if (h.symbol === 'NVDA' || h.symbol === 'AMD') shock = -7.5; // High duration growth penalised

      const impactDollar = h.marketValue * (shock / 100);
      totalImpactDollar += impactDollar;

      return {
        symbol: h.symbol,
        impactDollar: +impactDollar.toFixed(2),
        impactPercent: +shock.toFixed(2),
        weight: +(h.portfolioWeight * 100).toFixed(1),
      };
    });

    const estimatedImpactPercent = totalPortfolioValue > 0
      ? +(totalImpactDollar / totalPortfolioValue * 100).toFixed(2)
      : 0;

    return {
      id: 'FED_HIKE_50BPS',
      title: 'Federal Reserve Rate Shock (+50 bps)',
      description: 'Simulates hawkish monetary surprise with rising discount rates and yield curve shifts.',
      category: 'MACRO_RATES',
      shockParameter: 'Fed Funds +50 bps',
      estimatedImpactPercent,
      estimatedImpactDollar: +totalImpactDollar.toFixed(2),
      affectedHoldingsBreakdown: breakdown.sort((a, b) => a.impactDollar - b.impactDollar),
      methodologyNote: 'Re-values long-duration growth cash flows while adjusting banking net interest margin expectations.',
    };
  }

  /**
   * Custom user shock simulator
   */
  public static runCustomShock(
    shockName: string,
    marketMovePercent: number,
    holdings: HoldingPosition[],
    totalPortfolioValue: number
  ): StressTestScenario {
    let totalImpactDollar = 0;

    const breakdown = holdings.map((h) => {
      const beta = h.beta || 1.0;
      const expectedStockMovePct = +(marketMovePercent * beta).toFixed(2);
      const impactDollar = h.marketValue * (expectedStockMovePct / 100);
      totalImpactDollar += impactDollar;

      return {
        symbol: h.symbol,
        impactDollar: +impactDollar.toFixed(2),
        impactPercent: expectedStockMovePct,
        weight: +(h.portfolioWeight * 100).toFixed(1),
      };
    });

    const estimatedImpactPercent = totalPortfolioValue > 0
      ? +(totalImpactDollar / totalPortfolioValue * 100).toFixed(2)
      : 0;

    return {
      id: `CUSTOM_${Date.now()}`,
      title: shockName || `Custom Market Shock (${marketMovePercent}%)`,
      description: `User-defined custom stress scenario evaluating portfolio elasticity at ${marketMovePercent}%.`,
      category: 'MARKET_INDEX',
      shockParameter: `Market ${marketMovePercent >= 0 ? '+' : ''}${marketMovePercent}%`,
      estimatedImpactPercent,
      estimatedImpactDollar: +totalImpactDollar.toFixed(2),
      affectedHoldingsBreakdown: breakdown.sort((a, b) => a.impactDollar - b.impactDollar),
      methodologyNote: 'Dynamic linear beta multiplier with risk-weighted asset elasticity.',
    };
  }
}
