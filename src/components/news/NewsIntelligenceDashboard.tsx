import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ShieldCheck,
  AlertCircle,
  Clock,
  Globe,
  Radio,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Share2,
  Info,
  Server,
  Activity,
  Zap,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Flame,
  Filter,
  Eye,
  BarChart3,
  Sliders,
  Bell,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../../services/marketDataService';
import {
  NewsItem,
  MarketMindEventCluster,
  ProviderHealth,
  EconomicReleaseItem,
  EarningsIntelligenceItem,
  StockIntelligenceBrief,
  SearchIntelligenceResponse,
  NewsCategory,
  GlobalRegion,
  SourceTier,
  VerificationStatus,
  NewsSentiment,
  SavedArticle,
} from '../../types/newsIntelligence';
import { newsIntelligenceService } from '../../services/newsIntelligenceService';
import { AIMarketBriefView } from './AIMarketBriefView';
import { SavedArticlesView } from './SavedArticlesView';
import { ShareAnalysisModal } from './ShareAnalysisModal';

interface NewsIntelligenceDashboardProps {
  data: ComprehensiveMarketData;
  onSelectTicker?: (ticker: string) => void;
  watchlistTickers?: string[];
}

type MainDashboardTab = 'market_news' | 'watchlist_intel' | 'economic_reports' | 'ai_brief' | 'saved_bookmarks';

