import type { NewsArticle, ProviderHealth, SourceTier, SourceType } from '../../types/newsIntelligence.js';
import { MarketMindNewsEngine } from '../MarketMindNewsEngine.js';
import type { NewsProvider, ProviderQueryOptions } from './NewsProvider.js';

export type PublisherConfig = { id: string; name: string; tier: SourceTier; sourceType: Extract<SourceType, 'LICENSED_API' | 'RSS' | 'METADATA_ONLY'>; endpointEnv: string; credentialEnv?: string; licensingMode: string; reliabilityScore: number };

export class ReputablePublisherProvider implements NewsProvider {
  readonly id; readonly name; readonly tier; readonly description;
  constructor(readonly publisher: PublisherConfig, private readonly env = process.env) { this.id = publisher.id; this.name = publisher.name; this.tier = publisher.tier; this.description = `${publisher.name} ${publisher.sourceType.toLowerCase()} integration boundary (${publisher.licensingMode}).`; }
  private configured() { return Boolean(this.env[this.publisher.endpointEnv] && (!this.publisher.credentialEnv || this.env[this.publisher.credentialEnv])); }
  async getHealth(): Promise<ProviderHealth> { return { id: this.id, name: this.name, tier: this.tier, status: this.configured() ? 'ONLINE' : 'NOT_CONFIGURED', latencyMs: 0, lastSyncedAt: new Date().toISOString(), articleCount: 0, successRatePercent: 0, isConfigured: this.configured(), isEnabled: this.configured(), requiresApiKey: Boolean(this.publisher.credentialEnv), missingCredentialHelp: this.configured() ? undefined : `Configure ${this.publisher.endpointEnv}${this.publisher.credentialEnv ? ` and ${this.publisher.credentialEnv}` : ''} after confirming feed rights.`, description: this.description }; }
  private async fetch(options: ProviderQueryOptions = {}): Promise<NewsArticle[]> { if (!this.configured()) return []; try { const url = new URL(this.env[this.publisher.endpointEnv]!); if (options.ticker) url.searchParams.set('ticker', options.ticker); if (options.query) url.searchParams.set('q', options.query); url.searchParams.set('limit', String(Math.min(options.limit || 20, 50))); const response = await fetch(url, { headers: this.publisher.credentialEnv ? { authorization: `Bearer ${this.env[this.publisher.credentialEnv]}` } : undefined, signal: AbortSignal.timeout(8_000) }); if (!response.ok) return []; const payload: any = await response.json(); const rows = Array.isArray(payload) ? payload : Array.isArray(payload.articles) ? payload.articles : []; return rows.filter((row: any) => row?.url && row?.publishedAt).map((row: any) => MarketMindNewsEngine.normalizeArticle({ ...row, licensingMode: this.publisher.licensingMode, reliabilityScore: this.publisher.reliabilityScore }, { providerId: this.id, providerName: this.name, tier: this.tier, sourceType: this.publisher.sourceType })); } catch { return []; } }
  getLatestNews(options?: ProviderQueryOptions) { return this.fetch(options); }
  getTickerNews(ticker: string, options?: ProviderQueryOptions) { return this.fetch({ ...options, ticker }); }
  getBreakingNews(options?: ProviderQueryOptions) { return this.fetch(options); }
  searchNews(query: string, options?: ProviderQueryOptions) { return this.fetch({ ...options, query }); }
}

export const reputablePublisherConfigs: PublisherConfig[] = [
  { id: 'reuters', name: 'Reuters', tier: 'TIER_2_FINANCIAL', sourceType: 'LICENSED_API', endpointEnv: 'REUTERS_NEWS_ENDPOINT', credentialEnv: 'REUTERS_NEWS_TOKEN', licensingMode: 'licensed-feed-required', reliabilityScore: 0.95 },
  { id: 'associated_press', name: 'Associated Press', tier: 'TIER_2_FINANCIAL', sourceType: 'LICENSED_API', endpointEnv: 'AP_NEWS_ENDPOINT', credentialEnv: 'AP_NEWS_TOKEN', licensingMode: 'licensed-feed-required', reliabilityScore: 0.94 },
  { id: 'barrons', name: "Barron's", tier: 'TIER_2_FINANCIAL', sourceType: 'METADATA_ONLY', endpointEnv: 'BARRONS_NEWS_ENDPOINT', credentialEnv: 'BARRONS_NEWS_TOKEN', licensingMode: 'metadata-only-license-required', reliabilityScore: 0.9 },
  { id: 'fidelity', name: 'Fidelity', tier: 'TIER_2_FINANCIAL', sourceType: 'METADATA_ONLY', endpointEnv: 'FIDELITY_NEWS_ENDPOINT', credentialEnv: 'FIDELITY_NEWS_TOKEN', licensingMode: 'partner-access-required', reliabilityScore: 0.9 },
  { id: 'schwab', name: 'Charles Schwab', tier: 'TIER_2_FINANCIAL', sourceType: 'METADATA_ONLY', endpointEnv: 'SCHWAB_NEWS_ENDPOINT', credentialEnv: 'SCHWAB_NEWS_TOKEN', licensingMode: 'partner-access-required', reliabilityScore: 0.9 },
  { id: 'morgan_stanley_etrade', name: 'Morgan Stanley / E*TRADE', tier: 'TIER_2_FINANCIAL', sourceType: 'METADATA_ONLY', endpointEnv: 'ETRADE_NEWS_ENDPOINT', credentialEnv: 'ETRADE_NEWS_TOKEN', licensingMode: 'partner-access-required', reliabilityScore: 0.9 },
  { id: 'investing_com', name: 'Investing.com', tier: 'TIER_3_SPECIALIZED', sourceType: 'LICENSED_API', endpointEnv: 'INVESTING_NEWS_ENDPOINT', credentialEnv: 'INVESTING_NEWS_TOKEN', licensingMode: 'licensed-feed-required', reliabilityScore: 0.82 },
  { id: 'economic_times', name: 'Economic Times', tier: 'TIER_3_SPECIALIZED', sourceType: 'RSS', endpointEnv: 'ECONOMIC_TIMES_FEED_ENDPOINT', licensingMode: 'permitted-feed-metadata-only', reliabilityScore: 0.82 },
];
export const reputablePublisherProviders = reputablePublisherConfigs.map(config => new ReputablePublisherProvider(config));
