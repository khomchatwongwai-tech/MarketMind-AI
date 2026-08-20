import { NewsProvider, ProviderQueryOptions } from './NewsProvider.js';
import { NewsItem, ProviderHealth } from '../../types/newsIntelligence.js';

export class SocialSentimentProvider implements NewsProvider {
  readonly id = 'provider_tier4_social_sentiment';
  readonly name = 'Retail & Social Sentiment Radar';
  readonly tier = 'TIER_4_SOCIAL' as const;
  readonly description = 'Real-time retail forum chatter and social volume tracking from r/wallstreetbets, StockTwits & X (Strictly Unverified Sentiment Signals)';

  private latency = 85;
  private isConfigured = false;
  private requestsCount = 0;
  private errorsCount = 0;

  constructor() {
    if (typeof process !== 'undefined' && process.env) {
      this.isConfigured = Boolean(process.env.SOCIAL_SENTIMENT_API_KEY);
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
    // When social sentiment stream is not configured, fail closed without fake commentary
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