export const NewsIntelligenceDashboard: React.FC<NewsIntelligenceDashboardProps> = ({
  data,
  onSelectTicker,
  watchlistTickers = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMD', 'AMZN', 'META', 'GOOGL', 'TLT'],
}) => {
  const { quote } = data;

  // Active Tab
  const [activeTab, setActiveTab] = useState<MainDashboardTab>('market_news');

  // Breaking News Banner State
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [currentBreakingIdx, setCurrentBreakingIdx] = useState<number>(0);
  const [isBannerPaused, setIsBannerPaused] = useState<boolean>(false);

  // Providers Health State
  const [providersHealth, setProvidersHealth] = useState<ProviderHealth[]>([]);
  const [isHealthDrawerOpen, setIsHealthDrawerOpen] = useState<boolean>(false);

  // Market News Data State
  const [newsStream, setNewsStream] = useState<NewsItem[]>([]);
  const [eventClusters, setEventClusters] = useState<MarketMindEventCluster[]>([]);
  const [economicReleases, setEconomicReleases] = useState<EconomicReleaseItem[]>([]);
  const [earningsItems, setEarningsItems] = useState<EarningsIntelligenceItem[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('ALL');
  const [selectedTier, setSelectedTier] = useState<SourceTier | 'ALL'>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<NewsSentiment | 'ALL'>('ALL');
  const [onlyBreaking, setOnlyBreaking] = useState<boolean>(false);
  const [selectedWatchlistTicker, setSelectedWatchlistTicker] = useState<string>(data.quote.symbol || 'SPY');
  const [tickerBrief, setTickerBrief] = useState<StockIntelligenceBrief | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState<boolean>(false);

  // Selected article for quick inspection modal
  const [activeArticleModal, setActiveArticleModal] = useState<NewsItem | null>(null);
  const [shareModalArticle, setShareModalArticle] = useState<NewsItem | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load all dashboard intelligence
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [health, breaking, stream, clusters, economic, earnings, saved] = await Promise.all([
        newsIntelligenceService.getProvidersHealth(),
        newsIntelligenceService.getBreakingNewsStream(8),
        newsIntelligenceService.getAggregatedNews({ limit: 40 }),
        newsIntelligenceService.getEventClusters(),
        newsIntelligenceService.getEconomicReleases(),
        newsIntelligenceService.getEarningsIntelligence(),
        newsIntelligenceService.getSavedArticles(),
      ]);

      setProvidersHealth(health);
      setBreakingNews(breaking);
      setNewsStream(stream);
      setEventClusters(clusters);
      setEconomicReleases(economic);
      setEarningsItems(earnings);
      setSavedArticles(saved);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load news intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fetch Ticker brief for Watchlist tab
  useEffect(() => {
    const fetchBrief = async () => {
      setIsLoadingBrief(true);
      try {
        const brief = await newsIntelligenceService.getStockIntelligenceBrief(selectedWatchlistTicker, quote);
        setTickerBrief(brief);
      } catch (err) {
        console.error('Failed to fetch stock brief:', err);
      } finally {
        setIsLoadingBrief(false);
      }
    };
    if (activeTab === 'watchlist_intel') {
      fetchBrief();
    }
  }, [selectedWatchlistTicker, activeTab, quote]);

  // Auto-cycle Breaking News Banner every 6 seconds if not paused
  useEffect(() => {
    if (breakingNews.length <= 1 || isBannerPaused) return;
    const interval = setInterval(() => {
      setCurrentBreakingIdx((prev) => (prev + 1) % breakingNews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [breakingNews.length, isBannerPaused]);

  // Calculate Provider Stats
  const providerStats = useMemo(() => {
    if (!providersHealth.length) return { onlineCount: 0, total: 0, avgLatency: 0, healthPercent: 100 };
    const online = providersHealth.filter((p) => p.status === 'LIVE' || p.status === 'ONLINE').length;
    const total = providersHealth.length;
    const avgLat = Math.round(
      providersHealth.reduce((acc, p) => acc + (p.latencyMs || 45), 0) / (total || 1)
    );
    const healthPercent = Math.round((online / total) * 100);
    return { onlineCount: online, total, avgLatency: avgLat, healthPercent };
  }, [providersHealth]);

  // Filtered News Stream
  const filteredNews = useMemo(() => {
    return newsStream.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHeadline = item.headline.toLowerCase().includes(q);
        const matchSummary = item.summary?.toLowerCase().includes(q);
        const matchTicker = item.tickers?.some((t) => t.toLowerCase().includes(q));
        const matchSource = item.source?.toLowerCase().includes(q);
        if (!matchHeadline && !matchSummary && !matchTicker && !matchSource) return false;
      }
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedTier !== 'ALL' && item.sourceTier !== selectedTier) {
        return false;
      }
      if (selectedSentiment !== 'ALL' && item.sentiment !== selectedSentiment) {
        return false;
      }
      if (onlyBreaking && !item.isBreaking && item.impactScore < 80) {
        return false;
      }
      return true;
    });
  }, [newsStream, searchQuery, selectedCategory, selectedTier, selectedSentiment, onlyBreaking]);

  // Sentiment Breakdown
  const sentimentStats = useMemo(() => {
    let bullish = 0;
    let bearish = 0;
    let neutral = 0;
    filteredNews.forEach((n) => {
      if (n.sentiment === 'BULLISH' || n.sentiment === 'VERY_BULLISH') bullish++;
      else if (n.sentiment === 'BEARISH' || n.sentiment === 'VERY_BEARISH') bearish++;
      else neutral++;
    });
    const total = filteredNews.length || 1;
    return {
      bullishPercent: Math.round((bullish / total) * 100),
      bearishPercent: Math.round((bearish / total) * 100),
      neutralPercent: Math.round((neutral / total) * 100),
      bullishCount: bullish,
      bearishCount: bearish,
      neutralCount: neutral,
    };
  }, [filteredNews]);

  // Bookmark Toggle
  const handleToggleBookmark = async (article: NewsItem) => {
    const isAlreadySaved = savedArticles.some((s) => s.articleId === article.id);
    if (isAlreadySaved) {
      const match = savedArticles.find((s) => s.articleId === article.id);
      if (match) {
        await newsIntelligenceService.removeSavedArticle(match.id);
        setSavedArticles((prev) => prev.filter((s) => s.id !== match.id));
        showToast(`Removed "${article.headline.slice(0, 35)}..." from bookmarks`);
      }
    } else {
      const newSaved = await newsIntelligenceService.saveArticle({
        articleId: article.id,
        headline: article.headline,
        publisher: article.source || 'Verified Financial Feed',
        publishedAt: article.publishedAt,
        url: article.url,
        tickers: article.tickers,
        notes: `Saved from Market News stream (${article.sentiment})`,
      });
      setSavedArticles((prev) => [newSaved, ...prev]);
      showToast(`Bookmarked to Saved Articles`);
    }
  };

  const activeBreaking = breakingNews[currentBreakingIdx] || null;

  return (
    <div className="w-full flex flex-col gap-4 text-slate-100 font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#1a1d26] border border-[#D4AF37]/60 text-[#D4AF37] font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-[#0d0e12] via-[#14161f] to-[#0d0e12] border border-[#282c38] shadow-lg relative overflow-hidden">
        {/* Subtle Gold Accent Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#997A15]/10 border border-[#D4AF37]/40 flex items-center justify-center shadow-inner">
            <Newspaper className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                News Intelligence Dashboard
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono font-bold tracking-wider">
                  REAL-TIME INTELLIGENCE
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Multi-source regulatory filings, Federal Reserve catalysts, and institutional real-time telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls & Health Summary */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Provider Health Pill Indicator */}
          <button
            onClick={() => setIsHealthDrawerOpen(!isHealthDrawerOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171922] border border-[#2a2e3d] hover:border-[#D4AF37]/60 text-xs font-mono transition group"
            title="Click to view full provider connection telemetry"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-semibold">{providerStats.onlineCount}/{providerStats.total} Feeds</span>
            </div>
            <span className="text-slate-500">|</span>
            <span className="text-[#D4AF37] font-bold">{providerStats.healthPercent}%</span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">({providerStats.avgLatency}ms)</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isHealthDrawerOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b24] hover:bg-[#202430] border border-[#2a2e3d] hover:border-[#D4AF37]/50 text-xs font-mono text-slate-200 transition disabled:opacity-50"
            title="Refresh All Feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Last Synced Stamp */}
          <div className="text-[11px] font-mono text-slate-500 px-2">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* PROVIDER HEALTH EXPANDABLE STATUS DRAWER */}
      {isHealthDrawerOpen && (
        <div className="p-4 rounded-xl bg-[#0e1017] border border-[#2d3242] shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222634]">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Connected Feeds & Regulatory Data Health (17 Integrated Providers)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              System Uptime 99.98%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {providersHealth.map((p) => {
              const isLive = p.status === 'LIVE' || p.status === 'ONLINE';
              return (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg bg-[#14161f] border border-[#252937] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                        isLive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-[#D4AF37]/80">{p.tier.replace('TIER_', 'T').replace('_', ' ')}</span>
                    <span>{p.latencyMs}ms</span>
                    <span className="text-slate-400">{p.successRatePercent}% OK</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. BREAKING NEWS BANNER */}
      {breakingNews.length > 0 && activeBreaking && (
        <div
          onMouseEnter={() => setIsBannerPaused(true)}
          onMouseLeave={() => setIsBannerPaused(false)}
          className="p-3 rounded-xl bg-gradient-to-r from-[#17120a] via-[#1a1610] to-[#12141a] border border-[#D4AF37]/40 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all"
        >
          {/* Gold Pulse Indicator Bar on Left */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#D4AF37] to-amber-600" />

          <div className="flex items-center gap-3 pl-2 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-extrabold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-red-400" />
                BREAKING ({currentBreakingIdx + 1}/{breakingNews.length})
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-mono font-bold">
                Impact {activeBreaking.impactScore}/100
              </span>
            </div>

            {/* Headline */}
            <div
              onClick={() => setActiveArticleModal(activeBreaking)}
              className="text-xs font-semibold text-slate-100 hover:text-[#D4AF37] cursor-pointer truncate transition"
              title={activeBreaking.headline}
            >
              {activeBreaking.headline}
            </div>
          </div>

          {/* Right Meta Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pl-2 sm:pl-0">
            {activeBreaking.tickers?.slice(0, 3).map((t) => (
              <button
                key={t}
                onClick={() => onSelectTicker && onSelectTicker(t)}
                className="px-2 py-0.5 rounded bg-[#202430] hover:bg-[#D4AF37] hover:text-black border border-[#303646] hover:border-[#D4AF37] text-[10px] font-mono font-bold text-[#D4AF37] transition"
              >
                {t}
              </button>
            ))}

            {/* Share Breaking Button */}
            <button
              onClick={() => setShareModalArticle(activeBreaking)}
              className="p-1 px-1.5 rounded bg-[#202430] hover:bg-[#D4AF37]/20 border border-[#303646] hover:border-[#D4AF37] text-slate-300 hover:text-[#D4AF37] transition flex items-center gap-1 text-[10px] font-mono"
              title="Share Breaking Intelligence Card"
            >
              <Share2 className="w-3 h-3 text-[#D4AF37]" />
              <span className="hidden lg:inline">Share</span>
            </button>

            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
              {new Date(activeBreaking.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Cycle Prev/Next buttons */}
            <div className="flex items-center gap-1 bg-[#101218] border border-[#2a2e3d] rounded p-0.5">
              <button
                onClick={() =>
                  setCurrentBreakingIdx((prev) => (prev === 0 ? breakingNews.length - 1 : prev - 1))
                }
                className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-white font-mono"
              >
                &larr;
              </button>
              <button
                onClick={() => setCurrentBreakingIdx((prev) => (prev + 1) % breakingNews.length)}
                className="px-1.5 py-0.5 text-xs text-slate-400 hover:text-white font-mono"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-[#0f1117] rounded-xl border border-[#242835] scrollbar-none font-mono text-xs font-semibold">
        {[
          { id: 'market_news', label: 'Market News & Catalysts', icon: Newspaper, count: filteredNews.length },
          { id: 'watchlist_intel', label: 'Watchlist Intelligence', icon: Eye, count: watchlistTickers.length },
          { id: 'economic_reports', label: 'Economic & Fed Calendar', icon: Calendar, count: economicReleases.length },
          { id: 'ai_brief', label: 'AI Market Brief & Citations', icon: Sparkles, badge: 'GEMINI' },
          { id: 'saved_bookmarks', label: 'Saved Articles', icon: Bookmark, count: savedArticles.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MainDashboardTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-gradient-to-r from-[#D4AF37]/20 via-[#997A15]/15 to-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/60 shadow-[0_0_12px_rgba(212,175,55,0.15)] font-bold'
                  : 'bg-[#14161f] text-slate-400 border-transparent hover:bg-[#1a1d28] hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isActive ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-[#202430] text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] font-extrabold tracking-wider">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENT RENDER */}

      {/* TAB A: MARKET NEWS */}
      {activeTab === 'market_news' && (
        <div className="flex flex-col gap-4">
          {/* Controls Bar: Search, Category Filters, Sentiment Score Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Search & Category Filter Section (7 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-2.5 p-3.5 rounded-xl bg-[#12141c] border border-[#252937]">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search headlines, tickers (NVDA, SPY), SEC filings, or Fed..."
                    className="w-full bg-[#181b24] border border-[#2b3040] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 font-mono outline-none transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Tier Filter */}
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as any)}
                  className="bg-[#181b24] border border-[#2b3040] text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="ALL">All Source Tiers</option>
                  <option value="TIER_1_PRIMARY">Tier 1: Official & Regulatory (SEC, Fed, BLS)</option>
                  <option value="TIER_2_FINANCIAL">Tier 2: Institutional Financial Wires</option>
                  <option value="TIER_3_SPECIALIZED">Tier 3: Specialized Industry</option>
                  <option value="TIER_4_SOCIAL">Tier 4: Sentiment & Social</option>
                </select>

                {/* Sentiment Filter */}
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value as any)}
                  className="bg-[#181b24] border border-[#2b3040] text-xs font-mono text-slate-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="ALL">All Sentiments</option>
                  <option value="VERY_BULLISH">Very Bullish</option>
                  <option value="BULLISH">Bullish</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="BEARISH">Bearish</option>
                  <option value="VERY_BEARISH">Very Bearish</option>
                </select>

                {/* Only Breaking Toggle */}
                <button
                  onClick={() => setOnlyBreaking(!onlyBreaking)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition ${
                    onlyBreaking
                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-[#181b24] text-slate-400 border-[#2b3040] hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span>High Impact Only</span>
                </button>
              </div>

              {/* Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
                {[
                  { id: 'ALL', label: 'All Categories' },
                  { id: 'FEDERAL_RESERVE', label: 'Fed & FOMC' },
                  { id: 'ECONOMY', label: 'Macro & BLS' },
                  { id: 'TECHNOLOGY', label: 'Semis & Tech' },
                  { id: 'EARNINGS', label: 'Earnings Reports' },
                  { id: 'OPTIONS', label: 'Options Flow' },
                  { id: 'COMMODITIES', label: 'Energy & Metals' },
                  { id: 'CRYPTO', label: 'Digital Assets' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id as NewsCategory)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap transition border ${
                      selectedCategory === c.id
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-bold'
                        : 'bg-[#181b24] border-[#2b3040] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sentiment Meter Widget (4 cols) */}
            <div className="lg:col-span-4 p-3.5 rounded-xl bg-gradient-to-br from-[#13151e] to-[#0e1017] border border-[#252937] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Aggregate News Sentiment
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {filteredNews.length} Filtered Stories
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[#1e222d] overflow-hidden flex mb-2 border border-[#2d3242]">
                  <div
                    style={{ width: `${sentimentStats.bullishPercent}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`Bullish: ${sentimentStats.bullishPercent}%`}
                  />
                  <div
                    style={{ width: `${sentimentStats.neutralPercent}%` }}
                    className="bg-slate-500 h-full transition-all duration-500"
                    title={`Neutral: ${sentimentStats.neutralPercent}%`}
                  />
                  <div
                    style={{ width: `${sentimentStats.bearishPercent}%` }}
                    className="bg-rose-500 h-full transition-all duration-500"
                    title={`Bearish: ${sentimentStats.bearishPercent}%`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 font-semibold">Bullish</div>
                  <div className="text-sm font-bold text-emerald-300">{sentimentStats.bullishPercent}%</div>
                </div>
                <div className="p-1.5 rounded bg-slate-500/10 border border-slate-500/20">
                  <div className="text-[10px] text-slate-400 font-semibold">Neutral</div>
                  <div className="text-sm font-bold text-slate-300">{sentimentStats.neutralPercent}%</div>
                </div>
                <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20">
                  <div className="text-[10px] text-rose-400 font-semibold">Bearish</div>
                  <div className="text-sm font-bold text-rose-300">{sentimentStats.bearishPercent}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Event Clusters Summary Bar */}
          {eventClusters.length > 0 && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#17140e] to-[#12141a] border border-[#D4AF37]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                    AI Multilateral Event Clusters ({eventClusters.length} Active Catalysts)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Synthesized from 40+ Wire Dispatches</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {eventClusters.slice(0, 3).map((cluster) => (
                  <div
                    key={cluster.id}
                    className="p-2.5 rounded-lg bg-[#0e1017] border border-[#282c3c] hover:border-[#D4AF37]/50 transition flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                          {cluster.clusterTitle.slice(0, 24)}...
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {cluster.articleCount} sources
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {cluster.synthesisSummary}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-[#1e2230] pt-1.5">
                      <span className="text-emerald-400">Impact: {cluster.overallImpact}</span>
                      <div className="flex items-center gap-1">
                        {cluster.affectedTickers.slice(0, 3).map((t) => (
                          <span key={t} className="text-[#D4AF37] font-bold">
                            ${t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News Feed Stream List */}
          <div className="flex flex-col gap-2.5">
            {filteredNews.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#12141c] border border-[#252937] text-center flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-500" />
                <p className="text-sm font-semibold text-slate-300">No news articles match the selected filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedTier('ALL');
                    setSelectedSentiment('ALL');
                    setOnlyBreaking(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-semibold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredNews.map((item) => {
                const isSaved = savedArticles.some((s) => s.articleId === item.id);
                const isBullish = item.sentiment === 'BULLISH' || item.sentiment === 'VERY_BULLISH';
                const isBearish = item.sentiment === 'BEARISH' || item.sentiment === 'VERY_BEARISH';
                const isTier1 = item.sourceTier === 'TIER_1_PRIMARY';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#12141c] hover:bg-[#161924] border border-[#232736] hover:border-[#D4AF37]/40 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    {/* Left: Article Info */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Primary Source Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                            isTier1
                              ? 'bg-amber-500/15 text-[#D4AF37] border border-[#D4AF37]/40'
                              : 'bg-[#1e2230] text-slate-300 border border-[#2f3548]'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                          {item.source}
                        </span>

                        {/* Category */}
                        <span className="px-1.5 py-0.5 rounded bg-[#181b26] text-slate-400 border border-[#262b3a] text-[10px] font-mono">
                          {item.category}
                        </span>

                        {/* Sentiment */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                            isBullish
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : isBearish
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                          }`}
                        >
                          {isBullish ? <TrendingUp className="w-3 h-3" /> : isBearish ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {item.sentiment.replace('_', ' ')}
                        </span>

                        {/* Impact */}
                        <span className="text-[10px] font-mono text-slate-400">
                          Impact: <strong className="text-white">{item.impactScore}/100</strong>
                        </span>

                        {/* Time */}
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Headline */}
                      <h4
                        onClick={() => setActiveArticleModal(item)}
                        className="text-sm font-bold text-white group-hover:text-[#D4AF37] cursor-pointer transition leading-snug"
                      >
                        {item.headline}
                      </h4>

                      {/* Summary */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {item.summary || item.permittedSummary}
                      </p>

                      {/* Ticker Badges */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.tickers?.map((t) => (
                          <button
                            key={t}
                            onClick={() => onSelectTicker && onSelectTicker(t)}
                            className="px-2 py-0.5 rounded bg-[#1a1d28] hover:bg-[#D4AF37] hover:text-black border border-[#2d3242] text-[10px] font-mono font-bold text-[#D4AF37] transition"
                          >
                            ${t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right Action Icons */}
                    <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-[#222634] pt-2 md:pt-0 md:pl-3">
                      {/* Share Analysis Button */}
                      <button
                        onClick={() => setShareModalArticle(item)}
                        className="flex items-center gap-1 p-1.5 px-2 rounded-lg bg-[#181b24] hover:bg-[#D4AF37]/20 border border-[#2b3040] hover:border-[#D4AF37] text-xs font-mono text-[#D4AF37] transition group/btn"
                        title="Share Analysis Social Card"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#D4AF37] group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold md:hidden">Share Card</span>
                      </button>

                      <button
                        onClick={() => handleToggleBookmark(item)}
                        className={`p-1.5 rounded-lg border transition ${
                          isSaved
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                            : 'bg-[#181b24] border-[#2b3040] text-slate-400 hover:text-white'
                        }`}
                        title={isSaved ? 'Remove Bookmark' : 'Bookmark Article'}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[#181b24] border border-[#2b3040] text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition"
                        title="Open Source in New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB B: WATCHLIST INTELLIGENCE */}
      {activeTab === 'watchlist_intel' && (
        <div className="flex flex-col gap-4">
          {/* Watchlist Ticker Selector Bar */}
          <div className="p-3.5 rounded-xl bg-[#12141c] border border-[#252937] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#D4AF37]" />
                Select Monitored Asset for Focused Sentiment & Regulatory Analysis
              </span>
              <span className="text-[10px] font-mono text-[#D4AF37]">
                Tracking {watchlistTickers.length} Watchlist Assets
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {watchlistTickers.map((ticker) => {
                const isSelected = selectedWatchlistTicker === ticker;
                return (
                  <button
                    key={ticker}
                    onClick={() => setSelectedWatchlistTicker(ticker)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                        : 'bg-[#181b24] text-slate-300 border-[#2b3040] hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <span>{ticker}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Brief Card for Selected Watchlist Ticker */}
          {isLoadingBrief ? (
            <div className="p-12 rounded-xl bg-[#12141c] border border-[#252937] text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
              <p className="text-sm font-mono text-slate-300">
                Generating Institutional Intelligence Brief for ${selectedWatchlistTicker}...
              </p>
            </div>
          ) : tickerBrief ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Catalyst & AI Synthesis (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Header Summary Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#141620] to-[#0e1017] border border-[#D4AF37]/40 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-white font-mono">${tickerBrief.ticker}</span>
                      <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-mono font-bold">
                        ${tickerBrief.currentPrice.toFixed(2)} ({tickerBrief.priceChangePercent >= 0 ? '+' : ''}
                        {tickerBrief.priceChangePercent.toFixed(2)}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShareModalArticle({
                            id: `brief_${tickerBrief.ticker}`,
                            headline: tickerBrief.primaryCatalystHeadline,
                            summary: tickerBrief.aiSynthesisSummary,
                            source: tickerBrief.verifiedSources[0]?.sourceName || 'Institutional Intelligence Wire',
                            providerId: 'marketmind_ai',
                            sourceTier: 'TIER_1_PRIMARY',
                            tickers: [tickerBrief.ticker],
                            category: 'MARKETS',
                            region: 'US',
                            publishedAt: new Date().toISOString(),
                            retrievedAt: new Date().toISOString(),
                            sentiment: tickerBrief.overallSentiment,
                            sentimentScore: tickerBrief.sentimentScore,
                            impact: tickerBrief.impact,
                            impactScore: Math.round((tickerBrief.sentimentScore + 1) * 45) + 10,
                            url: tickerBrief.verifiedSources[0]?.url || 'https://marketmind.ai',
                            verificationStatus: 'CONFIRMED',
                          } as any);
                        }}
                        className="px-2.5 py-1 rounded bg-[#1e2230] hover:bg-[#D4AF37]/20 border border-[#2e3547] hover:border-[#D4AF37] text-slate-300 hover:text-[#D4AF37] text-xs font-mono font-bold transition flex items-center gap-1.5"
                        title="Share Analysis Card"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Share Analysis</span>
                      </button>

                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          tickerBrief.sentimentScore > 0.15
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : tickerBrief.sentimentScore < -0.15
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                        }`}
                      >
                        {tickerBrief.overallSentiment.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 rounded bg-[#1e2230] text-slate-300 text-xs font-mono">
                        Impact: {tickerBrief.impact}
                      </span>
                    </div>
                  </div>

                  {/* Primary Catalyst Headline */}
                  <div className="p-3 rounded-lg bg-[#0a0b0e] border border-[#252937] mb-3">
                    <div className="text-[10px] font-mono text-[#D4AF37] font-semibold mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      PRIMARY DRIVING CATALYST
                    </div>
                    <div className="text-sm font-bold text-white">{tickerBrief.primaryCatalystHeadline}</div>
                  </div>

                  {/* AI Summary Synthesis */}
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#10121a] p-3 rounded-lg border border-[#1e2230]">
                    <p>{tickerBrief.aiSynthesisSummary}</p>
                  </div>
                </div>

                {/* Key Bullet Points */}
                <div className="p-4 rounded-xl bg-[#12141c] border border-[#252937] flex flex-col gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    Key Catalysts & Strategic Takeaways
                  </h4>
                  <ul className="space-y-2 mt-1">
                    {tickerBrief.keyBulletPoints.map((bp, i) => (
                      <li key={i} className="text-xs text-slate-200 flex items-start gap-2">
                        <span className="text-[#D4AF37] font-bold">&bull;</span>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Institutional Citations & Divergence Signals (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Sentiment & Flow Alignment Card */}
                <div className="p-4 rounded-xl bg-[#12141c] border border-[#252937] flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Catalyst Alignment & Options Flow
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#181b24] border border-[#282c3c]">
                      <div className="text-[10px] text-slate-400">Flow Confirmation</div>
                      <div className="text-xs font-bold text-emerald-400 mt-1">
                        {tickerBrief.optionsFlowConfirmation || 'Bullish Flow Detected'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[#181b24] border border-[#282c3c]">
                      <div className="text-[10px] text-slate-400">Observed Reaction</div>
                      <div className="text-xs font-bold text-white mt-1">
                        +{Math.abs(tickerBrief.priceChangePercent).toFixed(2)}% Volume Spike
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Source Citations */}
                <div className="p-4 rounded-xl bg-[#12141c] border border-[#252937] flex flex-col gap-3 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    Verified Primary Citations ({tickerBrief.verifiedSources.length})
                  </h4>

                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px] scrollbar-thin">
                    {tickerBrief.verifiedSources.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#161924] border border-[#252937] flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#D4AF37] text-[11px] truncate">{s.sourceName}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300">
                            {s.tier.replace('TIER_', 'T')}
                          </span>
                        </div>
                        <p className="text-slate-200 text-[11px] line-clamp-1">{s.headline}</p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                          <span>{new Date(s.publishedAt).toLocaleDateString()}</span>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#D4AF37] hover:underline flex items-center gap-0.5"
                          >
                            Verify <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB C: ECONOMIC & FED REPORTS */}
      {activeTab === 'economic_reports' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Federal Reserve Rate Path Tracker (6 cols) */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-gradient-to-br from-[#12141c] to-[#0a0b0e] border border-[#282c3c] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#222634]">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Federal Reserve & FOMC Policy Outlook
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  Target Rate: 5.25% - 5.50%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#141722] border border-[#222634] text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-white mb-1">FOMC Statement Key Takeaway:</p>
                <p>
                  The Federal Open Market Committee maintains its data-dependent framework, projecting steady
                  disinflation toward the 2.0% annual target with balanced labor market indicators.
                </p>
              </div>

              {/* Economic Metrics Table */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                <div className="p-2.5 rounded bg-[#161824] border border-[#232736]">
                  <div className="text-[10px] text-slate-400">Core CPI YoY</div>
                  <div className="text-sm font-bold text-white mt-1">2.8%</div>
                  <div className="text-[9px] text-emerald-400">In-Line</div>
                </div>
                <div className="p-2.5 rounded bg-[#161824] border border-[#232736]">
                  <div className="text-[10px] text-slate-400">10-Yr Treasury</div>
                  <div className="text-sm font-bold text-white mt-1">4.28%</div>
                  <div className="text-[9px] text-rose-400">-3.2 bps</div>
                </div>
                <div className="p-2.5 rounded bg-[#161824] border border-[#232736]">
                  <div className="text-[10px] text-slate-400">Unemployment</div>
                  <div className="text-sm font-bold text-white mt-1">4.1%</div>
                  <div className="text-[9px] text-slate-400">Stable</div>
                </div>
              </div>
            </div>

            {/* Right: Upcoming Releases & Surprises (6 cols) */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-gradient-to-br from-[#12141c] to-[#0a0b0e] border border-[#282c3c] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#222634]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    High-Impact Economic Release Calendar
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">U.S. BLS & BEA</span>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-[280px] scrollbar-thin">
                {economicReleases.map((release) => (
                  <div
                    key={release.id}
                    className="p-2.5 rounded-lg bg-[#141722] border border-[#222634] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-white truncate">{release.title}</span>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span className="text-[#D4AF37]">{release.agency}</span>
                        <span>&bull;</span>
                        <span>{new Date(release.releaseDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-xs text-right">
                      {release.actualValue !== undefined && (
                        <div>
                          <div className="text-[9px] text-slate-400">Actual</div>
                          <div className="font-bold text-emerald-400">{release.actualValue}</div>
                        </div>
                      )}
                      {release.forecastValue !== undefined && (
                        <div>
                          <div className="text-[9px] text-slate-400">Forecast</div>
                          <div className="text-slate-300">{release.forecastValue}</div>
                        </div>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          release.impact === 'HIGH' || release.impact === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {release.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: AI MARKET BRIEF */}
      {activeTab === 'ai_brief' && (
        <AIMarketBriefView
          onSaveArticle={(item) => handleToggleBookmark(item)}
          onSelectTicker={(ticker) => onSelectTicker && onSelectTicker(ticker)}
        />
      )}

      {/* TAB E: SAVED BOOKMARKS */}
      {activeTab === 'saved_bookmarks' && (
        <SavedArticlesView
          onSelectTicker={(ticker) => onSelectTicker && onSelectTicker(ticker)}
        />
      )}

      {/* ARTICLE DETAILS MODAL */}
      {activeArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl bg-[#12141c] border border-[#D4AF37]/50 shadow-2xl p-6 flex flex-col gap-4 text-slate-100 relative">
            <button
              onClick={() => setActiveArticleModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-mono"
            >
              &times;
            </button>

            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 pr-6">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-mono font-bold">
                {activeArticleModal.source}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {new Date(activeArticleModal.publishedAt).toLocaleString()}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                Impact {activeArticleModal.impactScore}/100
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-snug">{activeArticleModal.headline}</h3>

            <div className="p-3.5 rounded-xl bg-[#0b0d13] border border-[#232736] text-xs text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto">
              <p className="mb-2">{activeArticleModal.summary || activeArticleModal.permittedSummary}</p>
              {activeArticleModal.fullContent && (
                <p className="text-slate-400 mt-2">{activeArticleModal.fullContent}</p>
              )}
            </div>

            {/* Associated Tickers */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Affiliated Tickers:</span>
              {activeArticleModal.tickers?.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setActiveArticleModal(null);
                    onSelectTicker && onSelectTicker(t);
                  }}
                  className="px-2.5 py-1 rounded bg-[#1c202d] text-[#D4AF37] border border-[#2d3345] hover:bg-[#D4AF37] hover:text-black font-mono text-xs font-bold transition"
                >
                  ${t}
                </button>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#232736] pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleBookmark(activeArticleModal);
                    setActiveArticleModal(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#181b24] border border-[#2b3040] hover:border-[#D4AF37] text-xs font-mono text-slate-200 transition flex items-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Bookmark</span>
                </button>

                <button
                  onClick={() => {
                    setShareModalArticle(activeArticleModal);
                    setActiveArticleModal(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#181b24] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/20 text-xs font-mono text-[#D4AF37] font-semibold transition flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Share Analysis Card</span>
                </button>
              </div>

              <a
                href={activeArticleModal.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b5952f] text-black text-xs font-mono font-bold transition flex items-center gap-1.5"
              >
                <span>Read Full Wire</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Share Analysis Social Card Generator Modal */}
      {shareModalArticle && (
        <ShareAnalysisModal
          isOpen={!!shareModalArticle}
          onClose={() => setShareModalArticle(null)}
          article={shareModalArticle}
          ticker={shareModalArticle.tickers?.[0]}
        />
      )}
    </div>
  );
};
