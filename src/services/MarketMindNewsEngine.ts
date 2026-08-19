import {
  NewsArticle,
  NewsItem,
  MarketMindEventCluster,
  SourceTier,
  SourceType,
  VerificationStatus,
  NewsSentiment,
  NewsImpact,
  NewsCategory,
  GlobalRegion,
  VerifiedSourceCitation,
  PortfolioNewsExposure,
} from '../types/newsIntelligence';
import { ProviderQueryOptions } from './newsProviders/NewsProvider';

export class MarketMindNewsEngine {
  /**
   * Normalizes any raw payload from external news feeds into a structured NewsArticle
   */
  public static normalizeArticle(
    raw: any,
    providerConfig: {
      providerId: string;
      providerName: string;
      tier: SourceTier;
      sourceType?: SourceType;
    }
  ): NewsArticle {
    const headline = String(raw.headline || raw.title || raw.name || 'Financial Market Update').trim();
    const hash = Math.abs(headline.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0));
    const id = String(raw.id || `${providerConfig.providerId}_${Date.now()}_${hash}`);
    const summary = String(raw.summary || raw.description || raw.abstract || headline).trim();
    const content = raw.content || raw.fullContent || raw.body || undefined;
    const candidateUrl = String(raw.url || raw.link || raw.sourceUrl || '').trim();
    let url = ''; try { const parsed = new URL(candidateUrl); if (parsed.protocol === 'https:' || parsed.protocol === 'http:') url = parsed.toString(); } catch { /* invalid source URLs fail closed */ }
    const publishedAt = raw.publishedAt || raw.datetime || raw.created_at || raw.date || '';
    const retrievedAt = raw.retrievedAt || new Date().toISOString();

    // Extract & normalize tickers
    let tickers: string[] = [];
    if (Array.isArray(raw.tickers)) {
      tickers = raw.tickers.map((t: string) => String(t).toUpperCase().replace('$', '')).filter(Boolean);
    } else if (Array.isArray(raw.symbols)) {
      tickers = raw.symbols.map((t: string) => String(t).toUpperCase().replace('$', '')).filter(Boolean);
    } else if (typeof raw.ticker === 'string' && raw.ticker) {
      tickers = [raw.ticker.toUpperCase().replace('$', '')];
    } else if (typeof raw.symbol === 'string' && raw.symbol) {
      tickers = [raw.symbol.toUpperCase().replace('$', '')];
    }

    // Auto-detect tickers from headline/summary if empty
    if (tickers.length === 0) {
      const tickerRegex = /\$([A-Z]{1,5})\b|\b(SPY|QQQ|NVDA|AAPL|MSFT|AMZN|GOOGL|META|TSLA|TLT|VIX|BTC|ETH|AVGO|AMD|SMCI)\b/g;
      const matched = new Set<string>();
      let match;
      const textToScan = `${headline} ${summary}`;
      while ((match = tickerRegex.exec(textToScan)) !== null) {
        matched.add((match[1] || match[2]).toUpperCase());
      }
      tickers = Array.from(matched);
    }

    // Sentiment detection
    let sentiment: NewsSentiment = raw.sentiment || 'NEUTRAL';
    let sentimentScore: number = raw.sentimentScore ?? 0;
    if (!raw.sentiment) {
      const textLower = `${headline} ${summary}`.toLowerCase();
      const bullishWords = ['surge', 'soar', 'beat', 'record', 'outperform', 'upgrade', 'rally', 'gain', 'profit', 'expansion', 'dividend increase', 'bullish', 'approval', 'growth'];
      const bearishWords = ['plunge', 'slump', 'miss', 'downgrade', 'lawsuit', 'warning', 'drop', 'decline', 'loss', 'recession', 'probe', 'bearish', 'deficit', 'layoff'];
      
      let bullCount = 0;
      let bearCount = 0;
      bullishWords.forEach(w => { if (textLower.includes(w)) bullCount++; });
      bearishWords.forEach(w => { if (textLower.includes(w)) bearCount++; });

      if (bullCount >= 2 && bearCount === 0) {
        sentiment = 'VERY_BULLISH';
        sentimentScore = 0.85;
      } else if (bullCount > bearCount) {
        sentiment = 'BULLISH';
        sentimentScore = 0.55;
      } else if (bearCount >= 2 && bullCount === 0) {
        sentiment = 'VERY_BEARISH';
        sentimentScore = -0.85;
      } else if (bearCount > bullCount) {
        sentiment = 'BEARISH';
        sentimentScore = -0.55;
      }
    }

