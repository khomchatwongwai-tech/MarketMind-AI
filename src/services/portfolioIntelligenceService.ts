import {
  HoldingPosition,
  OptionsPosition,
  PortfolioNewsItem,
  EarningsRiskEvent,
  DividendSummary,
  SmartPortfolioAlertRule,
  DailyPortfolioBrief,
  EndOfDayPortfolioBrief,
} from '../types/portfolio';

const LOCAL_STORAGE_KEY_ALERTS = 'marketmind_portfolio_alerts_rules_v1';

export class PortfolioIntelligenceService {
  /**
   * Generates targeted, impact-ranked news specifically for the user's active holdings
   */
  public static getPortfolioNews(holdings: HoldingPosition[]): PortfolioNewsItem[] {
    const symbols = new Set(holdings.map((h) => h.symbol));

    const allPortfolioNews: PortfolioNewsItem[] = [
      {
        id: 'pnews-1',
        title: 'NVIDIA Expands Custom AI Silicon Partnerships Across Top Enterprise Cloud Providers',
        summary: 'New enterprise multi-year agreements reinforce datacenter revenue run-rate heading into fiscal Q3 earnings.',
        source: 'Bloomberg Financial Markets',
        publishedAt: '24m ago',
        relatedTickers: ['NVDA', 'MSFT', 'AMZN'],
        impactLevel: 'HIGH',
        portfolioExposurePercent: 44.2,
        sentiment: 'BULLISH',
        keyTakeaway: 'Supports elevated revenue multiples for NVDA and confirms strong datacenter capex from MSFT and AMZN.',
      },
      {
        id: 'pnews-2',
        title: 'Semiconductor Capital Equipment Bookings Signal Cyclical Normalization',
        summary: 'Industry survey indicates wafer fab utilization steady at 87% with continued lead time stabilization.',
        source: 'Reuters Technology',
        publishedAt: '1h ago',
        relatedTickers: ['NVDA', 'AMD'],
        impactLevel: 'MEDIUM',
        portfolioExposurePercent: 31.2,
        sentiment: 'NEUTRAL',
        keyTakeaway: 'Indicates steady volume demand but moderating upside revenue acceleration surprises.',
      },
      {
        id: 'pnews-3',
        title: 'Apple Services Revenue Run-Rate Hits New Record on App Store & Cloud Subscriptions',
        summary: 'High-margin services segment continues to expand as a percentage of total gross margin mix.',
        source: 'Wall Street Journal',
        publishedAt: '2h ago',
        relatedTickers: ['AAPL'],
        impactLevel: 'HIGH',
        portfolioExposurePercent: 17.9,
        sentiment: 'BULLISH',
        keyTakeaway: 'Improves defensive earnings resilience against hardware replacement cycle volatility.',
      },
      {
        id: 'pnews-4',
        title: 'JPMorgan Chase Boosts Commercial Lending Reserves Amid Stable Credit Metrics',
        summary: 'CEO Jamie Dimon highlights robust corporate balance sheets and resilient consumer spending trends.',
        source: 'Financial Times',
        publishedAt: '3h ago',
        relatedTickers: ['JPM'],
        impactLevel: 'LOW',
        portfolioExposurePercent: 6.7,
        sentiment: 'BULLISH',
        keyTakeaway: 'Reinforces JPM as a stable high-yield defensive anchor in the portfolio.',
      },
      {
        id: 'pnews-5',
        title: 'Eli Lilly Phase 3 Weight-Loss and Cardiovascular Pipeline Data Exceeds Primary Endpoints',
        summary: 'Clinical trial demonstrates significant metabolic improvements with robust safety profile.',
        source: 'BioWorld / SEC Form 8-K',
        publishedAt: '4h ago',
        relatedTickers: ['LLY'],
        impactLevel: 'MEDIUM',
        portfolioExposurePercent: 5.7,
        sentiment: 'BULLISH',
        keyTakeaway: 'Expands addressable therapeutic market; provides non-correlated healthcare growth.',
      },
    ];

    // Filter to news that matches user's active holdings
    const relevant = allPortfolioNews.filter((item) =>
      item.relatedTickers.some((sym) => symbols.has(sym))
    );

    return relevant.length > 0 ? relevant : allPortfolioNews;
  }

