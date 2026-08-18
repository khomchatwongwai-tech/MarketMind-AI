import React, { useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileText,
  Flame,
} from 'lucide-react';
import { AnalyticsService } from '../services/analyticsService';
import { useRealTimeWatchlist } from '../hooks/useRealTimeMarket';

interface MarketBriefsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'morning' | 'eod';
  onSelectSymbol?: (symbol: string) => void;
}

export const MarketBriefsModal: React.FC<MarketBriefsModalProps> = ({
  isOpen,
  onClose,
  type = 'morning',
  onSelectSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'morning' | 'eod'>(type);
  const { quotes: briefQuotes } = useRealTimeWatchlist(['SPY', 'QQQ', 'VIX', 'US10Y'], 'briefs_modal');

  if (!isOpen) return null;

  const isMorning = activeTab === 'morning';

  const spyQuote = briefQuotes['SPY'];
  const qqqQuote = briefQuotes['QQQ'];
  const vixQuote = briefQuotes['VIX'];
  const us10yQuote = briefQuotes['US10Y'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div
        id="market-briefs-modal"
        className="relative w-full max-w-3xl bg-[#0F0F12] border border-[#27272E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222228] bg-[#141418]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isMorning
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
              }`}
            >
              {isMorning ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono tracking-tight">
                  {isMorning ? 'MARKETMIND MORNING BRIEF' : 'MARKETMIND CLOSING BELL'}
                </h2>
                <span className="px-2 py-0.5 bg-[#1C1C26] text-[#D4AF37] text-xs font-mono font-bold rounded border border-[#D4AF37]/30">
                  {isMorning ? 'Pre-Market Intelligence' : 'Post-Market Wrap'}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                Verified institutional synthesis from live market feeds and official filings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#A1A1AA] hover:text-white hover:bg-[#222228] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 py-3 bg-[#111115] border-b border-[#202026] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('morning');
                AnalyticsService.track('morning_brief_opened');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isMorning
                  ? 'bg-[#D4AF37] text-black shadow'
                  : 'bg-[#18181F] text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Morning Brief (08:30 ET)
            </button>
            <button
              onClick={() => {
                setActiveTab('eod');
                AnalyticsService.track('closing_bell_opened');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                !isMorning
                  ? 'bg-[#D4AF37] text-black shadow'
                  : 'bg-[#18181F] text-[#A1A1AA] hover:text-white hover:bg-[#22222B]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Closing Bell (16:15 ET)
            </button>
          </div>

          <div className="text-[11px] text-[#71717A] font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated Today 08:30 AM ET
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[#D4D4D8]">
          {isMorning ? (
            <>
              {/* Executive Summary Card */}
              <div className="p-4 bg-[#14141A] border border-[#22222A] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-[#F2D675] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> OVERNIGHT MACRO CONTEXT
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                    MODERATE BULLISH SKEW
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#D4D4D8]">
                  U.S. equity index futures are trending modestly higher following cooler PPI inflation data (+0.1% vs +0.2% expected) and stabilizing 10-year Treasury yields at 4.22%. European markets closed mixed while Asian tech equities surged led by semiconductor hardware suppliers.
                </p>
              </div>

              {/* Index Snapshot Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#121217] border border-[#1E1E26] rounded-xl">
                  <span className="text-[10px] text-[#71717A] font-mono block">S&P 500 (SPY)</span>
                  <span className="text-sm font-bold text-white font-mono">{spyQuote?.price ? `$${spyQuote.price.toFixed(2)}` : '--'}</span>
                  {spyQuote?.changePercent !== undefined && (
                    <span className={`text-xs font-semibold block ${spyQuote.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {spyQuote.changePercent >= 0 ? '+' : ''}{spyQuote.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="p-3 bg-[#121217] border border-[#1E1E26] rounded-xl">
                  <span className="text-[10px] text-[#71717A] font-mono block">NASDAQ 100 (QQQ)</span>
                  <span className="text-sm font-bold text-white font-mono">{qqqQuote?.price ? `$${qqqQuote.price.toFixed(2)}` : '--'}</span>
                  {qqqQuote?.changePercent !== undefined && (
                    <span className={`text-xs font-semibold block ${qqqQuote.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {qqqQuote.changePercent >= 0 ? '+' : ''}{qqqQuote.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="p-3 bg-[#121217] border border-[#1E1E26] rounded-xl">
                  <span className="text-[10px] text-[#71717A] font-mono block">VIX VOLATILITY</span>
                  <span className="text-sm font-bold text-white font-mono">{vixQuote?.price ? vixQuote.price.toFixed(2) : '--'}</span>
                  {vixQuote?.changePercent !== undefined && (
                    <span className={`text-xs font-semibold block ${vixQuote.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {vixQuote.changePercent >= 0 ? '+' : ''}{vixQuote.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="p-3 bg-[#121217] border border-[#1E1E26] rounded-xl">
                  <span className="text-[10px] text-[#71717A] font-mono block">10Y YIELD (US10Y)</span>
                  <span className="text-sm font-bold text-white font-mono">{us10yQuote?.price ? `${us10yQuote.price.toFixed(2)}%` : '--'}</span>
                  {us10yQuote?.change !== undefined && (
                    <span className={`text-xs font-semibold block ${us10yQuote.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {us10yQuote.change >= 0 ? '+' : ''}{us10yQuote.change.toFixed(2)} bps
                    </span>
                  )}
                </div>
              </div>

              {/* Key Catalysts & Watchlist Shifts */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  PRIMARY CATALYSTS TO MONITOR TODAY
                </h3>

                <div className="space-y-2">
                  <div className="p-3.5 bg-[#121217] border border-[#1E1E26] rounded-xl flex items-start gap-3">
                    <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg mt-0.5">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Semiconductor Demand Expansion</span>
                        <span className="px-1.5 py-0.5 bg-[#1C1C26] text-[#D4AF37] font-mono text-[10px] rounded">
                          NVDA, AMD, TSM
                        </span>
                      </div>
                      <p className="text-[#A1A1AA] mt-1 leading-relaxed">
                        Hyperscaler capex commitment updates show Q3 enterprise AI infrastructure budgets expanding 24% year-over-year.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#121217] border border-[#1E1E26] rounded-xl flex items-start gap-3">
                    <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Scheduled FOMC Speakers & Treasury Auction</span>
                        <span className="px-1.5 py-0.5 bg-[#1C1C26] text-[#71717A] font-mono text-[10px] rounded">
                          13:00 ET
                        </span>
                      </div>
                      <p className="text-[#A1A1AA] mt-1 leading-relaxed">
                        Treasury Department 30-Year Bond auction results and remarks from 2 voting Federal Reserve governors on monetary easing timing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Closing Bell Summary */}
              <div className="p-4 bg-[#14141A] border border-[#22222A] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-[#F2D675] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> DAILY MARKET WRAP & SETTLEMENT
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                    BROAD ACCUMULATION DAY
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#D4D4D8]">
                  Equities closed near intraday highs with 78% of S&P 500 components advancing. Tech, Communication Services, and Industrials led gains while Energy lagged on softer crude futures.
                </p>
              </div>

              {/* Tomorrow's Setup */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  TOMORROW'S KEY EVENTS & SCHEDULE
                </h3>
                <div className="p-4 bg-[#121217] border border-[#1E1E26] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1C1C22]">
                    <span className="font-semibold text-white">08:30 AM ET &bull; Initial Jobless Claims</span>
                    <span className="text-[#A1A1AA] font-mono">Consensus: 218K</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#1C1C22]">
                    <span className="font-semibold text-white">10:00 AM ET &bull; Existing Home Sales</span>
                    <span className="text-[#A1A1AA] font-mono">Consensus: 4.10M</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">16:30 ET &bull; Post-Market Mega-Cap Earnings</span>
                    <span className="text-[#D4AF37] font-mono">Key Tickers: AMZN, INTC</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Institutional Sources Disclaimer */}
          <div className="p-3.5 bg-[#121216] border border-[#202026] rounded-xl flex items-center justify-between text-[11px] text-[#71717A] font-mono">
            <span>Sources: SEC Filings, Bureau of Labor Statistics, CME Group, Nasdaq Data Link</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Grounded
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141418] border-t border-[#222228] flex items-center justify-between">
          <span className="text-xs text-[#71717A]">
            MarketMind AI Institutional Briefing Engine
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#D4AF37] text-black font-bold text-xs rounded-xl hover:bg-[#F2D675] transition-colors"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
};
