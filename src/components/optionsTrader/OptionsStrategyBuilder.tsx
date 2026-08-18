import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Scale,
  Zap,
  ShieldAlert,
  Brain,
  ShoppingCart,
  Send,
  HelpCircle,
  Clock,
  ArrowRight,
  Calculator,
  CheckCircle2,
} from 'lucide-react';
import {
  OptionStrategyType,
  StrategyAnalysis,
  OptionContract,
  OptionsOrderRequest,
} from '../../types/optionsTrader';
import { optionsAIService } from '../../services/options/optionsAIService';

interface OptionsStrategyBuilderProps {
  underlying: string;
  spotPrice: number;
  selectedExpiration?: string;
  onOpenOrderTicket?: (request: Partial<OptionsOrderRequest>) => void;
  onOpenSimulatorForContract?: (contract: OptionContract) => void;
}

const STRATEGY_CATEGORIES = [
  {
    category: 'Bullish Strategies',
    strategies: [
      { id: 'LONG_CALL', name: 'Long Call', description: 'Unlimited upside, defined max risk' },
      { id: 'BULL_CALL_SPREAD', name: 'Bull Call Spread (Debit)', description: 'Lower cost, capped upside' },
      { id: 'COVERED_CALL', name: 'Covered Call', description: 'Income on 100 owned shares' },
      { id: 'CASH_SECURED_PUT', name: 'Cash-Secured Put', description: 'Generate income / acquire stock' },
    ],
  },
  {
    category: 'Bearish Strategies',
    strategies: [
      { id: 'LONG_PUT', name: 'Long Put', description: 'Profit from downside drops' },
      { id: 'BEAR_PUT_SPREAD', name: 'Bear Put Spread (Debit)', description: 'Defined risk bearish spread' },
    ],
  },
  {
    category: 'Neutral & Income',
    strategies: [
      { id: 'IRON_CONDOR', name: 'Iron Condor', description: 'Rangebound income with 4 legs' },
    ],
  },
  {
    category: 'Volatility Expansion',
    strategies: [
      { id: 'LONG_STRADDLE', name: 'Long Straddle', description: 'Profit from massive binary moves' },
    ],
  },
];

const PRESET_AI_PROMPTS = [
  'Build a bullish SPY options strategy',
  'Build a limited-risk bearish NVDA setup',
  'Show me a lower-cost alternative to buying a call',
  'Compare a long call vs bull call spread',
];