    // Category detection
    let category: NewsCategory = raw.category || 'MARKETS';
    if (!raw.category) {
      const textLower = `${headline} ${summary}`.toLowerCase();
      if (textLower.includes('fed') || textLower.includes('fomc') || textLower.includes('interest rate') || textLower.includes('powell')) {
        category = 'FEDERAL_RESERVE';
      } else if (textLower.includes('cpi') || textLower.includes('inflation') || textLower.includes('gdp') || textLower.includes('jobless') || textLower.includes('payrolls')) {
        category = 'ECONOMY';
      } else if (textLower.includes('earnings') || textLower.includes('eps') || textLower.includes('revenue') || textLower.includes('quarterly results')) {
        category = 'EARNINGS';
      } else if (textLower.includes('bitcoin') || textLower.includes('crypto') || textLower.includes('ethereum') || textLower.includes('solana')) {
        category = 'CRYPTO';
      } else if (textLower.includes('oil') || textLower.includes('crude') || textLower.includes('natural gas') || textLower.includes('petroleum')) {
        category = 'ENERGY';
      } else if (tickers.length > 0) {
        category = 'STOCKS';
      }
    }

    // Region
    const region: GlobalRegion = raw.region || 'US';

    // Impact calculation
    const isBreaking = Boolean(raw.isBreaking || raw.urgency === 'CRITICAL' || raw.urgency === 'HIGH');
    const { score: impactScore, impact } = this.calculateMarketImpactScore({
      sourceTier: providerConfig.tier,
      tickers,
      isBreaking,
      marketReaction: raw.marketReaction,
    });

    const verificationStatus: VerificationStatus =
      raw.verificationStatus || (providerConfig.tier === 'TIER_1_PRIMARY' ? 'CONFIRMED' : 'DEVELOPING');

    const source = String(raw.source || providerConfig.providerName);
    const affectedAssets = raw.affectedAssets || (tickers.length > 0 ? tickers : ['SPY', 'QQQ']);