  /**
   * Generates Earnings Risk Calendar for owned positions
   */
  public static getEarningsRiskEvents(holdings: HoldingPosition[]): EarningsRiskEvent[] {
    const events: EarningsRiskEvent[] = [];

    holdings.forEach((h) => {
      if (!h.nextEarningsDate) return;

      const dateStr = h.nextEarningsDate;
      const earningsDate = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.ceil((earningsDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      let timeframeCategory: EarningsRiskEvent['timeframeCategory'] = 'NEXT_WEEK';
      if (diffDays <= 1) timeframeCategory = 'TODAY';
      else if (diffDays <= 7) timeframeCategory = 'THIS_WEEK';

      const weightPct = +(h.portfolioWeight * 100).toFixed(1);
      const riskLevel: 'LOW' | 'MODERATE' | 'HIGH' =
        weightPct > 15 ? 'HIGH' : weightPct > 8 ? 'MODERATE' : 'LOW';

      events.push({
        symbol: h.symbol,
        companyName: h.companyName,
        earningsDate: dateStr,
        timeOfDay: 'AFTER_CLOSE',
        portfolioWeight: weightPct,
        portfolioValue: h.marketValue,
        impliedMovePercent: h.symbol === 'NVDA' ? 8.2 : h.symbol === 'AMD' ? 7.5 : 4.5,
        riskLevel,
        timeframeCategory,
        estimatedEPS: h.symbol === 'NVDA' ? 0.68 : h.symbol === 'AAPL' ? 1.54 : 4.12,
      });
    });

    return events.sort((a, b) => new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime());
  }

  /**
   * Computes Dividend Intelligence and Projected Income
   */
  public static getDividendSummary(holdings: HoldingPosition[]): DividendSummary {
    const dividendItems = holdings
      .filter((h) => (h.dividendYield || 0) > 0)
      .map((h) => {
        const yieldDecimal = (h.dividendYield || 0) / 100;
        const annualIncome = +(h.marketValue * yieldDecimal).toFixed(2);
        const dividendAmountPerShare = +(h.currentPrice * yieldDecimal / 4).toFixed(2);

        return {
          symbol: h.symbol,
          companyName: h.companyName,
          shares: h.quantity,
          dividendYield: h.dividendYield || 0,
          dividendAmountPerShare,
          exDividendDate: '2026-09-12',
          paymentDate: '2026-09-30',
          annualProjectedIncome: annualIncome,
          frequency: 'Quarterly' as const,
        };
      });

    const annualEstimatedIncome = +dividendItems.reduce((sum, item) => sum + item.annualProjectedIncome, 0).toFixed(2);
    const monthlyEstimatedIncome = +(annualEstimatedIncome / 12).toFixed(2);
    const totalEquitiesValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const averagePortfolioYield = totalEquitiesValue > 0
      ? +((annualEstimatedIncome / totalEquitiesValue) * 100).toFixed(2)
      : 0;

    const upcomingCalendar = [
      { month: 'Sep 2026', projectedPayout: +(monthlyEstimatedIncome * 1.2).toFixed(2), payers: ['JPM', 'SPY', 'AAPL'] },
      { month: 'Oct 2026', projectedPayout: +(monthlyEstimatedIncome * 0.8).toFixed(2), payers: ['LLY'] },
      { month: 'Nov 2026', projectedPayout: +(monthlyEstimatedIncome * 1.1).toFixed(2), payers: ['MSFT'] },
      { month: 'Dec 2026', projectedPayout: +(monthlyEstimatedIncome * 1.4).toFixed(2), payers: ['SPY', 'JPM', 'AAPL', 'NVDA'] },
    ];

    return {
      monthlyEstimatedIncome,
      annualEstimatedIncome,
      averagePortfolioYield,
      dividendItems,
      upcomingCalendar,
    };
  }

  /**
   * Smart Portfolio Alert Rules
   */
  public static getAlertRules(userId: string): SmartPortfolioAlertRule[] {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY_ALERTS}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load alert rules:', e);
    }

    // Default institutional smart rules
    const defaultRules: SmartPortfolioAlertRule[] = [
      {
        id: 'rule-pos-drop-5',
        userId,
        type: 'POSITION_DROP_5',
        title: 'Holding Intraday Drop > 5%',
        description: 'Instant notification if any connected stock falls 5% or more intraday.',
        thresholdValue: 5.0,
        isEnabled: true,
        triggeredCount: 2,
        lastTriggeredAt: '2 days ago',
      },
      {
        id: 'rule-port-drop-3',
        userId,
        type: 'PORTFOLIO_DROP_3',
        title: 'Total Portfolio Drawdown Alert (3%)',
        description: 'Alert if total unified portfolio value drops by 3% or more in a single session.',
        thresholdValue: 3.0,
        isEnabled: true,
        triggeredCount: 0,
      },
      {
        id: 'rule-conc-25',
        userId,
        type: 'CONCENTRATION_25',
        title: 'Single-Stock Overconcentration (>20%)',
        description: 'Warns when any single stock allocation exceeds 20% of your total liquid assets.',
        thresholdValue: 20.0,
        isEnabled: true,
        triggeredCount: 1,
        lastTriggeredAt: 'Active',
      },
      {
        id: 'rule-earn-near',
        userId,
        type: 'EARNINGS_APPROACH',
        title: 'Upcoming Earnings Risk Reminder (3 Days)',
        description: 'Dispatches high-priority reminder 3 days before any portfolio holding reports earnings.',
        isEnabled: true,
        triggeredCount: 4,
        lastTriggeredAt: 'Yesterday',
      },
      {
        id: 'rule-risk-high',
        userId,
        type: 'RISK_SCORE_HIGH',
        title: 'Risk Guardian™ Score > 75 Alert',
        description: 'Notifies when aggregate portfolio risk rating enters HIGH severity zone.',
        thresholdValue: 75,
        isEnabled: true,
        triggeredCount: 1,
      },
    ];

    this.saveAlertRules(userId, defaultRules);
    return defaultRules;
  }

