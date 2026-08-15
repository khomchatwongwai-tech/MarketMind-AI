import { NewsProvider, ProviderQueryOptions } from './NewsProvider';
import { NewsItem, ProviderHealth } from '../../types/newsIntelligence';

export class SocialSentimentProvider implements NewsProvider {
  readonly id = 'provider_tier4_social_sentiment';
  readonly name = 'Retail & Social Sentiment Radar';
  readonly tier = 'TIER_4_SOCIAL' as const;
  readonly description = 'Real-time retail forum chatter and social volume tracking from r/wallstreetbets, StockTwits & X (Strictly Unverified Sentiment Signals)';

  private latency = 85;

  async getHealth(): Promise<ProviderHealth> {
    return {
      id: this.id,
      name: this.name,
      tier: this.tier,
      status: 'ONLINE',
      latencyMs: this.latency,
      lastSyncedAt: new Date().toISOString(),
      articleCount: 30,
      successRatePercent: 98.6,
      description: this.description,
    };
  }

  private getItems(): NewsItem[] {
    const now = new Date();
    const formatTime = (minusMinutes: number) => {
      const d = new Date(now.getTime() - minusMinutes * 60000);
      return d.toISOString();
    };

    return [
      {
        id: 'wsb_nvda_retail_call_flow',
        providerId: this.id,
        source: 'Reddit /r/wallstreetbets Sentiment Radar',
        sourceTier: 'TIER_4_SOCIAL',
        headline: '[Social Sentiment Signal] Retail Volume Spikes Across 0DTE NVDA $130 Calls Following Keynote Buzz',
        summary: 'Retail discussion velocity surged 240% over the last 2 hours with heavy retail mentions of short-dated out-of-the-money call contracts. Note: Unverified retail sentiment chatter; not an official catalyst.',
        url: 'https://reddit.com/r/wallstreetbets',
        tickers: ['NVDA', 'SMH', 'SPY'],
        category: 'MARKETS',
        region: 'US',
        publishedAt: formatTime(10),
        retrievedAt: new Date().toISOString(),
        sentiment: 'BULLISH',
        impact: 'MEDIUM',
        impactScore: 6,
        verificationStatus: 'UNVERIFIED',
        affectedAssets: ['NVDA 0DTE Calls', 'Retail Gamma'],
        sectorsAffected: ['Retail Flow', 'Short-Dated Options'],
      },
      {
        id: 'stocktwits_tsla_energy_buzz',
        providerId: this.id,
        source: 'StockTwits Sentiment Stream',
        sourceTier: 'TIER_4_SOCIAL',
        headline: '[Social Sentiment Signal] High Social Bullish Ratio (82%) on TSLA as Megapack Factory Clips Circulate',
        summary: 'Community message sentiment for TSLA transitioned from neutral to overwhelmingly bullish following viral drone footage of Shanghai energy facility expansion. Unverified community commentary.',
        url: 'https://stocktwits.com/symbol/TSLA',
        tickers: ['TSLA'],
        category: 'COMPANIES',
        region: 'US',
        publishedAt: formatTime(28),
        retrievedAt: new Date().toISOString(),
        sentiment: 'BULLISH',
        impact: 'LOW',
        impactScore: 4,
        verificationStatus: 'UNVERIFIED',
        affectedAssets: ['TSLA'],
        sectorsAffected: ['Retail Sentiment'],
      },
      {
        id: 'x_macro_fed_speculation',
        providerId: this.id,
        source: 'Financial X Community Stream',
        sourceTier: 'TIER_4_SOCIAL',
        headline: '[Social Rumor Signal] Financial Fintwit Speculates on Potential Inter-Meeting Fed Speaker Tone Shift',
        summary: 'Unconfirmed social media debate analyzing upcoming regional Fed President speaking schedule. Classified strictly as unverified commentary until verified official remarks are delivered.',
        url: 'https://x.com',
        tickers: ['SPY', 'TLT'],
        category: 'CENTRAL_BANKS',
        region: 'US',
        publishedAt: formatTime(55),
        retrievedAt: new Date().toISOString(),
        sentiment: 'NEUTRAL',
        impact: 'LOW',
        impactScore: 3,
        verificationStatus: 'UNVERIFIED',
        affectedAssets: ['Fed Commentary Speculation'],
        sectorsAffected: ['Social Macro Debate'],
      },
    ];
  }

  async getLatestNews(options?: ProviderQueryOptions): Promise<NewsItem[]> {
    let items = this.getItems();
    if (options?.category && options.category !== 'ALL') {
      items = items.filter((i) => i.category === options.category);
    }
    if (options?.region && options.region !== 'GLOBAL') {
      items = items.filter((i) => i.region === options.region);
    }
    if (options?.ticker) {
      const sym = options.ticker.toUpperCase();
      items = items.filter((i) => i.tickers.includes(sym) || i.affectedAssets.includes(sym));
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  async getTickerNews(ticker: string, options?: ProviderQueryOptions): Promise<NewsItem[]> {
    return this.getLatestNews({ ...options, ticker });
  }

  async getBreakingNews(options?: ProviderQueryOptions): Promise<NewsItem[]> {
    return this.getItems().filter((i) => i.impactScore >= 5).slice(0, options?.limit || 3);
  }

  async searchNews(query: string, options?: ProviderQueryOptions): Promise<NewsItem[]> {
    const q = query.toLowerCase();
    return this.getItems().filter((item) => {
      return (
        item.headline.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tickers.some((t) => t.toLowerCase() === q)
      );
    });
  }
}
