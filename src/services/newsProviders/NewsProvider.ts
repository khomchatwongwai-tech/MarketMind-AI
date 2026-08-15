import {
  NewsArticle,
  NewsItem,
  NewsCategory,
  GlobalRegion,
  SourceTier,
  ProviderHealth,
  EconomicReleaseItem,
  EarningsIntelligenceItem,
} from '../../types/newsIntelligence';

export interface ProviderQueryOptions {
  limit?: number;
  category?: NewsCategory;
  region?: GlobalRegion;
  ticker?: string;
  sinceTimestamp?: string;
  minTier?: SourceTier;
  query?: string;
}

/**
 * Standard NewsProvider interface for MarketMind AI news sources
 * Implemented by Alpaca, Finnhub, SEC EDGAR, Federal Reserve, Government Agencies, etc.
 */
export interface NewsProvider {
  readonly id: string;
  readonly name: string;
  readonly tier: SourceTier;
  readonly description: string;

  getHealth(): Promise<ProviderHealth>;
  getLatestNews(options?: ProviderQueryOptions): Promise<NewsArticle[]>;
  getTickerNews(ticker: string, options?: ProviderQueryOptions): Promise<NewsArticle[]>;
  getBreakingNews(options?: ProviderQueryOptions): Promise<NewsArticle[]>;
  getEconomicNews?(): Promise<EconomicReleaseItem[]>;
  getEarningsNews?(): Promise<EarningsIntelligenceItem[]>;
  searchNews(query: string, options?: ProviderQueryOptions): Promise<NewsArticle[]>;
}
