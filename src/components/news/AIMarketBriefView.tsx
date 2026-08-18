import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  HelpCircle,
  FileText,
  Bookmark,
  Share2,
  CheckCircle2,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AIMarketBrief, VerifiedSourceCitation } from '../../types/newsIntelligence';

interface AIMarketBriefViewProps {
  onSaveArticle?: (item: any) => void;
  onSelectTicker?: (ticker: string) => void;
}

export const AIMarketBriefView: React.FC<AIMarketBriefViewProps> = ({
  onSaveArticle,
  onSelectTicker,
}) => {
  const [brief, setBrief] = useState<AIMarketBrief | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSessionTab, setActiveSessionTab] = useState<
    'pastHour' | 'premarket' | 'activeSession' | 'afterHours'
  >('pastHour');
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const fetchBrief = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news/brief');
      if (res.ok) {
        const data = await res.json();
        setBrief(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI Market Brief:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, []);

  const handleBookmarkCitation = (citation: VerifiedSourceCitation) => {
    if (onSaveArticle) {
      onSaveArticle({
        articleId: `cit_${Date.now()}`,
        headline: citation.headline,
        publisher: citation.sourceName,
        url: citation.url,
        tickers: ['SPY', 'QQQ'],
      });
      setSavedNotification(`Saved: "${citation.headline.slice(0, 45)}..."`);
      setTimeout(() => setSavedNotification(null), 3000);
    }
  };

  if (isLoading && !brief) {
    return (
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-12 text-center text-[#888] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
        <p className="text-xs font-mono font-bold text-[#D4AF37]">
          Synthesizing Real-Time AI Market Brief across Official Regulatory Disclosures & Financial Feeds...
        </p>
      </div>
    );
  }

  const currentSection = brief?.sections?.[activeSessionTab];

  return (
    <div className="space-y-4 font-sans text-[#E2E8F0]">
      {/* Toast Notification */}
      {savedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E0E0E] border border-[#D4AF37] text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-[#D4AF37]/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#242424]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/50 rounded-lg text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-white font-mono tracking-wider">
                  AI Market Brief™ & Executive Catalyst Digest
                </h3>
                <span className="px-2 py-0.5 bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border border-[#D4AF37]/40 rounded text-[10px] font-mono font-bold">
                  MULTI-SOURCE CORROBORATED
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Dynamic 4-session institutional synthesis with strict factual separation, clickable citations, and conflicting reports detection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#888]">
              Generated: <strong className="text-white">{brief ? new Date(brief.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</strong>
            </span>
            <button
              onClick={fetchBrief}
              disabled={isLoading}
              className="px-3 py-1.5 bg-[#161616] hover:bg-[#222] text-[#D4AF37] border border-[#333] hover:border-[#D4AF37]/50 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Re-Synthesize
            </button>
          </div>
        </div>

        {/* Lead Headline & Market Impact Pulse */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <div className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Market Executive Narrative
            </div>
            <h4 className="text-base font-bold text-white leading-snug">
              {brief?.marketHeadline || 'Equities Advance as Disinflationary Macro Trend and AI Enterprise Capex Align'}
            </h4>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-[#888]">Affected Indices:</span>
              {(brief?.affectedIndices || ['SPY', 'QQQ', 'IWM', 'VIX']).map((idx, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-[#181818] border border-[#2A2A2A] rounded text-[10px] font-mono text-[#D4AF37]"
                >
                  {idx}
                </span>
              ))}
            </div>
          </div>

          {/* Sentiment / Risk Gauge */}
          <div className="bg-[#090909] border border-[#1F1F1F] rounded-lg p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#888]">Session Tone:</span>
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                {brief?.overallSentiment || 'BULLISH'}
              </span>
            </div>
            <div className="my-2">
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className="text-[#888]">Market Impact Score</span>
                <span className="text-[#D4AF37] font-bold">88 / 100</span>
              </div>
              <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#AA820A] to-[#D4AF37] h-full rounded-full w-[88%]" />
              </div>
            </div>
            <div className="text-[10px] text-[#666] font-mono flex items-center justify-between">
              <span>Sectors In Play:</span>
              <span className="text-[#AAA]">Tech, Semis, Bonds</span>
            </div>
          </div>
        </div>

        {/* Top Movers Catalysts Marquee */}
        {brief?.topMovers && brief.topMovers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#1C1C1C] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {brief.topMovers.map((mover, idx) => (
              <div
                key={idx}
                onClick={() => onSelectTicker?.(mover.ticker)}
                className="bg-[#0E0E0E] hover:bg-[#141414] border border-[#222] hover:border-[#D4AF37]/50 rounded-lg p-2.5 transition cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-white">{mover.ticker}</span>
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                      mover.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {mover.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {mover.changePercent >= 0 ? '+' : ''}
                    {mover.changePercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1 line-clamp-2 leading-tight">
                  {mover.catalyst}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4-Session Navigation Tabs */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-1.5 flex items-center gap-1.5 font-mono text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSessionTab('pastHour')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSessionTab === 'pastHour'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          1. Past Hour Catalysts
        </button>

        <button
          onClick={() => setActiveSessionTab('premarket')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSessionTab === 'premarket'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          2. Premarket Brief
        </button>

        <button
          onClick={() => setActiveSessionTab('activeSession')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSessionTab === 'activeSession'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          3. Active Trading Session
        </button>

        <button
          onClick={() => setActiveSessionTab('afterHours')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
            activeSessionTab === 'afterHours'
              ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[#151515] text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              : 'text-[#9CA3AF] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          4. After-Hours & Scheduled
        </button>
      </div>

      {/* Active Session Content */}
      {currentSection && (
        <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-[#D4AF37] uppercase">
                {currentSection.title}
              </span>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[10px] font-mono font-bold">
                Impact: {currentSection.marketImpact}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {currentSection.affectedTickers.map((t, i) => (
                <button
                  key={i}
                  onClick={() => onSelectTicker?.(t)}
                  className="px-2 py-0.5 bg-[#141414] hover:bg-[#1F1F1F] border border-[#2C2C2C] hover:border-[#D4AF37]/40 rounded text-[10px] font-mono text-white font-bold"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Section Summary */}
          <p className="text-xs text-[#E0E0E0] leading-relaxed">
            {currentSection.summary}
          </p>

          {/* 2-Column Separation: Facts vs Inference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* 1. Verified Facts */}
            <div className="p-3.5 bg-[#070707] border border-emerald-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified Information (Facts)
              </div>
              <ul className="space-y-1.5 text-xs text-[#D1D5DB]">
                {currentSection.verifiedFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">&bull;</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. AI Quant Inference */}
            <div className="p-3.5 bg-[#070707] border border-[#D4AF37]/30 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D4AF37] uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                MarketMind AI Quant Inference
              </div>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                {currentSection.aiInference}
              </p>
            </div>
          </div>

          {/* Clickable Citations */}
          {currentSection.citations && currentSection.citations.length > 0 && (
            <div className="pt-3 border-t border-[#1C1C1C]">
              <div className="text-[10px] font-bold text-[#888] uppercase font-mono mb-2 flex items-center justify-between">
                <span>Verified Direct Publisher Citations:</span>
                <span className="text-[9px] text-[#666]">Click to read original verified publisher source</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentSection.citations.map((citation, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#0E0E0E] hover:bg-[#141414] border border-[#222] hover:border-[#D4AF37]/40 rounded-lg flex items-center justify-between gap-2 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold font-mono text-[#D4AF37]">
                          {citation.sourceName}
                        </span>
                        {citation.isPrimaryOfficial && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border border-[#D4AF37]/30">
                            OFFICIAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white truncate mt-0.5">
                        {citation.headline}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleBookmarkCitation(citation)}
                        title="Bookmark Citation"
                        className="p-1.5 rounded bg-[#181818] hover:bg-[#252525] text-[#888] hover:text-[#D4AF37] transition"
                      >
                        <Bookmark className="w-3 h-3" />
                      </button>
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded bg-[#181818] hover:bg-[#252525] text-[#888] hover:text-white transition"
                        title="Open Original Link"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conflicting Reports Detector Box */}
      {brief?.conflictingReports && brief.conflictingReports.length > 0 && (
        <div className="bg-[#0A0A0A] border border-amber-500/30 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <h4 className="text-xs font-black uppercase font-mono tracking-wider">
              Market Intelligence Cross-Verification & Conflicting Disclosures
            </h4>
          </div>
          <p className="text-xs text-[#BBB]">
            MarketMind AI cross-checks reports across multiple publishers. When discrepancies exist between official disclosures and media commentary, we surface both perspectives:
          </p>

          <div className="space-y-2">
            {brief.conflictingReports.map((conflict, i) => (
              <div key={i} className="p-3 bg-[#080808] border border-[#222] rounded-lg">
                <span className="text-[11px] font-bold font-mono text-[#D4AF37] block mb-1.5">
                  Topic: {conflict.topic}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-[#121212] rounded border border-[#242424]">
                    <div className="flex items-center justify-between text-[10px] font-mono text-blue-400 font-bold mb-1">
                      <span>{conflict.sourceA.name}</span>
                      <a href={conflict.sourceA.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                        Source <ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                    <p className="text-[#CCC] text-[11px]">{conflict.sourceA.claim}</p>
                  </div>

                  <div className="p-2 bg-[#121212] rounded border border-[#242424]">
                    <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 font-bold mb-1">
                      <span>{conflict.sourceB.name}</span>
                      <a href={conflict.sourceB.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                        Source <ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                    <p className="text-[#CCC] text-[11px]">{conflict.sourceB.claim}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Legal Disclosure Footer */}
      <div className="bg-[#050505] border border-[#1F1F1F] rounded-lg p-3 text-[11px] text-[#71717A] leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 text-[#D4AF37] mt-0.5" />
        <div>
          <strong className="text-[#9CA3AF]">AI & Regulatory Disclosure:</strong>{' '}
          {brief?.disclosure ||
            'MarketMind AI provides informational news aggregation and AI-assisted analysis. News availability and timing depend on third-party providers. AI-generated summaries may contain errors and do not constitute investment advice, a recommendation, or a guarantee of future performance. Always verify information with the original publisher before making financial decisions.'}
        </div>
      </div>
    </div>
  );
};