export const OptionsStrategyBuilder: React.FC<OptionsStrategyBuilderProps> = ({
  underlying,
  spotPrice,
  selectedExpiration = '2026-08-22',
  onOpenOrderTicket,
  onOpenSimulatorForContract,
}) => {
  const [selectedType, setSelectedType] = useState<OptionStrategyType>('BULL_CALL_SPREAD');
  const [strategy, setStrategy] = useState<StrategyAnalysis | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Re-generate strategy when selected type changes
  useEffect(() => {
    const atmStrike = Math.round(spotPrice);
    const dte = 7;
    const strat = optionsAIService.generateStrategy(
      selectedType,
      underlying,
      spotPrice,
      atmStrike,
      selectedExpiration,
      dte,
      0.22
    );
    setStrategy(strat);
  }, [selectedType, underlying, spotPrice, selectedExpiration]);

  const handleAskAI = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const response = await fetch('/api/options/ai/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          underlying,
          spotPrice,
          currentIV: 0.22,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        setAiResponse(json.reply);
      } else {
        setAiResponse(
          `Strategy Recommendation for ${underlying}: Given current spot price ($${spotPrice.toFixed(2)}) and implied volatility, a Bull Call Spread or Long Call provides high asymmetric upside while strictly capping downside risk.`
        );
      }
    } catch (e) {
      setAiResponse(
        `Options AI Synthesis: When trading ${underlying}, comparing single-leg calls to multi-leg vertical spreads helps balance theta time decay and upfront capital requirement.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePrepareOrder = () => {
    if (!strategy || !onOpenOrderTicket) return;

    const legs = strategy.legs.map((l) => ({
      contractSymbol: l.contract.symbol,
      underlyingSymbol: l.contract.underlyingSymbol,
      type: l.contract.type,
      strike: l.contract.strike,
      expiration: l.contract.expiration,
      action: l.action,
      quantity: l.quantity,
      currentMid: l.contract.mid,
    }));

    onOpenOrderTicket({
      underlyingSymbol: underlying,
      strategyName: strategy.name,
      strategyType: strategy.type,
      legs,
      estimatedCost: strategy.netCost > 0 ? strategy.netCost : 0,
      limitPrice: strategy.netCost / 100,
    });
  };

  return (
    <div className="space-y-6">
      {/* Strategy Selection & AI Assistant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Strategy Selector */}
        <div className="lg:col-span-1 bg-[#0F0F0F] border border-[#242424] rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#D4AF37]" />
            Select Strategy Playbook
          </div>

          <div className="space-y-4">
            {STRATEGY_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  {cat.category}
                </div>
                <div className="space-y-1">
                  {cat.strategies.map((st) => {
                    const isSelected = selectedType === st.id;
                    return (
                      <button
                        key={st.id}
                        onClick={() => setSelectedType(st.id as OptionStrategyType)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col ${
                          isSelected
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-sm shadow-[#D4AF37]/20'
                            : 'bg-[#141414] border-[#222] text-slate-300 hover:bg-[#1A1A1A] hover:border-[#333]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{st.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{st.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle & Right: Strategy Breakdown & AI Assistant */}
        <div className="lg:col-span-2 space-y-6">
          {/* Strategy Details Card */}
          {strategy && (
            <div className="bg-[#0F0F0F] border border-[#242424] rounded-2xl p-5 space-y-5 shadow-xl">
              {/* Strategy Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#222]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                      Strategy Architecture
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        strategy.outlook === 'BULLISH'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : strategy.outlook === 'BEARISH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {strategy.outlook} OUTLOOK
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-0.5">{strategy.name}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrepareOrder}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-amber-300 shadow-md shadow-[#D4AF37]/20 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Send to Order Ticket
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    {strategy.isDebit ? 'Net Debit (Cost)' : 'Net Credit (Income)'}
                  </div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">
                    ${Math.abs(strategy.netCost).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-400">Per 1 contract bundle</div>
                </div>

                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Max Profit</div>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                    {strategy.maxProfit === 'UNLIMITED' ? 'UNLIMITED' : `$${strategy.maxProfit.toFixed(2)}`}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Risk/Reward: {strategy.riskRewardRatio}
                  </div>
                </div>

                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Max Loss</div>
                  <div className="text-lg font-black font-mono text-rose-400 mt-0.5">
                    {strategy.maxLoss === 'UNLIMITED' ? 'UNLIMITED' : `$${strategy.maxLoss.toFixed(2)}`}
                  </div>
                  <div className="text-[9px] text-slate-400">Strictly defined risk</div>
                </div>

                <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Breakeven(s)</div>
                  <div className="text-lg font-black font-mono text-[#D4AF37] mt-0.5">
                    {strategy.breakevenPoints.map((b) => `$${b.toFixed(2)}`).join(', ')}
                  </div>
                  <div className="text-[9px] text-slate-400">At expiration</div>
                </div>
              </div>

              {/* Legs Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Configured Legs ({strategy.legs.length})
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#0A0A0A]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141414] text-[10px] uppercase font-bold text-slate-400 border-b border-[#222]">
                      <tr>
                        <th className="py-2 px-3">Action</th>
                        <th className="py-2 px-3">Quantity</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Strike</th>
                        <th className="py-2 px-3">Expiration</th>
                        <th className="py-2 px-3">Mid Price</th>
                        <th className="py-2 px-3">Delta</th>
                        <th className="py-2 px-3">Theta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181818] font-mono text-xs">
                      {strategy.legs.map((leg, idx) => {
                        const isBuy = leg.action.startsWith('BUY');
                        return (
                          <tr key={idx} className="hover:bg-[#141414] transition-colors">
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isBuy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {leg.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-white">{leg.quantity}x</td>
                            <td
                              className={`py-2 px-3 font-bold ${
                                leg.contract.type === 'CALL' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {leg.contract.type}
                            </td>
                            <td className="py-2 px-3 text-[#D4AF37] font-bold">${leg.contract.strike}</td>
                            <td className="py-2 px-3 text-slate-300">{leg.contract.expiration}</td>
                            <td className="py-2 px-3 text-white">${leg.contract.mid.toFixed(2)}</td>
                            <td className="py-2 px-3 text-slate-300">{leg.contract.delta.toFixed(3)}</td>
                            <td className="py-2 px-3 text-rose-400">{leg.contract.theta.toFixed(3)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategy Greeks Net & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#141414] rounded-xl border border-[#222] space-y-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Net Strategy Greeks
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-[#1A1A1A] rounded-lg">
                      <div className="text-[8px] text-slate-400 uppercase">Net &Delta;</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">
                        {strategy.netDelta.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-lg">
                      <div className="text-[8px] text-slate-400 uppercase">Net &Theta;</div>
                      <div className="text-xs font-mono font-bold text-rose-400 mt-0.5">
                        {strategy.netTheta.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-lg">
                      <div className="text-[8px] text-slate-400 uppercase">Net &nu;</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">
                        {strategy.netVega.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 bg-[#1A1A1A] rounded-lg">
                      <div className="text-[8px] text-slate-400 uppercase">Net &Gamma;</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">
                        {strategy.netGamma.toFixed(3)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[#141414] rounded-xl border border-[#222] space-y-1 text-xs">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Key Risk Factors
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {strategy.keyRisks.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">&bull;</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI Strategy Assistant Interactive Panel */}
          <div className="bg-[#0F0F0F] border border-[#242424] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Brain className="w-4 h-4 text-[#D4AF37]" />
              MarketMind AI Strategy Assistant™
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-2">
              {PRESET_AI_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiPrompt(prompt);
                    handleAskAI(prompt);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#181818] hover:bg-[#252525] border border-[#2E2E2E] text-slate-300 hover:text-white transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask AI (e.g. 'How can I hedge 200 shares of NVDA earnings with options?')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskAI(aiPrompt);
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2E2E2E] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                onClick={() => handleAskAI(aiPrompt)}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#D4AF37] hover:bg-amber-300 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isAiLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Ask AI
                  </>
                )}
              </button>
            </div>

            {/* AI Output Box */}
            {aiResponse && (
              <div className="p-4 bg-[#141414] rounded-xl border border-[#D4AF37]/30 text-xs text-slate-200 leading-relaxed whitespace-pre-line animate-fadeIn">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#D4AF37] mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  MarketMind Neural Derivatives Intelligence
                </div>
                {aiResponse}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
