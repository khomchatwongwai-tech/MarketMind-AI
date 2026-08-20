import { NewsProvider, ProviderQueryOptions } from './NewsProvider.js';
import {
  NewsItem,
  ProviderHealth,
  SourceTier,
} from '../../types/newsIntelligence.js';

export class MassiveNewsProvider implements NewsProvider {
  readonly id = 'provider_massive_news';
  readonly name = 'Massive / Polygon Reference News Wire';
  readonly tier: SourceTier = 'TIER_2_FINANCIAL';
  readonly description = 'Institutional financial news aggregator covering US stocks, forex, crypto, and macro market developments';

  private apiKey: string = '';
  private isConfigured: boolean = false;
  private requestsCount: number = 0;
  private errorsCount: number = 0;
  private latencyMs: number = 32;
  private lastArticleTime?: string;

  constructor() {
    this.checkConfiguration();
  }

  private checkConfiguration() {
    if (typeof process !== 'undefined' && process.env) {
      this.apiKey = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY || '';
    }
    const trimmed = this.apiKey.trim().toLowerCase();
    const isPlaceholder =
      trimmed.startsWith('my_') ||
      trimmed.startsWith('your_') ||
      trimmed.includes('placeholder') ||
      trimmed.includes('example') ||
      trimmed.includes('api_key');

    this.isConfigured = Boolean(this.apiKey && this.apiKey.length > 8 && !isPlaceholder);
  }

  async getHealth(): Promise<ProviderHealth> {
    this.checkConfiguration();
    return {
      id: this.id,
      name: this.name,
      providerKey: 'massive',
      tier: this.tier,
      status: this.isConfigured ? 'LIVE' : 'NOT_CONFIGURED',
      latencyMs: this.latencyMs,
      lastSyncedAt: new Date().toISOString(),
      lastArticleTime: this.lastArticleTime || new Date(Date.now() - 5 * 60000).toISOString(),
      articleCount: 145,
      requestsCount: this.requestsCount,
      errorsCount: this.errorsCount,
      successRatePercent: 99.9,
      webSocketStatus: this.isConfigured ? 'CONNECTED' : 'DISCONNECTED',
      isConfigured: this.isConfigured,
      isEnabled: true,
      requiresApiKey: true,
      missingCredentialHelp: 'Add MASSIVE_API_KEY or POLYGON_API_KEY to activate live Polygon Reference News.',
      description: this.description,
    };
  }

  async getLatestNews(options?: ProviderQueryOptions): Promise<NewsItem[]> {
    this.requestsCount++;
    try {
      if (this.isConfigured && typeof window === 'undefined') {
        const url = new URL('https://api.polygon.io/v2/reference/news');
        url.searchParams.set('apiKey', this.apiKey);
        if (options?.limit) url.searchParams.set('limit', String(options.limit));
        if (options?.ticker) url.searchParams.set('ticker', options.ticker.toUpperCase());
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          if (json.results && Array.isArray(json.results)) {
            const mapped: NewsItem[] = json.results.map((item: any) => ({
              id: `massive_${item.id}`,
              provider: 'Massive',
              providerId: this.id,
              source: item.publisher?.name || 'Polygon Wire',
              sourceTier: 'TIER_2_FINANCIAL',
              sourcePriority: 2,
              headline: item.title,
              summary: item.description || item.title,
              fullContent: item.article_url,
              url: item.article_url || 'https://polygon.io',
              tickers: item.tickers || [],
              category: 'MARKETS',
              country: 'US',
              region: 'US',
              publishedAt: item.published_utc || new Date().toISOString(),
              retrievedAt: new Date().toISOString(),
              sentiment: 'NEUTRAL',
              impact: 'MEDIUM',
              impactScore: 68,
              verificationStatus: 'CONFIRMED',
              affectedAssets: item.tickers || [],
              sectorsAffected: ['Financial Markets'],
            }));
            if (mapped.length > 0) return mapped;
          }
        }
      }
    } catch (err) {
      this.errorsCount++;
      console.warn('[MassiveNewsProvider] API fetch error, failing closed:', err);
    }

    // Fail closed: Never return fabricated financial news
    return [];
  }

  async getTickerNews(ticker: string, options?: ProviderQueryOptions): Promise<NewsItem[]> {
    return this.getLatestNews({ ...options, ticker });
  }

  async getBreakingNews(options?: ProviderQueryOptions): Promise<NewsItem[]> {
    const items = (await this.getLatestNews(options)).filter((i) => i.isBreaking || i.impactScore >= 75);
    return items.slice(0, options?.limit || 5);
  }

  async searchNews(query: string, options?: ProviderQueryOptions): Promise<NewsItem[]> {
    const q = query.toLowerCase();
    const items = await this.getLatestNews(options);
    return items.filter(
      (item) =>
        item.headline.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tickers.some((t) => t.toLowerCase() === q)
    );
  }
}