  public static saveAlertRules(userId: string, rules: SmartPortfolioAlertRule[]) {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_ALERTS}_${userId}`, JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save alert rules:', e);
    }
  }

  /**
   * Daily Morning Portfolio Brief
   */
  public static getDailyBrief(holdings: HoldingPosition[], portfolioValue: number): DailyPortfolioBrief {
    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      date: todayStr,
      greeting: 'Good Morning, MarketMind Trader',
      portfolioValue: portfolioValue || 84420.80,
      yesterdayChangePercent: -1.84,
      riskTier: 'ELEVATED',
      overnightNews: [
        {
          headline: 'Asian Semiconductor Supply Chain Steady',
          impact: 'Neutral for NVDA & AMD pre-market session.',
        },
        {
          headline: '10-Year US Treasury Yield Dips 2bps to 4.26%',
          impact: 'Constructive tailwind for tech software multiples.',
        },
      ],
      todaysBiggestMacroEvent: {
        title: 'US S&P Global Flash Manufacturing & Services PMI',
        time: '9:45 AM ET',
        expectedImpact: 'Moderate market volatility expected across broad indices.',
      },
      portfolioEarningsToday: [],
      highImpactHoldings: ['NVDA', 'AAPL', 'MSFT', 'AMD'],
      aiExecutiveSummary:
        'Your portfolio enters today with an Elevated risk profile due to a 20.8% weight in NVDA. Futures are pointing to a flattish open. Watch 10-Yr yield levels and preliminary PMI numbers at 9:45 AM ET for cross-asset momentum.',
    };
  }

  /**
   * End of Day Portfolio Brief
   */
  public static getEndOfDayBrief(
    portfolioDayPercent: number,
    holdings: HoldingPosition[]
  ): EndOfDayPortfolioBrief {
    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    return {
      date: todayStr,
      portfolioDayChangePercent: portfolioDayPercent,
      spyDayChangePercent: -0.32,
      relativePerformancePercent: +(portfolioDayPercent - -0.32).toFixed(2),
      topContributor: { symbol: 'AAPL', changePercent: 0.51 },
      largestDrag: { symbol: 'AMD', changePercent: -2.61 },
      mainCatalyst: 'Semiconductor multiple compression and rotation into defensive cashflows.',
      tomorrowsRisk: 'NVDA implied volatility skew expansion heading into earnings date.',
    };
  }
}
