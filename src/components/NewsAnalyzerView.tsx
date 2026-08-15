import React, { useState, useEffect, useMemo } from 'react';
import {
  Newspaper,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  ExternalLink,
  Search,
  ShieldCheck,
  AlertCircle,
  Clock,
  Globe,
  Building2,
  Cpu,
  Coins,
  Flame,
  Radio,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
  DollarSign,
  Share2,
  Info,
  Server,
  Activity,
  Zap,
  Briefcase,
  Bell,
  Sliders,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  X,
  Bookmark,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
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
  PortfolioNewsExposure,
  NewsAlertRule,
} from '../types/newsIntelligence';
import { newsIntelligenceService } from '../services/newsIntelligenceService';
import { AIMarketBriefView } from './news/AIMarketBriefView';
import { AdminNewsSourcesView } from './news/AdminNewsSourcesView';
import { SavedArticlesView } from './news/SavedArticlesView';

interface NewsAnalyzerViewProps {
  data: ComprehensiveMarketData;
}

type NewsSubTab =
  | 'ai_brief'
  | 'events'
  | 'stream'
  | 'why_moving'
  | 'portfolio'
  | 'economic'
  | 'earnings'
  | 'providers'
  | 'bookmarks'
  | 'alerts';

export const NewsAnalyzerView: React.FC<NewsAnalyzerViewProps> = ({ data }) => {
  const { quote } = data;
  const [activeSubTab, setActiveSubTab] = useState<NewsSubTab>('ai_brief');

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<SearchIntelligenceResponse | null>(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<GlobalRegion>('GLOBAL');
  const [selectedTier, setSelectedTier] = useState<SourceTier | 'ALL'>('ALL');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<NewsSentiment | 'ALL'>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<VerificationStatus | 'ALL'>('ALL');
  const [onlyBreaking, setOnlyBreaking] = useState<boolean>(false);

  // Data states
  const [newsStream, setNewsStream] = useState<NewsItem[]>([]);
  const [eventClusters, setEventClusters] = useState<MarketMindEventCluster[]>([]);
  const [breakingStream, setBreakingStream] = useState<NewsItem[]>([]);
  const [economicEvents, setEconomicEvents] = useState<EconomicReleaseItem[]>([]);
  const [earningsItems, setEarningsItems] = useState<EarningsIntelligenceItem[]>([]);
  const [providersHealth, setProvidersHealth] = useState<ProviderHealth[]>([]);
  const [stockBrief, setStockBrief] = useState<StockIntelligenceBrief | null>(null);
  const [briefTicker, setBriefTicker] = useState<string>(quote.ticker || 'SPY');
  const [portfolioExposures, setPortfolioExposures] = useState<PortfolioNewsExposure[]>([]);
  const [alertRules, setAlertRules] = useState<NewsAlertRule[]>([]);
  const [savedArticlesCount, setSavedArticlesCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  // UI state
  const [expandedEventId, setExpandedEventId] = useState<string | null>('evt_cluster_0_sec_nvda_form8k_capex_guidance');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [selectedEventForModal, setSelectedEventForModal] = useState<MarketMindEventCluster | null>(null);

  // Mock User Portfolio Holdings
  const userHoldings = [
    { ticker: 'NVDA', shares: 120, price: 128.60, value: 15432 },
    { ticker: 'SPY', shares: 80, price: 512.48, value: 40998 },
    { ticker: 'AAPL', shares: 95, price: 224.20, value: 21299 },
    { ticker: 'TSLA', shares: 50, price: 218.40, value: 10920 },
    { ticker: 'MSFT', shares: 40, price: 428.90, value: 17156 },
  ];

  // Initial load
  const loadAllIntelligence = async () => {
    setIsLoading(true);
    try {
      const [stream, events, breaking, econ, earn, health, brief, exposures] = await Promise.all([
        newsIntelligenceService.getAggregatedNews(),
        newsIntelligenceService.getEventClusters(),
        newsIntelligenceService.getBreakingNewsStream(8),
        newsIntelligenceService.getEconomicReleases(),
        newsIntelligenceService.getEarningsIntelligence(),
        newsIntelligenceService.getProvidersHealth(),
        newsIntelligenceService.getStockIntelligenceBrief(briefTicker, quote),
        newsIntelligenceService.getPortfolioNewsExposure(userHoldings),
      ]);

      setNewsStream(stream);
      setEventClusters(events);
      setBreakingStream(breaking);
      setEconomicEvents(econ);
      setEarningsItems(earn);
      setProvidersHealth(health);
      setStockBrief(brief);
      setPortfolioExposures(exposures);
      setAlertRules(newsIntelligenceService.getAlertRules());
      setLastRefreshed(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET');
    } catch (err) {
      console.error('Failed to load news intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllIntelligence();
  }, []);

  // Update brief when ticker changes
  useEffect(() => {
    newsIntelligenceService.getStockIntelligenceBrief(briefTicker, quote).then((b) => {
      setStockBrief(b);
    });
  }, [briefTicker, quote]);

  // Handle Search
  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await newsIntelligenceService.searchNewsIntelligence(searchQuery.trim());
      setSearchResult(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle bookmarking an article
  const handleSaveArticle = async (item: {
    articleId: string;
    headline: string;
    publisher: string;
    url: string;
    tickers?: string[];
  }) => {
    try {
      await fetch('/api/news/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      setSavedArticlesCount((c) => c + 1);
      setBookmarkToast(`Saved: "${item.headline.slice(0, 45)}..."`);
      setTimeout(() => setBookmarkToast(null), 3000);
    } catch (e) {
      console.error('Failed to bookmark article:', e);
    }
  };

  // Toggle alert rule
  const handleToggleAlertRule = (id: string) => {
    newsIntelligenceService.toggleAlertRule(id);
    setAlertRules([...newsIntelligenceService.getAlertRules()]);
  };

  // Filtered News Stream
  const filteredStream = useMemo(() => {
    return newsStream.filter((item) => {
      if (onlyBreaking && !item.isBreaking && item.impactScore < 80) return false;
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedRegion !== 'GLOBAL' && item.region !== selectedRegion) return false;
      if (selectedTier !== 'ALL' && item.sourceTier !== selectedTier) return false;
      if (selectedPublisher !== 'ALL' && !item.source.toLowerCase().includes(selectedPublisher.toLowerCase())) return false;
      if (selectedSentiment !== 'ALL' && item.sentiment !== selectedSentiment) return false;
      if (selectedVerification !== 'ALL' && item.verificationStatus !== selectedVerification) return false;
      return true;
    });
  }, [
    newsStream,
    onlyBreaking,
    selectedCategory,
    selectedRegion,
    selectedTier,
    selectedPublisher,
    selectedSentiment,
    selectedVerification,
  ]);

  // Tier Badge Helper
  const renderTierBadge = (tier: SourceTier) => {
    switch (tier) {
      case 'TIER_1_PRIMARY':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center gap-1 shadow-[0_0_8px_rgba(212,175,55,0.15)]">
            <ShieldCheck className="w-2.5 h-2.5" /> Tier 1 Official Agency
          </span>
        );
      case 'TIER_2_FINANCIAL':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Building2 className="w-2.5 h-2.5" /> Tier 2 Financial Wire
          </span>
        );
      case 'TIER_3_SPECIALIZED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5" /> Tier 3 Specialized Sector
          </span>
        );
      case 'TIER_4_SOCIAL':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" /> Tier 4 Social / Unverified
          </span>
        );
    }
  };

  // Verification Badge Helper
  const renderVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Confirmed (Multi-Source)
          </span>
        );
      case 'DEVELOPING':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" /> Developing Story
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" /> Uncorroborated
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3.5 select-none text-[#e2e8f0] pb-10">
      {/* 1. Header Banner with Live Breaking News Radar */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[rgba(212,175,55,0.2)] to-[#151515] border border-[#D4AF37]/50 rounded-lg text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wider font-mono">
                  Global Financial News & Verified Intelligence Engine
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  MULTI-PROVIDER PIPELINE
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Real data from SEC EDGAR, Federal Reserve, BLS/BEA, Alpaca, Benzinga, Massive & Finnhub. Normalized, verified, and analyzed with strict zero-hallucination protocols.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#6B7280]">
              Synced: <strong className="text-[#D4AF37]">{lastRefreshed || 'Connecting...'}</strong>
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border text-xs transition ${
                soundEnabled
                  ? 'bg-[#141414] text-[#D4AF37] border-[#D4AF37]/40'
                  : 'bg-[#141414] text-[#666] border-[#222]'
              }`}
              title={soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={loadAllIntelligence}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#1F1F1F] text-[#D4AF37] border border-[#242424] hover:border-[#D4AF37]/50 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Feeds
            </button>
          </div>
        </div>

        {/* Live Breaking News Radar Marquee */}
        {breakingStream.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-[#050505] p-2 rounded-lg border border-[#1F1F1F] overflow-hidden">
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/15 border border-red-500/40 text-red-400 rounded text-[10px] font-black uppercase font-mono tracking-wider shrink-0 animate-pulse">
              <Zap className="w-3 h-3" /> Breaking Radar
            </div>
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-none text-xs font-mono whitespace-nowrap py-0.5">
              {breakingStream.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 text-[#E5E5E5]">
                  <span className="text-[#D4AF37] font-bold">{item.source}:</span>
                  <span className="hover:text-white transition cursor-pointer">{item.headline}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">[{item.impactScore}/100 Impact]</span>
                  {idx < breakingStream.length - 1 && <span className="text-[#333]">&bull;</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Natural Language AI News & Research Search Box */}
        <form onSubmit={handleExecuteSearch} className="mt-3.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search multi-provider intelligence... (e.g. 'Why is NVDA up?', 'Federal Reserve FOMC', 'TSLA robotaxi', 'Crude oil inventory')"
              className="w-full bg-[#050505] border border-[#2A2A2A] focus:border-[#D4AF37] text-white pl-10 pr-28 py-2.5 rounded-lg text-xs font-medium placeholder-[#555] transition outline-none shadow-inner"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-black text-xs uppercase tracking-wider rounded-md hover:brightness-110 transition flex items-center gap-1.5"
            >
              {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Research
            </button>
          </div>
        </form>

        {/* Search Result Overlay / Box */}
        {searchResult && (
          <div className="mt-3 p-4 bg-[#050505] border border-[#D4AF37]/40 rounded-lg relative animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-black uppercase text-white font-mono tracking-wider">
                  Multi-Provider Research Report: <span className="text-[#D4AF37]">"{searchResult.query}"</span>
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#888]">
                <span>Evaluated: <strong className="text-white">{searchResult.totalSourcesEvaluated} sources</strong></span>
                <span>Confidence: <strong className={searchResult.confidence === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'}>{searchResult.confidence}</strong></span>
                <button
                  onClick={() => setSearchResult(null)}
                  className="px-2 py-0.5 bg-[#141414] hover:bg-[#222] text-[#AAA] rounded text-[10px]"
                >
                  Close
                </button>
              </div>
            </div>

            {searchResult.noDataFound ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-bold">{searchResult.aiAnalysis}</p>
                  <p className="text-[11px] text-amber-400/80 mt-1">
                    MarketMind enforces strict anti-hallucination protocols. If live facts are not corroborated across official registries or accredited financial feeds, we do not fabricate narratives.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* 4-Part Analysis Separation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[#0E0E0E] rounded border border-[#1F1F1F]">
                    <div className="text-[10px] font-bold text-[#D4AF37] uppercase font-mono mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> 1. Verified Information (Facts)
                    </div>
                    <ul className="space-y-1 text-[#D1D5DB] list-disc list-inside text-[11px]">
                      {searchResult.verifiedFacts.map((fact, i) => (
                        <li key={i}>{fact}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-[#0E0E0E] rounded border border-[#1F1F1F]">
                    <div className="text-[10px] font-bold text-blue-400 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 2. MarketMind AI Quant Synthesis
                    </div>
                    <p className="text-[#D1D5DB] leading-relaxed text-[11px]">
                      {searchResult.aiAnalysis}
                    </p>
                  </div>

                  <div className="p-3 bg-[#0E0E0E] rounded border border-[#1F1F1F]">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> 3. Market Data Confirmation
                    </div>
                    <p className="text-[#D1D5DB] leading-relaxed text-[11px]">
                      {searchResult.marketConfirmation}
                    </p>
                  </div>

                  <div className="p-3 bg-[#0E0E0E] rounded border border-[#1F1F1F]">
                    <div className="text-[10px] font-bold text-rose-400 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> 4. Risks & Alternative Explanations
                    </div>
                    <ul className="space-y-1 text-[#D1D5DB] list-disc list-inside text-[11px]">
                      {searchResult.risksAndAlternatives.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Verified Citations List */}
                {searchResult.citations.length > 0 && (
                  <div className="pt-2 border-t border-[#1C1C1C]">
                    <div className="text-[10px] font-bold text-[#888] uppercase font-mono mb-1.5">
                      Verified Direct Citations & Source Links:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.citations.map((cit, i) => (
                        <a
                          key={i}
                          href={cit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#141414] hover:bg-[#1F1F1F] border border-[#242424] hover:border-[#D4AF37]/40 rounded text-[10px] font-mono text-[#D4AF37] flex items-center gap-1.5 transition"
                        >
                          <span>{cit.sourceName}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#888]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Sub-Navigation Bar */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-xs">
        <button
          onClick={() => setActiveSubTab('ai_brief')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'ai_brief'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.25)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          AI Market Brief™
        </button>

        <button
          onClick={() => setActiveSubTab('events')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'events'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Event Clusters ({eventClusters.length})
        </button>

        <button
          onClick={() => setActiveSubTab('stream')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'stream'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Multi-Source Stream ({filteredStream.length})
        </button>

        <button
          onClick={() => setActiveSubTab('why_moving')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'why_moving'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
          "Why Is It Moving?" ({briefTicker})
        </button>

        <button
          onClick={() => setActiveSubTab('portfolio')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'portfolio'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Portfolio Exposure ({portfolioExposures.length})
        </button>

        <button
          onClick={() => setActiveSubTab('economic')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'economic'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Economic Calendar ({economicEvents.length})
        </button>

        <button
          onClick={() => setActiveSubTab('earnings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'earnings'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Earnings Radar ({earningsItems.length})
        </button>

        <button
          onClick={() => setActiveSubTab('providers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'providers'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          Source Registry ({providersHealth.filter((p) => p.status === 'LIVE' || p.status === 'ONLINE').length}/{providersHealth.length})
        </button>

        <button
          onClick={() => setActiveSubTab('bookmarks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'bookmarks'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Saved Bookmarks {savedArticlesCount > 0 ? `(${savedArticlesCount})` : ''}
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSubTab === 'alerts'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Alerts ({alertRules.filter((r) => r.enabled).length})
        </button>
      </div>

      {/* SUB-TAB VIEW: AI MARKET BRIEF */}
      {activeSubTab === 'ai_brief' && (
        <AIMarketBriefView
          onSaveArticle={handleSaveArticle}
          onSelectTicker={(sym) => {
            setBriefTicker(sym);
            setActiveSubTab('why_moving');
          }}
        />
      )}

      {/* SUB-TAB VIEW: MARKETMIND EVENT CLUSTERS */}
      {activeSubTab === 'events' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-[#9CA3AF] px-1 font-mono">
            <span>Semantic Event Deduplication & Verification: Displaying clustered multi-source events</span>
            <span className="text-[#D4AF37] font-bold">100% Corroborated</span>
          </div>

          <div className="space-y-3">
            {eventClusters.map((event) => {
              const isExpanded = expandedEventId === event.id;
              return (
                <div
                  key={event.id}
                  className={`bg-[#0A0A0A] border rounded-xl p-4 transition-all duration-200 ${
                    event.sentiment === 'BULLISH' || event.sentiment === 'VERY_BULLISH'
                      ? 'border-emerald-500/30 hover:border-emerald-500/60'
                      : event.sentiment === 'BEARISH' || event.sentiment === 'VERY_BEARISH'
                      ? 'border-rose-500/30 hover:border-rose-500/60'
                      : 'border-[#2D2D2D] hover:border-[#D4AF37]/50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {renderTierBadge(event.primarySource.tier)}
                        {renderVerificationBadge(event.verificationStatus)}
                        <span className="px-2 py-0.5 bg-[#141414] border border-[#242424] text-[#AAA] rounded text-[10px] font-mono">
                          {event.category} &bull; {event.region}
                        </span>
                        <span className="text-[10px] font-mono text-[#777]">
                          Updated {new Date(event.lastUpdatedAt).toLocaleTimeString()}
                        </span>
                        <div className="flex gap-1">
                          {event.affectedAssets.map((asset) => (
                            <span
                              key={asset}
                              className="px-1.5 py-0.2 bg-[#181818] text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[9px] font-mono font-bold"
                            >
                              {asset}
                            </span>
                          ))}
                        </div>
                      </div>

                      <h3 className="text-base font-black text-white leading-snug">
                        {event.eventTitle}
                      </h3>

                      <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                        {event.aiSummary}
                      </p>
                    </div>

                    {/* Impact & Expand Toggle */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div
                        className={`px-3 py-1 rounded text-xs font-black font-mono uppercase flex items-center gap-1.5 border ${
                          event.sentiment === 'BULLISH' || event.sentiment === 'VERY_BULLISH'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                            : event.sentiment === 'BEARISH' || event.sentiment === 'VERY_BEARISH'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {(event.sentiment === 'BULLISH' || event.sentiment === 'VERY_BULLISH') && <TrendingUp className="w-3.5 h-3.5" />}
                        {(event.sentiment === 'BEARISH' || event.sentiment === 'VERY_BEARISH') && <TrendingDown className="w-3.5 h-3.5" />}
                        {event.sentiment === 'NEUTRAL' && <Minus className="w-3.5 h-3.5" />}
                        {event.impact} IMPACT ({event.impactScore}/100)
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEventForModal(event);
                          }}
                          className="px-2.5 py-1 bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] hover:bg-[#1E1E1E] text-xs text-[#D4AF37] border border-[#D4AF37]/50 rounded font-mono font-bold flex items-center gap-1 transition"
                        >
                          <Sparkles className="w-3 h-3" /> Full Analysis
                        </button>
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                          className="px-2.5 py-1 bg-[#141414] hover:bg-[#1E1E1E] text-xs text-[#D4AF37] border border-[#282828] rounded font-mono font-bold flex items-center gap-1 transition"
                        >
                          {isExpanded ? (
                            <>
                              Hide Details <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              {event.additionalCoverage.length + 1} Sources <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable 4-Part Analysis & Coverage Breakdown */}
                  {isExpanded && (
                    <div className="mt-4 pt-3.5 border-t border-[#1C1C1C] space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 bg-[#050505] rounded-lg border border-[#1F1F1F]">
                          <div className="text-[10px] font-bold text-[#D4AF37] uppercase font-mono mb-1.5 flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Verified Core Facts
                          </div>
                          <ul className="space-y-1 text-[#CBD5E1] text-[11px] list-disc list-inside">
                            {event.verifiedFacts.map((fact, idx) => (
                              <li key={idx}>{fact}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-[#050505] rounded-lg border border-[#1F1F1F]">
                          <div className="text-[10px] font-bold text-blue-400 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> Quant Impact & Sector Analysis
                          </div>
                          <p className="text-[#CBD5E1] text-[11px] leading-relaxed">
                            {event.aiInterpretation}
                          </p>
                        </div>
                      </div>

                      {/* Multi-Source Verified Coverage Bar */}
                      <div className="p-3 bg-[#050505] rounded-lg border border-[#1F1F1F]">
                        <div className="text-[10px] font-bold text-[#888] uppercase font-mono mb-2">
                          Cross-Referenced Source Coverage:
                        </div>
                        <div className="space-y-1.5">
                          {/* Primary Source */}
                          <div className="flex items-center justify-between text-xs p-2 bg-[#0C0C0C] rounded border border-[#D4AF37]/30">
                            <div className="flex items-center gap-2">
                              {renderTierBadge(event.primarySource.tier)}
                              <span className="font-bold text-white">{event.primarySource.name}</span>
                              <span className="text-[10px] text-[#888] font-mono">(Primary Official Source)</span>
                            </div>
                            <a
                              href={event.primarySource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
                            >
                              Direct Official Link <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* Additional Coverage Sources */}
                          {event.additionalCoverage.map((cov, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs p-2 bg-[#0C0C0C] rounded border border-[#1A1A1A]"
                            >
                              <div className="flex items-center gap-2">
                                {renderTierBadge(cov.tier)}
                                <span className="text-[#CBD5E1]">{cov.sourceName}:</span>
                                <span className="text-white text-xs truncate max-w-[280px] md:max-w-[450px]">
                                  {cov.headline}
                                </span>
                              </div>
                              <a
                                href={cov.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-mono text-[#888] hover:text-[#D4AF37] flex items-center gap-1 shrink-0 ml-2"
                              >
                                View Coverage <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SUB-TAB VIEW: LIVE STREAM WITH FILTERS */}
      {activeSubTab === 'stream' && (
        <div className="space-y-3">
          {/* Comprehensive Filter Bar */}
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase">
                <Filter className="w-3.5 h-3.5 text-[#D4AF37]" /> Source & Content Filtering
              </div>
              <button
                onClick={() => setOnlyBreaking(!onlyBreaking)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition flex items-center gap-1.5 border ${
                  onlyBreaking
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'bg-[#141414] text-[#888] border-[#222] hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3" /> Breaking Catalysts Only
              </button>
            </div>

            {/* Filter Pills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs font-mono">
              {/* Category Filter */}
              <div>
                <label className="text-[10px] text-[#777] uppercase font-bold block mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full bg-[#050505] border border-[#282828] text-white p-1.5 rounded text-xs outline-none focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Categories</option>
                  <option value="MARKETS">Markets</option>
                  <option value="COMPANIES">Companies</option>
                  <option value="ECONOMY">Economy</option>
                  <option value="CENTRAL_BANKS">Central Banks</option>
                  <option value="FEDERAL_RESERVE">Federal Reserve</option>
                  <option value="COMMODITIES">Commodities</option>
                  <option value="ENERGY">Energy</option>
                  <option value="GEOPOLITICS">Geopolitics</option>
                  <option value="TECHNOLOGY">Technology</option>
                  <option value="CRYPTO">Cryptocurrency</option>
                </select>
              </div>

              {/* Publisher / Source Filter */}
              <div>
                <label className="text-[10px] text-[#777] uppercase font-bold block mb-1">Publisher / Feed</label>
                <select
                  value={selectedPublisher}
                  onChange={(e) => setSelectedPublisher(e.target.value)}
                  className="w-full bg-[#050505] border border-[#282828] text-white p-1.5 rounded text-xs outline-none focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Sources</option>
                  <option value="CNBC">CNBC Official</option>
                  <option value="Yahoo Finance">Yahoo Finance</option>
                  <option value="Bloomberg">Bloomberg News</option>
                  <option value="Fox Business">Fox Business / News</option>
                  <option value="CNN Business">CNN Business</option>
                  <option value="Benzinga">Benzinga Pro</option>
                  <option value="Finnhub">Finnhub Market Wire</option>
                  <option value="Massive">Massive / Polygon</option>
                  <option value="Alpaca">Alpaca News</option>
                  <option value="SEC EDGAR">SEC EDGAR (8-K/10-Q)</option>
                  <option value="Federal Reserve">Federal Reserve / FOMC</option>
                </select>
              </div>

              {/* Region Filter */}
              <div>
                <label className="text-[10px] text-[#777] uppercase font-bold block mb-1">Global Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value as any)}
                  className="w-full bg-[#050505] border border-[#282828] text-white p-1.5 rounded text-xs outline-none focus:border-[#D4AF37]"
                >
                  <option value="GLOBAL">Global / All Regions</option>
                  <option value="US">United States</option>
                  <option value="EUROPE">Europe</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CHINA">China</option>
                  <option value="JAPAN">Japan</option>
                  <option value="MIDDLE_EAST">Middle East</option>
                </select>
              </div>

              {/* Source Tier Filter */}
              <div>
                <label className="text-[10px] text-[#777] uppercase font-bold block mb-1">Source Tier</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as any)}
                  className="w-full bg-[#050505] border border-[#282828] text-white p-1.5 rounded text-xs outline-none focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Source Tiers</option>
                  <option value="TIER_1_PRIMARY">Tier 1 Primary Official</option>
                  <option value="TIER_2_FINANCIAL">Tier 2 Institutional Wire</option>
                  <option value="TIER_3_SPECIALIZED">Tier 3 Specialized Sector</option>
                  <option value="TIER_4_SOCIAL">Tier 4 Retail Social</option>
                </select>
              </div>

              {/* Sentiment Filter */}
              <div>
                <label className="text-[10px] text-[#777] uppercase font-bold block mb-1">Sentiment</label>
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value as any)}
                  className="w-full bg-[#050505] border border-[#282828] text-white p-1.5 rounded text-xs outline-none focus:border-[#D4AF37]"
                >
                  <option value="ALL">All Sentiments</option>
                  <option value="BULLISH">Bullish</option>
                  <option value="BEARISH">Bearish</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stream List */}
          <div className="space-y-2.5">
            {filteredStream.map((item) => (
              <div
                key={item.id}
                className={`bg-[#0A0A0A] border rounded-xl p-3.5 transition hover:border-[#444] ${
                  item.sourceTier === 'TIER_4_SOCIAL'
                    ? 'border-amber-500/20 bg-amber-950/10'
                    : item.sentiment === 'BULLISH' || item.sentiment === 'VERY_BULLISH'
                    ? 'border-l-4 border-l-emerald-500 border-[#242424]'
                    : item.sentiment === 'BEARISH' || item.sentiment === 'VERY_BEARISH'
                    ? 'border-l-4 border-l-rose-500 border-[#242424]'
                    : 'border-l-4 border-l-amber-500 border-[#242424]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {renderTierBadge(item.sourceTier)}
                      {renderVerificationBadge(item.verificationStatus)}
                      <span className="text-[10px] font-mono text-[#888]">
                        {new Date(item.publishedAt).toLocaleTimeString()} &bull; <strong className="text-[#D4AF37]">{item.source}</strong>
                      </span>
                      <div className="flex gap-1">
                        {item.tickers.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setBriefTicker(t);
                              setActiveSubTab('why_moving');
                            }}
                            className="px-1.5 py-0.2 bg-[#161616] hover:bg-[#222] text-[#D4AF37] border border-[#D4AF37]/30 rounded text-[9px] font-mono font-bold transition"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      {item.headline}
                    </h4>
                    <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase flex items-center gap-1 border ${
                        item.sentiment === 'BULLISH' || item.sentiment === 'VERY_BULLISH'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : item.sentiment === 'BEARISH' || item.sentiment === 'VERY_BEARISH'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {item.sentiment} ({item.impactScore}/100)
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() =>
                          handleSaveArticle({
                            articleId: item.id,
                            headline: item.headline,
                            publisher: item.source,
                            url: item.url,
                            tickers: item.tickers,
                          })
                        }
                        title="Bookmark Article"
                        className="p-1 rounded bg-[#181818] hover:bg-[#252525] text-[#888] hover:text-[#D4AF37] border border-[#262626] transition"
                      >
                        <Bookmark className="w-3 h-3" />
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-[#181818] hover:bg-[#252525] text-[10px] font-mono text-[#D4AF37] hover:underline flex items-center gap-1 border border-[#262626] transition"
                      >
                        Read Source <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SUB-TAB VIEW: "WHY IS IT MOVING?" 11-STEP FACTOR DEEP DIVE */}
      {activeSubTab === 'why_moving' && stockBrief && (
        <div className="space-y-3.5">
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4 shadow-xl">
            {/* Ticker Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#888] uppercase">Select Asset:</span>
                {['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'MSFT'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setBriefTicker(sym)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition border ${
                      briefTicker === sym
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-[#141414] text-[#AAA] border-[#242424] hover:text-white'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white font-mono">{stockBrief.companyName}</span>
                <span className="text-sm font-bold font-mono text-[#D4AF37]">${stockBrief.latestPrice.toFixed(2)}</span>
                <span className={`text-xs font-mono font-bold ${stockBrief.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stockBrief.priceChangePercent >= 0 ? '+' : ''}{stockBrief.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 11-Step Factor Analysis Card Grid */}
            <div className="mt-3.5 space-y-3">
              {/* Step 1 & 2: Primary Catalyst & Verification Status */}
              <div className="p-3.5 bg-gradient-to-br from-[#121212] to-[#0A0A0A] rounded-xl border border-[#D4AF37]/40 shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black uppercase text-[#D4AF37] font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> 1 & 2. Verified Primary Catalyst & Origin
                  </span>
                  <div className="flex items-center gap-2">
                    {renderVerificationBadge(stockBrief.primaryCatalyst.verificationStatus)}
                    <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Impact: {stockBrief.primaryCatalyst.impactScore}/100
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {stockBrief.primaryCatalyst.headline}
                </h3>
                <p className="text-xs text-[#9CA3AF] font-mono">
                  Primary Reporting Entity: <strong className="text-white">{stockBrief.primaryCatalyst.source}</strong> ({stockBrief.primaryCatalyst.provider})
                </p>
              </div>

              {/* 4-Column Grid for Steps 3, 4, 5, 6 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F]">
                  <div className="text-[10px] font-bold text-[#D4AF37] uppercase font-mono mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> 3. Verified Core Facts
                  </div>
                  <ul className="space-y-1.5 text-[#CBD5E1] text-[11px] list-disc list-inside">
                    {stockBrief.marketMindOutlook.verifiedFacts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F]">
                  <div className="text-[10px] font-bold text-blue-400 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> 4. AI Quant Interpretation
                  </div>
                  <p className="text-[#CBD5E1] text-[11px] leading-relaxed">
                    {stockBrief.marketMindOutlook.aiInterpretation}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[10px] font-mono text-[#888]">
                    <span>Bias: <strong className="text-emerald-400">{stockBrief.marketMindOutlook.shortTermBias}</strong></span>
                    <span>Confidence: <strong className="text-white">{stockBrief.marketMindOutlook.confidence}</strong></span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F]">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> 5. Market Action Confirmation
                  </div>
                  <p className="text-[#CBD5E1] text-[11px] leading-relaxed">
                    {stockBrief.marketMindOutlook.marketDataConfirmation}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-[#888]">
                    Support: <strong className="text-white">${stockBrief.technicalCondition.keySupport}</strong> &bull; Resistance: <strong className="text-white">${stockBrief.technicalCondition.keyResistance}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F]">
                  <div className="text-[10px] font-bold text-rose-400 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> 6. Risks & Alternative Explanations
                  </div>
                  <ul className="space-y-1.5 text-[#CBD5E1] text-[11px] list-disc list-inside">
                    {stockBrief.marketMindOutlook.risksAndAlternativeExplanations.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technical & Options Context (Steps 7 & 8) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#080808] rounded-xl border border-[#1C1C1C]">
                  <span className="text-[10px] font-mono uppercase text-[#777] block mb-1">Technical Structure</span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white">{stockBrief.technicalCondition.trend}</span>
                    <span className="text-[#D4AF37]">{stockBrief.technicalCondition.vwapStatus}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#080808] rounded-xl border border-[#1C1C1C]">
                  <span className="text-[10px] font-mono uppercase text-[#777] block mb-1">Options Flow Sentiment</span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400">{stockBrief.optionsActivity.flowSentiment}</span>
                    <span className="text-white">{stockBrief.optionsActivity.dominantStrike}</span>
                  </div>
                </div>
              </div>

              {/* Citations (Step 11) */}
              <div className="p-3 bg-[#050505] rounded-xl border border-[#1C1C1C]">
                <div className="text-[10px] font-bold text-[#888] uppercase font-mono mb-2">
                  Verified Direct Sources & Regulatory Links:
                </div>
                <div className="flex flex-wrap gap-2">
                  {stockBrief.sources.map((cit, idx) => (
                    <a
                      key={idx}
                      href={cit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#121212] hover:bg-[#1C1C1C] border border-[#242424] hover:border-[#D4AF37]/50 rounded-lg text-xs font-mono text-[#D4AF37] flex items-center gap-1.5 transition"
                    >
                      <span>{cit.sourceName}</span>
                      <ExternalLink className="w-3 h-3 text-[#888]" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB VIEW: PORTFOLIO & WATCHLIST NEWS EXPOSURE */}
      {activeSubTab === 'portfolio' && (
        <div className="space-y-3">
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                  Portfolio News Exposure & Factor Risk Radar
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                5 Connected Assets Monitored
              </span>
            </div>

            <div className="space-y-3">
              {portfolioExposures.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border border-[#D4AF37]/40 rounded font-mono font-bold text-xs">
                        {exp.totalPortfolioExposurePercent}% Portfolio Exposure
                      </span>
                      {renderVerificationBadge(exp.verificationStatus)}
                    </div>
                    <span className="text-xs font-mono font-bold text-white">
                      {new Date(exp.publishedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{exp.headline}</h4>
                  <p className="text-xs text-[#CBD5E1]">{exp.riskExplanation}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {exp.affectedHoldings.map((h) => (
                      <span
                        key={h.ticker}
                        className="px-2 py-1 bg-[#141414] border border-[#282828] rounded text-xs font-mono text-[#AAA]"
                      >
                        <strong>{h.ticker}</strong>: {h.allocationPercent}% weight (${h.exposureDollar.toLocaleString()})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB VIEW: ECONOMIC & CENTRAL BANK RADAR */}
      {activeSubTab === 'economic' && (
        <div className="space-y-3">
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                  Official Economic Indicators & Central Bank Policy Releases
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#D4AF37] bg-[#141414] px-2 py-0.5 rounded border border-[#282828]">
                Official Bureau & Federal Reserve Releases Only
              </span>
            </div>

            <div className="space-y-2.5">
              {economicEvents.map((econ) => (
                <div
                  key={econ.id}
                  className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F] flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold font-mono text-[#D4AF37] uppercase bg-[rgba(212,175,55,0.15)] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                        {econ.agency}
                      </span>
                      <span className="text-[10px] font-mono text-[#888]">
                        {econ.releaseTime} &bull; {econ.frequency}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{econ.name}</h4>
                    <p className="text-xs text-[#CBD5E1] mt-1">{econ.marketImplication}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono text-xs">
                      <div className="text-[10px] text-[#777] uppercase">Actual / Consensus / Prior</div>
                      <div className="font-bold text-white">
                        <span className="text-emerald-400">{econ.actual || 'TBD'}</span> / {econ.forecast} / {econ.previous}
                      </div>
                    </div>

                    <a
                      href={econ.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-[#141414] hover:bg-[#222] text-[#D4AF37] border border-[#282828] rounded text-xs font-mono flex items-center gap-1 transition"
                    >
                      Official Docket <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-TAB VIEW: EARNINGS INTELLIGENCE */}
      {activeSubTab === 'earnings' && (
        <div className="space-y-3">
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                  Corporate Earnings Intelligence & SEC Form 8-K / 10-Q Radar
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Verified IR Filings
              </span>
            </div>

            <div className="space-y-3">
              {earningsItems.map((earn) => (
                <div
                  key={earn.ticker}
                  className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#181818] text-[#D4AF37] border border-[#D4AF37]/40 rounded font-mono font-bold text-xs">
                        {earn.ticker}
                      </span>
                      <span className="font-bold text-white text-sm">{earn.companyName}</span>
                      <span className="text-[10px] font-mono text-[#888]">
                        {earn.reportDate} ({earn.timing})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 rounded text-xs font-mono font-black">
                        {earn.resultStatus} (EPS +{earn.epsSurprisePercent}%)
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        Stock Reaction: +{earn.stockReactionPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono bg-[#0C0C0C] p-2 rounded border border-[#1A1A1A]">
                    <div>
                      <span className="text-[9px] text-[#777] uppercase block">EPS (Actual / Cons)</span>
                      <span className="font-bold text-white">${earn.actualEps} / ${earn.consensusEps}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#777] uppercase block">Revenue (Actual / Cons)</span>
                      <span className="font-bold text-white">{earn.actualRevenue} / {earn.consensusRevenue}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#777] uppercase block">Forward Guidance</span>
                      <span className="font-bold text-[#D4AF37]">{earn.guidanceStatus}</span>
                    </div>
                    <div className="text-right">
                      <a
                        href={earn.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#D4AF37] hover:underline flex items-center justify-end gap-1 mt-1"
                      >
                        Official 8-K <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    <strong className="text-white">Management Summary:</strong> {earn.managementCommentarySummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. SUB-TAB VIEW: PROVIDER HEALTH & COVERAGE MATRIX */}
      {activeSubTab === 'providers' && <AdminNewsSourcesView />}

      {/* 10. SUB-TAB VIEW: SAVED BOOKMARKS */}
      {activeSubTab === 'bookmarks' && (
        <SavedArticlesView
          onSelectTicker={(sym) => {
            setBriefTicker(sym);
            setActiveSubTab('why_moving');
          }}
        />
      )}

      {/* 11. SUB-TAB VIEW: ALERT RULES MANAGER */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-3">
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                  Real-Time News Alert Engine & Sound Trigger Rules
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Active Guardian Rules
              </span>
            </div>

            <div className="space-y-2.5">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-[#050505] rounded-xl border border-[#1F1F1F] flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{rule.title}</span>
                      <span className="text-[10px] font-mono text-[#D4AF37] bg-[#141414] px-2 py-0.5 rounded border border-[#282828]">
                        Min Score: {rule.minImpactScore}/100
                      </span>
                      {rule.requireConfirmedOnly && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Confirmed Only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#888] font-mono">
                      Triggered {rule.triggerCount} times &bull; Last fired: {rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).toLocaleTimeString() : 'Never'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlertRule(rule.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                        rule.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-[#141414] text-[#666] border-[#222]'
                      }`}
                    >
                      {rule.enabled ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BOOKMARK TOAST */}
      {bookmarkToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121212] border border-[#D4AF37] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-bounce">
          <Bookmark className="w-4 h-4 text-[#D4AF37]" />
          <span>{bookmarkToast}</span>
        </div>
      )}

      {/* MANDATORY LEGAL & AI DISCLOSURES */}
      <div className="mt-8 p-4 bg-[#080808] border border-[#1F1F1F] rounded-xl text-[11px] font-mono text-[#777] space-y-2">
        <div className="flex items-center gap-2 text-[#D4AF37] font-bold uppercase tracking-wider text-xs">
          <Info className="w-3.5 h-3.5" /> Mandatory Regulatory & Content Disclosures
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 leading-relaxed text-[#8E8E93]">
          <p>
            <strong className="text-white">AI-Assisted Analysis:</strong> AI-generated summaries, sentiment classifications, event clusters, and impact scores are experimental market intelligence tools created for educational and informational purposes only. They do not constitute financial, investment, legal, or tax advice.
          </p>
          <p>
            <strong className="text-white">Content Attribution & Integrity:</strong> All articles, headlines, excerpts, and publications are the intellectual property of their respective official publishers (CNBC, Yahoo Finance, Bloomberg, Fox Business, CNN, Benzinga, Finnhub, Massive, Alpaca, SEC EDGAR, Federal Reserve). MarketMind AI preserves full source attribution and provides direct links to original verified sources without scraping or paywall bypassing.
          </p>
          <p>
            <strong className="text-white">Feed Timing Disclaimers:</strong> Data feeds may be real-time, delayed by 15 minutes, or end-of-day depending on provider licensing terms and tier connection status.
          </p>
          <p>
            <strong className="text-white">Source Verification:</strong> "Confirmed" badges indicate corroboration across two or more independent licensed/official wire sources. Uncorroborated sources are labeled as "Developing" or "Unverified".
          </p>
        </div>
      </div>

      {/* FULL MODAL FOR EVENT CLUSTER DEEP DIVE */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0D] border border-[#D4AF37]/50 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-black text-white font-mono uppercase">
                  MarketMind Event Intelligence Report
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="p-1 rounded-lg bg-[#181818] hover:bg-[#252525] text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                {renderTierBadge(selectedEventForModal.primarySource.tier)}
                {renderVerificationBadge(selectedEventForModal.verificationStatus)}
                <span className="text-xs font-mono text-[#D4AF37]">
                  Impact: {selectedEventForModal.impactScore}/100
                </span>
              </div>
              <h4 className="text-lg font-bold text-white">{selectedEventForModal.eventTitle}</h4>
              <p className="text-xs text-[#CBD5E1] mt-2 leading-relaxed">{selectedEventForModal.aiSummary}</p>
            </div>

            <div className="p-3 bg-[#050505] rounded-xl border border-[#1F1F1F]">
              <span className="text-[10px] font-bold font-mono text-[#D4AF37] uppercase block mb-1">
                Verified Direct Citations:
              </span>
              <div className="space-y-1 text-xs">
                {selectedEventForModal.citations?.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-[#141414] last:border-none">
                    <span className="text-white font-mono">{c.sourceName}</span>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4AF37] hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      View Source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEventForModal(null)}
                className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#282828] text-white rounded-lg text-xs font-mono font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