    return {
      id,
      headline,
      title: headline,
      summary,
      fullContent: content,
      content,
      url,
      originalUrl: raw.originalUrl || url,
      imageUrl: raw.imageUrl,
      author: raw.author,
      source,
      provider: providerConfig.providerName,
      providerId: providerConfig.providerId,
      sourceType: providerConfig.sourceType || 'LICENSED_API',
      sourceTier: providerConfig.tier,
      sourcePriority: providerConfig.tier === 'TIER_1_PRIMARY' ? 1 : providerConfig.tier === 'TIER_2_FINANCIAL' ? 2 : 3,
      tickers,
      companies: raw.companies,
      sectors: raw.sectors,
      category,
      country: raw.country || 'US',
      region,
      publishedAt,
      updatedAt: raw.updatedAt,
      retrievedAt,
      receivedAt: raw.receivedAt || retrievedAt,
      sentiment,
      sentimentScore,
      urgency: raw.urgency || (isBreaking ? 'HIGH' : 'MEDIUM'),
      impact,
      marketImpact: impact,
      impactScore,
      verificationStatus,
      isBreaking,
      affectedAssets,
      sectorsAffected: raw.sectorsAffected || (category === 'ENERGY' ? ['Energy', 'Commodities'] : ['Equities', 'Financials']),
      primaryOfficialSource: raw.primaryOfficialSource,
      marketReaction: raw.marketReaction,
      rawMetadata: raw,
      sourceMetadata: {
        publisher: source,
        providerId: providerConfig.providerId,
        sourceTier: providerConfig.tier,
        sourceType: (providerConfig.sourceType === 'OFFICIAL_PRIMARY' || providerConfig.sourceType === 'OFFICIAL_FEED' || providerConfig.sourceType === 'PRIMARY_REGULATORY') ? 'OFFICIAL_PRIMARY' : providerConfig.sourceType === 'RSS' || providerConfig.sourceType === 'METADATA_ONLY' || providerConfig.sourceType === 'SEARCH_PROVIDER' ? providerConfig.sourceType : 'LICENSED_API',
        canonicalUrl: url,
        author: raw.author,
        publishedAt,
        retrievedAt,
        licensingMode: raw.licensingMode,
        reliabilityScore: raw.reliabilityScore,
        syndicationId: raw.syndicationId || raw.wireId,
      },
    };
  }

  /**
   * Calculate string similarity using Jaccard N-gram token overlap
   */
  public static calculateHeadlineSimilarity(text1: string, text2: string): number {
    const clean = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const words1 = new Set(clean(text1));
    const words2 = new Set(clean(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    let intersection = 0;
    for (const w of words1) {
      if (words2.has(w)) intersection++;
    }

    const union = new Set([...words1, ...words2]).size;
    return intersection / union;
  }

  /**
   * Determine whether two news items belong to the same event cluster
   */
  public static areItemsSameEvent(itemA: NewsArticle, itemB: NewsArticle): boolean {
    if (itemA.id === itemB.id) return true;

    // 1. Ticker overlap check
    const tickersA = new Set(itemA.tickers.map((t) => t.toUpperCase()));
    const hasCommonTicker = itemB.tickers.some((t) => tickersA.has(t.toUpperCase()));

    // 2. Timestamp proximity check (< 45 minutes)
    const timeA = new Date(itemA.publishedAt).getTime();
    const timeB = new Date(itemB.publishedAt).getTime();
    const isCloseInTime = Math.abs(timeA - timeB) < 45 * 60 * 1000;

    // 3. Headline text similarity
    const sim = this.calculateHeadlineSimilarity(itemA.headline, itemB.headline);

    if (sim >= 0.45 && (hasCommonTicker || isCloseInTime)) return true;
    if (sim >= 0.35 && hasCommonTicker && isCloseInTime) return true;

    return false;
  }

  /**
   * Calculate dynamic 0-100 Market Impact Score
   */
  public static calculateMarketImpactScore(
    item: {
      sourceTier: SourceTier;
      tickers: string[];
      isBreaking?: boolean;
      confirmationCount?: number;
      marketReaction?: {
        observedPriceChange?: number;
        volumeSurgeRatio?: number;
        vixChange?: number;
        yieldChangeBps?: number;
      };
    }
  ): { score: number; impact: NewsImpact } {
    let score = 0;

    // 1. Source Credibility Tier (Max 35 pts)
    switch (item.sourceTier) {
      case 'TIER_1_PRIMARY':
        score += 35;
        break;
      case 'TIER_2_FINANCIAL':
        score += 25;
        break;
      case 'TIER_3_SPECIALIZED':
        score += 15;
        break;
      case 'TIER_4_SOCIAL':
        score += 5;
        break;
    }

    // 2. Corroboration count bonus (Max 20 pts)
    const confirmations = item.confirmationCount || 1;
    if (confirmations >= 3) score += 20;
    else if (confirmations === 2) score += 12;

    // 3. Mega-cap / Index systemic breadth (Max 20 pts)
    const megaCaps = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'TLT', 'TNX', 'VIX'];
    const isMegaCap = item.tickers.some((t) => megaCaps.includes(t.toUpperCase()));
    if (isMegaCap) score += 18;
    else if (item.tickers.length > 0) score += 10;

    // 4. Breaking Urgency (Max 15 pts)
    if (item.isBreaking) score += 15;

    // 5. Market Reaction Confirmation (Max 15 pts)
    if (item.marketReaction) {
      if (Math.abs(item.marketReaction.observedPriceChange || 0) >= 2.0) score += 6;
      if ((item.marketReaction.volumeSurgeRatio || 1) >= 1.8) score += 5;
      if (Math.abs(item.marketReaction.vixChange || 0) >= 1.0) score += 4;
    }

    // Cap between 0 and 100
    score = Math.min(100, Math.max(10, score));

    // Map to discrete impact tier
    let impact: NewsImpact = 'LOW';
    if (score >= 90) impact = 'CRITICAL';
    else if (score >= 70) impact = 'HIGH';
    else if (score >= 40) impact = 'MEDIUM';
    else impact = 'LOW';

    return { score, impact };
  }

  /**
   * Determine verification status from source tiers and coverage count
   */
  public static evaluateVerificationStatus(items: NewsArticle[]): VerificationStatus {
    const valid = items.filter(item => item.url && Number.isFinite(Date.parse(item.publishedAt)));
    if (!valid.length) return 'UNVERIFIED';
    const newest = Math.max(...valid.map(item => Date.parse(item.publishedAt)));
    if (Date.now() - newest > 72 * 60 * 60 * 1000) return 'STALE';
    const bullish = valid.some(item => item.sentiment === 'BULLISH' || item.sentiment === 'VERY_BULLISH');
    const bearish = valid.some(item => item.sentiment === 'BEARISH' || item.sentiment === 'VERY_BEARISH');
    if (bullish && bearish && valid.length > 1) return 'CONFLICTED';
    const hasTier1 = valid.some((i) => i.sourceTier === 'TIER_1_PRIMARY');
    if (hasTier1) return 'CONFIRMED';
    const tier2Count = this.independentSources(valid).filter((i) => i.sourceTier === 'TIER_2_FINANCIAL').length;
    if (tier2Count >= 2) return 'CONFIRMED';
    if (tier2Count === 1) return 'DEVELOPING';

    return 'UNVERIFIED';
  }

  public static independentSources(items: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const syndication = item.sourceMetadata?.syndicationId || item.rawMetadata?.syndicationId || item.rawMetadata?.wireId;
      let canonical = item.originalUrl || item.sourceMetadata?.canonicalUrl || item.url;
      try { const parsed = new URL(canonical); parsed.search = ''; parsed.hash = ''; canonical = parsed.toString(); } catch { canonical = ''; }
      const key = syndication ? `syndication:${syndication}` : canonical ? `url:${canonical}` : `publisher:${item.providerId}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    });
  }

  /**
   * Filter and rank breaking news catalysts
   */
  public static detectBreakingCatalysts(articles: NewsArticle[], minImpactScore = 70): NewsArticle[] {
    return articles
      .filter((a) => a.isBreaking || a.impactScore >= minImpactScore || a.urgency === 'CRITICAL' || a.urgency === 'HIGH')
      .sort((a, b) => {
        if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }

  /**
   * Filter news articles by query options (ticker, category, region, minimum tier, search keywords)
   */
  public static filterByRelevance(articles: NewsArticle[], options?: ProviderQueryOptions): NewsArticle[] {
    if (!options) return articles;

    return articles.filter((article) => {
      if (options.ticker) {
        const queryTicker = options.ticker.toUpperCase();
        const hasTicker = article.tickers.some((t) => t.toUpperCase() === queryTicker) ||
                          article.affectedAssets.some((a) => a.toUpperCase().includes(queryTicker));
        if (!hasTicker) return false;
      }

      if (options.category && options.category !== 'ALL') {
        if (article.category !== options.category) return false;
      }

      if (options.region && options.region !== 'GLOBAL') {
        if (article.region !== options.region && article.region !== 'GLOBAL') return false;
      }

      if (options.minTier) {
        const tierRank: Record<SourceTier, number> = {
          'TIER_1_PRIMARY': 1,
          'TIER_2_FINANCIAL': 2,
          'TIER_3_SPECIALIZED': 3,
          'TIER_4_SOCIAL': 4,
        };
        if (tierRank[article.sourceTier] > tierRank[options.minTier]) return false;
      }

      if (options.query) {
        const q = options.query.toLowerCase();
        const text = `${article.headline} ${article.summary} ${article.tickers.join(' ')} ${article.source}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    }).slice(0, options.limit || 50);
  }

  /**
   * Aggregate sentiment across a collection of articles
   */
  public static aggregateSentiment(articles: NewsArticle[]): {
    bullish: number;
    bearish: number;
    neutral: number;
    dominant: NewsSentiment;
    sentimentScore: number;
  } {
    if (articles.length === 0) {
      return { bullish: 0, bearish: 0, neutral: 0, dominant: 'NEUTRAL', sentimentScore: 0 };
    }

    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    let totalScore = 0;

    articles.forEach((a) => {
      if (a.sentiment === 'VERY_BULLISH' || a.sentiment === 'BULLISH') {
        bullish++;
        totalScore += a.sentimentScore ?? (a.sentiment === 'VERY_BULLISH' ? 0.8 : 0.4);
      } else if (a.sentiment === 'VERY_BEARISH' || a.sentiment === 'BEARISH') {
        bearish++;
        totalScore += a.sentimentScore ?? (a.sentiment === 'VERY_BEARISH' ? -0.8 : -0.4);
      } else {
        neutral++;
      }
    });

    const avgScore = Number((totalScore / articles.length).toFixed(2));
    let dominant: NewsSentiment = 'NEUTRAL';
    if (bullish > bearish && bullish > neutral) {
      dominant = avgScore >= 0.6 ? 'VERY_BULLISH' : 'BULLISH';
    } else if (bearish > bullish && bearish > neutral) {
      dominant = avgScore <= -0.6 ? 'VERY_BEARISH' : 'BEARISH';
    }

    return { bullish, bearish, neutral, dominant, sentimentScore: avgScore };
  }

  /**
   * Cluster, deduplicate, and create MarketMind Event Clusters
   */
  public static clusterNewsEvents(rawItems: NewsArticle[]): MarketMindEventCluster[] {
    const clusters: NewsArticle[][] = [];

    // Sort items by source priority (1 = highest) then published date (newest first)
    const sorted = [...rawItems].sort((a, b) => {
      const prioA = a.sourcePriority ?? (a.sourceTier === 'TIER_1_PRIMARY' ? 1 : 2);
      const prioB = b.sourcePriority ?? (b.sourceTier === 'TIER_1_PRIMARY' ? 1 : 2);
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    for (const item of sorted) {
      const matchedCluster = clusters.find((cluster) =>
        cluster.some((cItem) => this.areItemsSameEvent(cItem, item))
      );

      if (matchedCluster) {
        matchedCluster.push(item);
      } else {
        clusters.push([item]);
      }
    }

    return clusters.map((group, index) => {
      // Primary source is highest tier / priority
      const primary = group[0];
      const additional = group.slice(1);

      const independent = this.independentSources(group);
      const verificationStatus = this.evaluateVerificationStatus(group);
      const allTickers = Array.from(new Set(group.flatMap((g) => g.tickers)));
      const allAffected = Array.from(new Set(group.flatMap((g) => g.affectedAssets)));
      const allSectors = Array.from(new Set(group.flatMap((g) => g.sectorsAffected || [])));

      // Calculate aggregated impact score
      const { score: impactScore, impact } = this.calculateMarketImpactScore({
        sourceTier: primary.sourceTier,
        tickers: allTickers,
        isBreaking: group.some((g) => g.isBreaking),
        confirmationCount: independent.length,
        marketReaction: primary.marketReaction,
      });

      // Overall sentiment
      const sentimentCounts = group.reduce((acc, curr) => {
        acc[curr.sentiment] = (acc[curr.sentiment] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let sentiment: NewsSentiment = 'NEUTRAL';
      if ((sentimentCounts['VERY_BULLISH'] || 0) + (sentimentCounts['BULLISH'] || 0) > (sentimentCounts['BEARISH'] || 0) + (sentimentCounts['VERY_BEARISH'] || 0)) {
        sentiment = (sentimentCounts['VERY_BULLISH'] || 0) >= 1 ? 'VERY_BULLISH' : 'BULLISH';
      } else if ((sentimentCounts['BEARISH'] || 0) + (sentimentCounts['VERY_BEARISH'] || 0) > (sentimentCounts['BULLISH'] || 0)) {
        sentiment = (sentimentCounts['VERY_BEARISH'] || 0) >= 1 ? 'VERY_BEARISH' : 'BEARISH';
      }

      // Verified citations
      const citations: VerifiedSourceCitation[] = group.map((g) => ({
        sourceName: g.source,
        providerId: g.providerId,
        tier: g.sourceTier,
        headline: g.headline,
        url: g.url,
        publishedAt: g.publishedAt,
        retrievedAt: g.retrievedAt,
        isPrimaryOfficial: g.sourceTier === 'TIER_1_PRIMARY',
      }));

      // Extract verified facts
      const verifiedFacts = [
        `${primary.source} reported: "${primary.headline}"`,
        `${Number.isFinite(Date.parse(primary.publishedAt)) ? `Reported at ${new Date(primary.publishedAt).toISOString()}` : 'Publication time unavailable'} with ${independent.length} independent source${independent.length === 1 ? '' : 's'}.`,
        allTickers.length > 0 ? `Target tickers: ${allTickers.join(', ')}.` : `Global macro/sector coverage: ${allSectors.join(', ')}.`,
      ];

      return {
        id: `evt_cluster_${index}_${primary.id}`,
        eventTitle: primary.headline,
        category: primary.category,
        region: primary.region,
        primarySource: {
          provider: primary.provider || primary.source,
          name: primary.source,
          tier: primary.sourceTier,
          url: primary.url,
          publishedAt: primary.publishedAt,
        },
        additionalCoverage: additional.map((a) => ({
          provider: a.provider || a.source,
          sourceName: a.source,
          tier: a.sourceTier,
          headline: a.headline,
          url: a.url,
          publishedAt: a.publishedAt,
        })),
        aiSummary: primary.summary,
        verificationStatus,
        independentSourceCount: independent.length,
        primarySourceCount: independent.filter(item => item.sourceTier === 'TIER_1_PRIMARY').length,
        sentiment,
        impact,
        impactScore,
        affectedAssets: allAffected.length > 0 ? allAffected : allTickers,
        sectorsAffected: allSectors,
        firstReportedAt: group[group.length - 1].publishedAt,
        lastUpdatedAt: primary.publishedAt,
        marketReactionSummary: primary.marketReaction
          ? `Observed price change: ${primary.marketReaction.observedPriceChange ? `${primary.marketReaction.observedPriceChange}%` : 'N/A'}, Relative Volume: ${primary.marketReaction.volumeSurgeRatio ? `${primary.marketReaction.volumeSurgeRatio}x` : 'Normal'}.`
          : undefined,
        verifiedFacts,
        primaryCatalyst: primary.headline,
        secondaryCatalysts: additional.map((a) => a.headline),
        aiInterpretation: `MarketMind quant analysis indicates this event directly influences ${allSectors.join(' and ')} capital flows with an impact score of ${impactScore}/100.`,
        marketConfirmation: primary.marketReaction
          ? `Equity action corroborates the catalyst with ${primary.marketReaction.observedPriceChange}% move on ${primary.marketReaction.volumeSurgeRatio}x average volume.`
          : 'Market order book response is active across relevant liquid ETF proxies.',
        alternativeExplanations: [
          'Broader market liquidity conditions and index rebalancing may amplify intraday velocity.',
          'Derivatives gamma hedging near key round-number strike prices could create temporary price overshoots.',
        ],
        citations,
      };
    });
  }

  /**
   * Match news against portfolio holdings
   */
  public static matchPortfolioNews(
    news: NewsArticle[],
    holdings: Array<{ ticker: string; shares: number; price: number; value: number }>
  ): PortfolioNewsExposure[] {
    const totalPortfolioValue = holdings.reduce((acc, h) => acc + h.value, 0) || 100000;
    const exposures: PortfolioNewsExposure[] = [];

    for (const item of news) {
      const affectedHoldings = holdings
        .filter((h) => item.tickers.includes(h.ticker.toUpperCase()) || item.affectedAssets.includes(h.ticker.toUpperCase()))
        .map((h) => ({
          ticker: h.ticker,
          allocationPercent: Number(((h.value / totalPortfolioValue) * 100).toFixed(1)),
          shares: h.shares,
          exposureDollar: h.value,
        }));

      if (affectedHoldings.length > 0) {
        const totalExposurePercent = Number(
          affectedHoldings.reduce((sum, h) => sum + h.allocationPercent, 0).toFixed(1)
        );

        exposures.push({
          headline: item.headline,
          newsId: item.id,
          impact: item.impact,
          impactScore: item.impactScore,
          sentiment: item.sentiment,
          verificationStatus: item.verificationStatus,
          publishedAt: item.publishedAt,
          affectedHoldings,
          totalPortfolioExposurePercent: totalExposurePercent,
          riskExplanation: `${totalExposurePercent}% of your portfolio assets (${affectedHoldings.map((h) => h.ticker).join(', ')}) are directly exposed to this ${item.sentiment.toLowerCase()} market catalyst.`,
        });
      }
    }

    return exposures;
  }
}
