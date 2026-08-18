import React, { useState, useEffect } from 'react';
import {
  Brain,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Flame,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
  Calculator,
  ShoppingCart,
  X,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  OptionContract,
  OptionsAIContractAnalysis,
} from '../../types/optionsTrader';
import { optionsAIService } from '../../services/options/optionsAIService';

interface OptionsContractAnalyzerModalProps {
  contract: OptionContract;
  spotPrice: number;
  marketMindScore?: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator: (contract: OptionContract) => void;
  onOpenStrategyBuilder: (contract: OptionContract) => void;
  onOpenOrderTicket: (contract: OptionContract) => void;
}

export const OptionsContractAnalyzerModal: React.FC<OptionsContractAnalyzerModalProps> = ({
  contract,
  spotPrice,
  marketMindScore = 72,
  isOpen,
  onClose,
  onOpenSimulator,
  onOpenStrategyBuilder,
  onOpenOrderTicket,
}) => {
  const [analysis, setAnalysis] = useState<OptionsAIContractAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    optionsAIService
      .analyzeContract(contract, spotPrice, marketMindScore)
      .then((res) => {
        if (isMounted) {
          setAnalysis(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error analyzing contract', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contract, spotPrice, marketMindScore]);

  if (!isOpen) return null;

  const isCall = contract.type === 'CALL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#0D0D0D] border border-[#D4AF37]/50 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.15)] text-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#141414] via-[#1A1A1A] to-[#141414] border-b border-[#2A2A2A] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                  MarketMind Options Intelligence™
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#1A1A1A] text-slate-300 border border-[#333]">
                  NEURAL SYNTHESIS
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{contract.underlyingSymbol}</span>
                <span className="text-[#D4AF37]">${contract.strike}</span>
                <span className={isCall ? 'text-emerald-400' : 'text-rose-400'}>{contract.type}</span>
                <span className="text-xs text-slate-400 font-normal">({contract.expiration})</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {isLoading || !analysis ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-400">
                Synthesizing multi-factor options Greeks, Volatility, and Risk Guardian models...
              </span>
            </div>
          ) : (
            <>
              {/* Section 1: Executive KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Contract Premium
                  </div>
                  <div className="text-xl font-black font-mono text-white mt-0.5">
                    ${analysis.contract.mid.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Bid ${analysis.contract.bid.toFixed(2)} &bull; Ask ${analysis.contract.ask.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Breakeven At Expiry
                  </div>
                  <div className="text-xl font-black font-mono text-[#D4AF37] mt-0.5">
                    ${analysis.breakeven.breakevenPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Requires {Math.abs(analysis.breakeven.requiredMovePercent)}% move
                  </div>
                </div>

                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Risk Guardian™</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                        analysis.risk.tier === 'VERY_HIGH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : analysis.risk.tier === 'ELEVATED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {analysis.risk.tier}
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-white mt-0.5">
                    {analysis.risk.score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {analysis.contract.dte === 0 ? '0DTE Same-Day' : `${analysis.contract.dte} DTE remaining`}
                  </div>
                </div>

                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Implied Volatility
                  </div>
                  <div className="text-xl font-black font-mono text-white mt-0.5">
                    {analysis.volatility.currentIV}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    IV Rank {analysis.volatility.ivRank}% &bull; {analysis.volatility.ivLevel}
                  </div>
                </div>
              </div>

              {/* Section 2: Greeks Radar & Volatility/Liquidity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Greeks Grid */}
                <div className="p-4 bg-[#141414] rounded-xl border border-[#262626] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Options Greeks Breakdown
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Delta (&Delta;)</div>
                      <div className="text-sm font-black font-mono text-white mt-0.5">
                        {analysis.greeks.delta.toFixed(3)}
                      </div>
                      <div className="text-[8px] text-slate-400">Rate of change</div>
                    </div>

                    <div className="p-2 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Gamma (&Gamma;)</div>
                      <div className="text-sm font-black font-mono text-white mt-0.5">
                        {analysis.greeks.gamma.toFixed(4)}
                      </div>
                      <div className="text-[8px] text-slate-400">Delta accel.</div>
                    </div>

                    <div className="p-2 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Theta (&Theta;)</div>
                      <div className="text-sm font-black font-mono text-rose-400 mt-0.5">
                        {analysis.greeks.theta.toFixed(3)}
                      </div>
                      <div className="text-[8px] text-slate-400">-$ / day decay</div>
                    </div>

                    <div className="p-2 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Vega (&nu;)</div>
                      <div className="text-sm font-black font-mono text-white mt-0.5">
                        {analysis.greeks.vega.toFixed(3)}
                      </div>
                      <div className="text-[8px] text-slate-400">Per 1% IV shift</div>
                    </div>
                  </div>

                  {/* Theta Explanation */}
                  <div className="p-2.5 bg-[#181818] rounded-lg border border-[#2A2A2A] text-xs text-slate-300 flex items-start gap-2">
                    <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white uppercase text-[10px] mr-1.5">
                        Time Decay Analysis:
                      </span>
                      {analysis.timeDecay.explanation}
                    </div>
                  </div>
                </div>

                {/* Liquidity & Event Risk */}
                <div className="p-4 bg-[#141414] rounded-xl border border-[#262626] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Liquidity & Upcoming Catalysts
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Volume & Open Interest</div>
                      <div className="font-mono font-bold text-white mt-1">
                        Vol: {analysis.liquidity.volume.toLocaleString()} &bull; OI: {analysis.liquidity.openInterest.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-emerald-400 mt-0.5">
                        Liquidity: {analysis.liquidity.liquidityRating} ({analysis.liquidity.spreadPercent}% spread)
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Expected Move Range</div>
                      <div className="font-mono font-bold text-amber-300 mt-1">
                        ${analysis.volatility.expectedMoveRange.low} - ${analysis.volatility.expectedMoveRange.high}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        &plusmn;${analysis.volatility.expectedMoveDollar} ({analysis.volatility.ivLevel} IV)
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Events */}
                  <div className="p-2.5 bg-[#181818] rounded-lg border border-[#2A2A2A] text-xs text-slate-300 flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white uppercase text-[10px] mr-1.5">
                        Upcoming Events Before Expiry:
                      </span>
                      {analysis.events.eventsBeforeExpiry.join(' &bull; ') || 'No high-impact events identified.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Scenario Matrix (Bull / Base / Bear) */}
              <div className="p-4 bg-[#141414] rounded-xl border border-[#262626] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    Probabilistic Scenario Framework (Not Guaranteed)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Confidence: <strong className="text-white">{analysis.marketMindView.confidence}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Bull Scenario */}
                  <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-500/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px]">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Bull Scenario
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {analysis.marketMindView.bullScenario}
                    </p>
                  </div>

                  {/* Base Scenario */}
                  <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-500/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
                      <Scale className="w-3.5 h-3.5" />
                      Base Scenario (Consolidation)
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {analysis.marketMindView.baseScenario}
                    </p>
                  </div>

                  {/* Bear Scenario */}
                  <div className="p-3 bg-rose-950/20 rounded-lg border border-rose-500/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[10px]">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Bear Scenario
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {analysis.marketMindView.bearScenario}
                    </p>
                  </div>
                </div>

                {/* Educational Interpretation */}
                <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] text-xs text-slate-300 leading-relaxed">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
                    MarketMind Interpretation & Risk Context
                  </div>
                  {analysis.marketMindView.interpretation}
                </div>
              </div>

              {/* Data Timestamp & Disclosures */}
              <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#222]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>Data Source: {analysis.sources.dataSource} ({analysis.sources.retrievedAt})</span>
                </div>
                <div className="italic">
                  Options involve risk. MarketMind AI provides probabilistic analytics and never guarantees outcomes.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0A0A0A] border-t border-[#222] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSimulator(contract);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-[#1C1C1C] hover:bg-[#282828] border border-[#333] transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" />
              P/L Simulator
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenStrategyBuilder(contract);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-[#1C1C1C] hover:bg-[#282828] border border-[#333] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Build Strategy
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#141414] hover:bg-[#1E1E1E] transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenOrderTicket(contract);
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#D4AF37] to-amber-400 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-[#D4AF37]/20 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              Prepare Order Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
