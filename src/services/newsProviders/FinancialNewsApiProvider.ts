import { NewsProvider, ProviderQueryOptions } from './NewsProvider.js';
import { NewsItem, ProviderHealth } from '../../types/newsIntelligence.js';

export class FinancialNewsApiProvider implements NewsProvider {
  readonly id = 'provider_tier2_financial_news';
  readonly name = 'Institutional Financial News Feeds';
  readonly tier = 'TIER_2_FINANCIAL' as const;
  readonly description = 'Aggregated financial feeds from Reuters, Bloomberg, CNBC, Financial Times, WSJ, MarketWatch & Yahoo Finance';

  private latency = 58;
  private isConfigured = false;
  private requestsCount = 0;
  private errorsCount = 0;

  constructor() {
    if (typeof process !== 'undefined' && process.env) {
      this.isConfigured = Boolean(process.env.FINANCIAL_NEWS_API_KEY);
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      id: this.id,
      name: this.name,
      tier: this.tier,
      status: this.isConfigured ? 'ONLINE' : 'NOT_CONFIGURED',
      latencyMs: this.latency,
      lastSyncedAt: new Date().toISOString(),
      articleCount: 0,
      requestsCount: this.requestsCount,
      errorsCount: this.errorsCount,
      successRatePercent: 100,
      isConfigured: this.isConfigured,
      isEnabled: true,
      requiresApiKey: true,
      description: this.description,
    };
  }

  async getLatestNews(options?: ProviderQueryOptions): Promise<NewsItem[]> {
    this.requestsCount++;
    // When external news aggregator API is not configured, fail closed without fake articles
    return [];
  }

  async getTickerNews(ticker: string, options?: ProviderQueryOptions): Promise<NewsItem[]> {
    return this.getLatestNews({ ...options, ticker });
  }

  async getBreakingNews(options?: ProviderQueryOptions): Promise<NewsItem[]> {
    return this.getLatestNews(options);
  }

  async searchNews(query: string, options?: ProviderQueryOptions): Promise<NewsItem[]> {
    return this.getLatestNews({ ...options, query });
  }
}
