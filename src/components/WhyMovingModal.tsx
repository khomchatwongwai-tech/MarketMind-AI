import React from 'react';
import { WhyIsMyPortfolioMovingAnalysis } from '../types/portfolio';
import {
  X,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Clock,
} from 'lucide-react';

interface WhyMovingModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WhyIsMyPortfolioMovingAnalysis | null;
  onAnalyzeInChat?: (prompt: string) => void;
}

export const WhyMovingModal: React.FC<WhyMovingModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onAnalyzeInChat,
}) => {
  if (!isOpen || !analysis) return null;

  const isPositive = analysis.portfolioDayChangePercent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#1C1C1C] flex items-center justify-between bg-[#0F0F0F]">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isPositive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Why Is My Portfolio Moving?
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#F2D675] border border-[#D4AF37]/30 font-mono">
                  QUANT ATTRIBUTION
                </span>
              </h2>
              <p className="text-xs text-[#8A8A8A]">
                Instant real-time factor attribution and verified market drivers &bull; {analysis.timestamp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8A8A8A] hover:text-white hover:bg-[#1A1A1A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Day Move Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isPositive
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                Net Portfolio Change Today
              </span>
              <div className="text-2xl font-bold font-mono">
                {isPositive ? '+' : ''}${analysis.portfolioDayChangeDollar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="text-sm ml-2 font-semibold">
                  ({isPositive ? '+' : ''}{analysis.portfolioDayChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-300">
              <span>Primary Driver: </span>
              <strong className="text-white">
                {analysis.topDrags.length > 0 && !isPositive
                  ? `${analysis.topDrags[0].symbol} (${analysis.topDrags[0].attributionBps} bps)`
                  : analysis.topContributors.length > 0
                  ? `${analysis.topContributors[0].symbol} (+${analysis.topContributors[0].attributionBps} bps)`
                  : 'Macro Index'}
              </strong>
            </div>
          </div>

          {/* Primary Catalyst Card */}
          <div className="p-4 bg-[#111111] border border-[#242424] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-[#D4AF37] font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                Primary Market Catalyst
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Confidence: {analysis.primaryCatalyst.confidence}%
              </span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">
              {analysis.primaryCatalyst.headline}
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              {analysis.primaryCatalyst.description}
            </p>
            <div className="pt-1 text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <span>Source:</span>
              <span className="text-slate-400">{analysis.primaryCatalyst.source}</span>
            </div>
          </div>

          {/* Biggest Drags / Contributors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Top Contributors */}
            <div className="p-3.5 bg-[#111111] border border-[#1C1C1C] rounded-xl space-y-2.5">
              <h4 className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Top Positive Contributors</span>
                <span className="font-mono">Basis Points</span>
              </h4>
              {analysis.topContributors.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No positive contributors today.</p>
              ) : (
                <div className="space-y-2">
                  {analysis.topContributors.map((c) => (
                    <div key={c.symbol} className="p-2 bg-[#161616] rounded border border-[#222] space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono">{c.symbol}</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                            +{c.dayChangePercent.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          +{c.attributionBps} bps
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{c.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Drags */}
            <div className="p-3.5 bg-[#111111] border border-[#1C1C1C] rounded-xl space-y-2.5">
              <h4 className="font-semibold text-rose-400 uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Top Negative Drags</span>
                <span className="font-mono">Basis Points</span>
              </h4>
              {analysis.topDrags.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No negative drags today.</p>
              ) : (
                <div className="space-y-2">
                  {analysis.topDrags.map((d) => (
                    <div key={d.symbol} className="p-2 bg-[#161616] rounded border border-[#222] space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono">{d.symbol}</span>
                          <span className="text-[10px] text-rose-400 font-mono font-semibold">
                            {d.dayChangePercent.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-rose-400 font-mono">
                          {d.attributionBps} bps
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{d.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Quantitative Interpretation */}
          <div className="p-4 bg-[rgba(212,175,55,0.04)] border border-[#D4AF37]/20 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              MarketMind AI Portfolio Synthesis
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {analysis.aiInterpretation}
            </p>
          </div>

          {/* Verified News Citations */}
          {analysis.verifiedSources.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                Corroborating Market Intelligence & Filings:
              </h4>
              <div className="space-y-1.5">
                {analysis.verifiedSources.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#111111] border border-[#1C1C1C] rounded flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-medium text-[11px] truncate pr-2">
                      {s.title}
                    </span>
                    <span className="text-[10px] text-[#D4AF37] font-mono shrink-0">
                      {s.source} ({s.time})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1C1C1C] bg-[#0F0F0F] flex items-center justify-between">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Factor attribution calculated dynamically from real holdings.</span>
          </div>
          <div className="flex items-center gap-2">
            {onAnalyzeInChat && (
              <button
                onClick={() => {
                  onAnalyzeInChat("Deep dive into today's portfolio movers and tell me what actions to consider.");
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[rgba(212,175,55,0.15)] text-[#F2D675] border border-[#D4AF37]/30 hover:bg-[rgba(212,175,55,0.25)] transition text-xs font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Portfolio AI
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#242424] text-white hover:bg-[#333] transition text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
