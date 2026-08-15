import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  Share2,
  Send,
  Loader2,
  Compass,
} from 'lucide-react';
import { NormalizedInstrument } from '../../types/instrument';
import { MultiAssetAIAnalysis } from '../../services/geminiMultiAssetService';
import { AssetClassBadge } from '../common/AssetClassBadge';

interface MultiAssetAiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: NormalizedInstrument;
  onShareToCommunity?: (text: string) => void;
}

export const MultiAssetAiAnalysisModal: React.FC<MultiAssetAiAnalysisModalProps> = ({
  isOpen,
  onClose,
  instrument,
  onShareToCommunity,
}) => {
  const [analysis, setAnalysis] = useState<MultiAssetAIAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const fetchAnalysis = async (promptText?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-instrument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrumentId: instrument.instrumentId,
          prompt: promptText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (err) {
      console.error('Error fetching AI analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && instrument) {
      fetchAnalysis();
    }
  }, [isOpen, instrument?.instrumentId]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    if (!analysis) return;
    const text = `MarketMind AI Quantitative Intelligence: ${instrument.name} (${instrument.symbol})
Asset Class: ${instrument.assetClass} | Bias: ${analysis.bias} (${analysis.confidenceScore}% Confidence)
Summary: ${analysis.summary}
Support: ${analysis.assetSpecificInsights?.technicalLevels?.support} | Resistance: ${analysis.assetSpecificInsights?.technicalLevels?.resistance}
Macro Context: ${analysis.macroAndCrossAssetImpact}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    fetchAnalysis(customPrompt);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#0e1014] border border-[#2c313d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#20242e] bg-[#14161d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  {instrument.displaySymbol || instrument.symbol} Tactical Intelligence
                </h2>
                <AssetClassBadge assetClass={instrument.assetClass} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Asset-aware quantitative reasoning & macro transmission model
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e222b] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 mx-auto text-[#D4AF37] animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                Synthesizing multi-asset order flow, session context, and quantitative metrics...
              </p>
              <p className="text-xs text-slate-500">
                Evaluating {instrument.assetClass} market mechanics on {instrument.exchange}
              </p>
            </div>
          ) : analysis ? (
            <>
              {/* Bias & Score Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Bias Card */}
                <div className="p-3.5 bg-[#14171f] rounded-xl border border-[#252a36] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      QUANTITATIVE BIAS
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      {analysis.bias === 'BULLISH' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : analysis.bias === 'BEARISH' ? (
                        <TrendingDown className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Minus className="w-5 h-5 text-amber-400" />
                      )}
                      <span
                        className={`text-lg font-black font-mono ${
                          analysis.bias === 'BULLISH'
                            ? 'text-emerald-400'
                            : analysis.bias === 'BEARISH'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {analysis.bias}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">CONFIDENCE</span>
                    <p className="text-lg font-bold font-mono text-[#D4AF37]">
                      {analysis.confidenceScore}%
                    </p>
                  </div>
                </div>

                {/* S/R Key Levels */}
                <div className="sm:col-span-2 p-3.5 bg-[#14171f] rounded-xl border border-[#252a36] flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    CRITICAL TECHNICAL BOUNDARIES
                  </span>
                  <div className="grid grid-cols-3 gap-2 mt-1 font-mono text-xs text-center">
                    <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
                      <span className="text-slate-500 text-[10px] block">SUPPORT</span>
                      <span className="text-emerald-400 font-bold">
                        {analysis.assetSpecificInsights?.technicalLevels?.support || 'N/A'}
                      </span>
                    </div>
                    <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
                      <span className="text-slate-500 text-[10px] block">PIVOT / VWAP</span>
                      <span className="text-[#F2D675] font-bold">
                        {analysis.assetSpecificInsights?.technicalLevels?.pivotOrVwap || 'N/A'}
                      </span>
                    </div>
                    <div className="p-1.5 bg-[#1b1e28] rounded border border-[#2a2f3d]">
                      <span className="text-slate-500 text-[10px] block">RESISTANCE</span>
                      <span className="text-rose-400 font-bold">
                        {analysis.assetSpecificInsights?.technicalLevels?.resistance || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset Terminology & Regime Badges */}
              {analysis.assetSpecificInsights?.terminologyUsed && analysis.assetSpecificInsights.terminologyUsed.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-500 uppercase mr-1">Asset Regime:</span>
                  {analysis.assetSpecificInsights.terminologyUsed.map((term, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#181b24] text-[#F2D675] border border-[#D4AF37]/30"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              )}

              {/* Executive Summary */}
              <div className="p-4 bg-[#14171f] rounded-xl border border-[#252a36] space-y-2">
                <span className="text-[11px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider block">
                  EXECUTIVE SUMMARY
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {analysis.summary}
                </p>
              </div>

              {/* Key Drivers & Risk Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#14171f] rounded-xl border border-[#252a36] space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Primary Drivers
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysis.assetSpecificInsights?.keyDrivers?.map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">&bull;</span>
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-[#14171f] rounded-xl border border-[#252a36] space-y-2">
                  <span className="text-[11px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Invalidation Risks
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {analysis.assetSpecificInsights?.riskFactors?.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 mt-0.5">&bull;</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Macro & Cross-Asset Impact */}
              {analysis.macroAndCrossAssetImpact && (
                <div className="p-3.5 bg-[#14171f] rounded-xl border border-[#252a36] space-y-1.5">
                  <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" /> Macro & Intermarket Transmission
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysis.macroAndCrossAssetImpact}
                  </p>
                </div>
              )}

              {/* Data Attribution & Provider Footer */}
              <div className="p-3 bg-[#0d0f14] rounded-lg border border-[#1e222b] flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Provider: <strong className="text-slate-300">{analysis.dataAttribution?.provider}</strong> ({analysis.dataAttribution?.isRealTime ? 'Real-Time' : 'Delayed'})
                  </span>
                </div>
                <span>Session: {analysis.sessionStatus}</span>
              </div>
            </>
          ) : null}

          {/* Interactive Custom Query Input */}
          <form onSubmit={handleCustomSubmit} className="pt-2">
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">
              Ask Deep Tactical Question about {instrument.symbol}
            </label>
            <div className="flex items-center gap-2 bg-[#14171f] border border-[#2c313d] rounded-xl p-1.5 focus-within:border-[#D4AF37] transition">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. How does London session overlap affect spread, or what is the gamma risk?"
                className="flex-1 bg-transparent px-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !customPrompt.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2e] disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1 transition"
              >
                <Send className="w-3 h-3" />
                <span>Ask</span>
              </button>
            </div>
          </form>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-3.5 border-t border-[#20242e] bg-[#14161d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1d26] hover:bg-[#222733] border border-[#2b303d] text-xs font-mono text-slate-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>

            {onShareToCommunity && (
              <button
                onClick={() => {
                  if (analysis) {
                    onShareToCommunity(
                      `$${instrument.symbol} Tactical Analysis (${instrument.assetClass}):\nBias: ${analysis.bias} (${analysis.confidenceScore}%)\n${analysis.summary}`
                    );
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-xs font-semibold text-[#F2D675] transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Post to Community</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#20242f] hover:bg-[#2b303e] text-xs font-medium text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
