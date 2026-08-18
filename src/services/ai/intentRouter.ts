/**
 * MarketMind AI - Intent Classifier & AI Tool Router
 * Determines user intention and targeted entities to fetch ONLY necessary verified data.
 */

export type UserIntentType =
  | 'TICKER_ANALYSIS'
  | 'WHY_MOVING'
  | 'PORTFOLIO_ANALYSIS'
  | 'PORTFOLIO_RISK'
  | 'WATCHLIST_ANALYSIS'
  | 'EARNINGS'
  | 'SEC_FILINGS'
  | 'NEWS_CATALYST'
  | 'MACRO_CALENDAR'
  | 'CROSS_ASSET_COMPARISON'
  | 'TECHNICAL_ANALYSIS'
  | 'GENERAL_EDUCATION';

export interface ClassifiedIntent {
  intent: UserIntentType;
  primarySymbol?: string;
  comparisonSymbols?: string[];
  requiresPortfolio: boolean;
  requiresWatchlist: boolean;
  requiresFilings: boolean;
  requiresEarnings: boolean;
  requiresMacro: boolean;
  confidence: number;
}

export class IntentRouter {
  /**
   * Classify user query into precise intent and extracted entities
   */
  public static classify(
    query: string,
    activeSymbolFallback?: string,
    contextSymbol?: string
  ): ClassifiedIntent {
    const q = (query || '').trim().toLowerCase();
    const upperText = (query || '').toUpperCase();

    // Extract Tickers: e.g. NVDA, AAPL, TSLA, SPY, /ES, BTC
    const tickerMatches = Array.from(
      new Set(
        (upperText.match(/\b[A-Z]{1,5}\b/g) || []).filter(
          (sym) =>
            ![
              'A', 'I', 'IN', 'ON', 'AT', 'TO', 'THE', 'IS', 'ARE', 'WAS', 'BE', 'OR', 'AND',
              'MY', 'ME', 'YOU', 'HE', 'SHE', 'IT', 'WE', 'THEY', 'WHAT', 'WHY', 'HOW', 'WHEN',
              'WHO', 'WHERE', 'DO', 'DOES', 'DID', 'HAS', 'HAVE', 'HAD', 'CAN', 'COULD', 'WILL',
              'WOULD', 'SHOULD', 'BUY', 'SELL', 'HOLD', 'CALL', 'PUT', 'ETF', 'SEC', 'FED', 'CPI',
              'PCE', 'PPI', 'GDP', 'FOMC', 'NFP', 'ATH', 'VWAP', 'RSI', 'MACD', 'EMA', 'SMA', 'ATR',
              'RISK', 'RISKS', 'PORT', 'NEWS', 'GAIN', 'LOSS', 'COST', 'RATE', 'CASH', 'BOND',
              'TODAY', 'NOW', 'NEXT', 'WEEK', 'YEAR', 'VIEW', 'OPEN', 'HIGH', 'LOW', 'DATA',
            ].includes(sym)
        )
      )
    );

    const primarySymbol = tickerMatches[0] || contextSymbol || activeSymbolFallback || undefined;
    const comparisonSymbols = tickerMatches.length > 1 ? tickerMatches : undefined;

    // 1. Portfolio Questions
    if (
      q.includes('portfolio') ||
      q.includes('my holdings') ||
      q.includes('my positions') ||
      q.includes('my account') ||
      q.includes('what am i holding')
    ) {
      if (q.includes('risk') || q.includes('exposure') || q.includes('concentrated') || q.includes('beta') || q.includes('drawdown')) {
        return {
          intent: 'PORTFOLIO_RISK',
          primarySymbol,
          requiresPortfolio: true,
          requiresWatchlist: false,
          requiresFilings: false,
          requiresEarnings: true,
          requiresMacro: false,
          confidence: 0.95,
        };
      }
      return {
        intent: 'PORTFOLIO_ANALYSIS',
        primarySymbol,
        requiresPortfolio: true,
        requiresWatchlist: false,
        requiresFilings: false,
        requiresEarnings: true,
        requiresMacro: false,
        confidence: 0.95,
      };
    }

    // 2. Watchlist Questions
    if (
      q.includes('my watchlist') ||
      q.includes('on my watchlist') ||
      q.includes('watchlist')
    ) {
      return {
        intent: 'WATCHLIST_ANALYSIS',
        primarySymbol,
        requiresPortfolio: false,
        requiresWatchlist: true,
        requiresFilings: false,
        requiresEarnings: true,
        requiresMacro: false,
        confidence: 0.92,
      };
    }

    // 3. Why is it moving?
    if (
      q.includes('why is') ||
      q.includes('why did') ||
      q.includes('what moved') ||
      q.includes('what is moving') ||
      q.includes('why moving')
    ) {
      return {
        intent: 'WHY_MOVING',
        primarySymbol,
        requiresPortfolio: false,
        requiresWatchlist: false,
        requiresFilings: true,
        requiresEarnings: true,
        requiresMacro: true,
        confidence: 0.95,
      };
    }

    // 4. Cross-Asset Comparison
    if (
      comparisonSymbols &&
      comparisonSymbols.length >= 2 &&
      (q.includes(' or ') || q.includes(' vs ') || q.includes('versus') || q.includes('compare') || q.includes('better'))
    ) {
      return {
        intent: 'CROSS_ASSET_COMPARISON',
        primarySymbol: comparisonSymbols[0],
        comparisonSymbols,
        requiresPortfolio: false,
        requiresWatchlist: false,
        requiresFilings: false,
        requiresEarnings: true,
        requiresMacro: false,
        confidence: 0.9,
      };
    }

    // 5. Earnings Questions
    if (
      q.includes('earnings') ||
      q.includes('eps') ||
      q.includes('revenue report') ||
      q.includes('report date') ||
      q.includes('quarterly results')
    ) {
      return {
        intent: 'EARNINGS',
        primarySymbol,
        requiresPortfolio: q.includes('my') || q.includes('holdings'),
        requiresWatchlist: q.includes('watchlist'),
        requiresFilings: false,
        requiresEarnings: true,
        requiresMacro: false,
        confidence: 0.92,
      };
    }

    // 6. SEC Filings
    if (
      q.includes('10-k') ||
      q.includes('10-q') ||
      q.includes('8-k') ||
      q.includes('form 4') ||
      q.includes('insider selling') ||
      q.includes('insider buying') ||
      q.includes('sec filing')
    ) {
      return {
        intent: 'SEC_FILINGS',
        primarySymbol,
        requiresPortfolio: false,
        requiresWatchlist: false,
        requiresFilings: true,
        requiresEarnings: false,
        requiresMacro: false,
        confidence: 0.94,
      };
    }

    // 7. Macro Economic Events
    if (
      q.includes('cpi') ||
      q.includes('fomc') ||
      q.includes('fed') ||
      q.includes('interest rate') ||
      q.includes('inflation') ||
      q.includes('nfp') ||
      q.includes('jobless claims') ||
      q.includes('economic calendar')
    ) {
      return {
        intent: 'MACRO_CALENDAR',
        primarySymbol,
        requiresPortfolio: false,
        requiresWatchlist: false,
        requiresFilings: false,
        requiresEarnings: false,
        requiresMacro: true,
        confidence: 0.9,
      };
    }

    // 8. Technical Questions
    if (
      q.includes('vwap') ||
      q.includes('support') ||
      q.includes('resistance') ||
      q.includes('rsi') ||
      q.includes('moving average') ||
      q.includes('breakout') ||
      q.includes('breakdown') ||
      q.includes('levels')
    ) {
      return {
        intent: 'TECHNICAL_ANALYSIS',
        primarySymbol,
        requiresPortfolio: false,
        requiresWatchlist: false,
        requiresFilings: false,
        requiresEarnings: false,
        requiresMacro: false,
        confidence: 0.88,
      };
    }

    // Default to Ticker Analysis if symbol present, else General Education
    if (primarySymbol) {
      return {
        intent: 'TICKER_ANALYSIS',
        primarySymbol,
        requiresPortfolio: false,
        requiresWatchlist: false,
        requiresFilings: false,
        requiresEarnings: true,
        requiresMacro: true,
        confidence: 0.8,
      };
    }

    return {
      intent: 'GENERAL_EDUCATION',
      requiresPortfolio: false,
      requiresWatchlist: false,
      requiresFilings: false,
      requiresEarnings: false,
      requiresMacro: true,
      confidence: 0.75,
    };
  }
}
