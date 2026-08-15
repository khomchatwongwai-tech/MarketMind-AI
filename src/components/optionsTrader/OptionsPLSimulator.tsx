import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Calendar,
  Sliders,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  AlertCircle,
  ShoppingCart,
  Layers,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { OptionContract, OptionPLScenario } from '../../types/optionsTrader';
import { generateOptionPLScenarios } from '../../services/options/blackScholesEngine';
import { OptionsPayoffChart } from './OptionsPayoffChart';

interface OptionsPLSimulatorProps {
  contract: OptionContract;
  spotPrice: number;
  onOpenOrderTicket?: (contract: OptionContract) => void;
  onOpenStrategyBuilder?: (contract: OptionContract) => void;
}

export const OptionsPLSimulator: React.FC<OptionsPLSimulatorProps> = ({
  contract,
  spotPrice,
  onOpenOrderTicket,
  onOpenStrategyBuilder,
}) => {
  const [selectedDTE, setSelectedDTE] = useState<number>(contract.dte);
  const [ivShockPct, setIvShockPct] = useState<number>(0);
  const [customPriceTarget, setCustomPriceTarget] = useState<number>(
    Number((spotPrice * (contract.type === 'CALL' ? 1.05 : 0.95)).toFixed(2))
  );

  const entryPremium = contract.mid;

  const scenarios = useMemo(() => {
    return generateOptionPLScenarios(
      contract.type,
      spotPrice,
      contract.strike,
      selectedDTE,
      contract.iv,
      entryPremium,
      customPriceTarget,
      ivShockPct
    );
  }, [contract, spotPrice, selectedDTE, entryPremium, customPriceTarget, ivShockPct]);

  return (
    <div className="bg-[#0F0F0F] border border-[#262626] rounded-2xl p-4 sm:p-6 space-y-6 text-slate-200 shadow-xl">
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                Options Profit / Loss Simulator
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
                ESTIMATED SCENARIO — NOT GUARANTEED
              </span>
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
              <span>{contract.underlyingSymbol}</span>
              <span className="text-[#D4AF37]">${contract.strike}</span>
              <span className={contract.type === 'CALL' ? 'text-emerald-400' : 'text-rose-400'}>
                {contract.type}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                (Entry Mid: ${entryPremium.toFixed(2)} &bull; Expiry: {contract.expiration})
              </span>
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenStrategyBuilder && (
            <button
              onClick={() => onOpenStrategyBuilder(contract)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Strategy Builder
            </button>
          )}

          {onOpenOrderTicket && (
            <button
              onClick={() => onOpenOrderTicket(contract)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-black bg-[#D4AF37] hover:bg-amber-300 transition-all shadow-md shadow-[#D4AF37]/20"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Order Ticket
            </button>
          )}
        </div>
      </div>

      {/* Payoff Diagram */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
          <span>Interactive Payoff Diagram</span>
          <span className="text-[10px] text-slate-400 font-normal">
            Max Loss: <strong className="text-rose-400">${(entryPremium * 100).toFixed(0)}</strong> &bull; Breakeven: <strong className="text-[#D4AF37]">${contract.breakeven.toFixed(2)}</strong>
          </span>
        </div>
        <OptionsPayoffChart
          contract={contract}
          spotPrice={spotPrice}
          entryPrice={entryPremium}
          simulatedDTE={selectedDTE}
          simulatedIV={contract.iv * (1 + ivShockPct / 100)}
          height={220}
        />
      </div>

      {/* Simulation Controls Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-3.5 bg-[#141414] rounded-xl border border-[#222]">
        {/* Time Horizon Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              Time Horizon:
            </span>
            <span className="font-mono font-bold text-[#D4AF37]">
              {selectedDTE === 0 ? 'At Expiration (0D)' : `${selectedDTE} Days Remaining`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(1, contract.dte)}
            value={selectedDTE}
            onChange={(e) => setSelectedDTE(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>Today (T+0)</span>
            <span>Halfway</span>
            <span>Expiration ({contract.dte}D)</span>
          </div>
        </div>

        {/* IV Shift Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Implied Volatility Shift:
            </span>
            <span className="font-mono font-bold text-white">
              {ivShockPct >= 0 ? `+${ivShockPct}%` : `${ivShockPct}%`} (
              {((contract.iv * (1 + ivShockPct / 100)) * 100).toFixed(1)}% IV)
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            step="5"
            value={ivShockPct}
            onChange={(e) => setIvShockPct(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>-50% (Crush)</span>
            <span>Baseline (0%)</span>
            <span>+100% (Surge)</span>
          </div>
        </div>

        {/* Custom Price Target Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Custom Price Target:
            </span>
            <span className="font-mono font-bold text-sky-400">
              ${customPriceTarget.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              value={customPriceTarget}
              onChange={(e) => setCustomPriceTarget(parseFloat(e.target.value) || spotPrice)}
              className="w-full px-3 py-1.5 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={() => setCustomPriceTarget(spotPrice)}
              className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white bg-[#222] hover:bg-[#333] rounded-lg transition-colors whitespace-nowrap"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
          <span>Multi-Scenario P/L Projection Matrix</span>
          <span className="text-[10px] text-slate-400 font-normal">Calculated per 1 contract (100 shares)</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#0A0A0A]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-[10px] uppercase font-bold text-slate-400 border-b border-[#222]">
              <tr>
                <th className="py-2.5 px-3">Underlying Price</th>
                <th className="py-2.5 px-3">% Change</th>
                <th className="py-2.5 px-3">Est. Contract Price</th>
                <th className="py-2.5 px-3">Est. Total P/L ($)</th>
                <th className="py-2.5 px-3">Return on Capital</th>
                <th className="py-2.5 px-3">1-Day Theta Effect</th>
                <th className="py-2.5 px-3">+1% IV Sensitivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A] font-mono text-xs">
              {scenarios.map((sc, idx) => {
                const isProfit = sc.estimatedPL >= 0;
                const isCurrent = Math.abs(sc.percentChange) < 0.05;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-[#161616] transition-colors ${
                      isCurrent ? 'bg-[#D4AF37]/10 font-bold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 flex items-center gap-1.5 font-bold text-white">
                      <span>${sc.underlyingPrice.toFixed(2)}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 uppercase">
                          Current
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2 px-3 ${
                        sc.percentChange > 0
                          ? 'text-emerald-400'
                          : sc.percentChange < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {sc.percentChange > 0 ? `+${sc.percentChange}%` : `${sc.percentChange}%`}
                    </td>
                    <td className="py-2 px-3 text-white">${sc.estimatedContractValue.toFixed(2)}</td>
                    <td className={`py-2 px-3 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? `+$${sc.estimatedPL.toFixed(2)}` : `-$${Math.abs(sc.estimatedPL).toFixed(2)}`}
                    </td>
                    <td className={`py-2 px-3 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? `+${sc.percentReturn.toFixed(1)}%` : `${sc.percentReturn.toFixed(1)}%`}
                    </td>
                    <td className="py-2 px-3 text-rose-400 font-mono">
                      -${Math.abs(sc.thetaDecayEffect).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-sky-400 font-mono">
                      +${sc.ivSensitivityEffect.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclosures note */}
      <div className="p-3 bg-[#141414] rounded-xl border border-[#262626] text-[11px] text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Mathematical Modeling Disclaimer:</strong> Simulation uses
          Black-Scholes theoretical pricing based on input volatility and time decay parameters. Actual
          future market pricing is subject to live order book liquidity, bid/ask spreads, dynamic implied
          volatility skew, and broker execution conditions.
        </div>
      </div>
    </div>
  );
};
