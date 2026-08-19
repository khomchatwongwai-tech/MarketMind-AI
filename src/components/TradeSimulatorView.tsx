import React, { useState } from 'react';
import { Calculator, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { formatPrice, isFiniteMarketNumber } from '../utils/formatters';

interface TradeSimulatorViewProps {
  data: ComprehensiveMarketData;
}

export const TradeSimulatorView: React.FC<TradeSimulatorViewProps> = ({ data }) => {
  const { quote, supportResistance, technicals } = data;

  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [strike, setStrike] = useState<number>(Number(Math.round(quote.price || 500).toFixed(0)));
  const [premium, setPremium] = useState<number>(2.45);
  const [contracts, setContracts] = useState<number>(5);
  const [targetPrice, setTargetPrice] = useState<number>(Number(( (quote.price || 500) * 1.008).toFixed(2)));
  const [daysHeld, setDaysHeld] = useState<number>(1);
  const [ivChange, setIvChange] = useState<number>(0);

  // Calculations
  const totalCost = contracts * premium * 100;
  const maxLoss = totalCost;
  const breakeven = optionType === 'CALL' ? strike + premium : strike - premium;

  // Intrinsic value at target
  const intrinsicAtTarget =
    optionType === 'CALL'
      ? Math.max(0, targetPrice - strike)
      : Math.max(0, strike - targetPrice);

  // Approximate time value decay factor (simple Black-Scholes approx for simulation)
  const timeDecayFactor = Math.max(0.1, 1 - daysHeld * 0.15);
  const estimatedNewPremium = intrinsicAtTarget + (premium * 0.4 * timeDecayFactor * (1 + ivChange / 100));
  const estimatedNewValue = contracts * estimatedNewPremium * 100;
  const estimatedPL = estimatedNewValue - totalCost;
  const estimatedROI = (estimatedPL / totalCost) * 100;

  // Pre-set Scenarios based on S/R levels
  const scenariosList = [
    { label: 'R2 Breakout Target', price: supportResistance.r2, type: 'BULLISH' },
    { label: 'R1 Resistance Level', price: supportResistance.r1, type: 'BULLISH' },
    { label: 'Current Price (Flat/Chop)', price: quote.price, type: 'NEUTRAL' },
    { label: 'S1 Key Support Test', price: supportResistance.s1, type: 'BEARISH' },
    { label: 'S2 Breakdown Invalidation', price: supportResistance.s2, type: 'BEARISH' },
  ];

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Banner */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Options & Scenario P/L Simulator
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {quote.ticker} Underlying Reference: {formatPrice(quote.price)}
          </span>
        </div>

        {/* Input Parameters Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {/* Option Type & Strike */}
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139] space-y-2">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Option Type & Strike</div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setOptionType('CALL')}
                className={`flex-1 py-1 rounded text-xs font-bold font-mono transition ${
                  optionType === 'CALL'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#15171a] text-slate-400 border border-[#2d3139]'
                }`}
              >
                CALL (Bullish)
              </button>
              <button
                onClick={() => setOptionType('PUT')}
                className={`flex-1 py-1 rounded text-xs font-bold font-mono transition ${
                  optionType === 'PUT'
                    ? 'bg-rose-500 text-white'
                    : 'bg-[#15171a] text-slate-400 border border-[#2d3139]'
                }`}
              >
                PUT (Bearish)
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Strike Price ($):</span>
              <input
                type="number"
                step="1"
                value={strike}
                onChange={(e) => setStrike(Number(e.target.value))}
                className="w-20 bg-[#15171a] border border-[#2d3139] rounded px-2 py-0.5 font-mono text-white text-right font-bold"
              />
            </div>
          </div>

          {/* Premium & Contracts */}
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139] space-y-2">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Premium & Position Size</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Entry Premium ($):</span>
              <input
                type="number"
                step="0.05"
                value={premium}
                onChange={(e) => setPremium(Number(e.target.value))}
                className="w-20 bg-[#15171a] border border-[#2d3139] rounded px-2 py-0.5 font-mono text-white text-right font-bold"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Contracts (100x):</span>
              <input
                type="number"
                step="1"
                min="1"
                value={contracts}
                onChange={(e) => setContracts(Number(e.target.value))}
                className="w-20 bg-[#15171a] border border-[#2d3139] rounded px-2 py-0.5 font-mono text-white text-right font-bold"
              />
            </div>
          </div>

          {/* Target Price & Holding Period */}
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139] space-y-2">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Target Exit Assumptions</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Stock ($):</span>
              <input
                type="number"
                step="0.25"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-20 bg-[#15171a] border border-[#2d3139] rounded px-2 py-0.5 font-mono text-white text-right font-bold"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Holding Days:</span>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                value={daysHeld}
                onChange={(e) => setDaysHeld(Number(e.target.value))}
                className="w-20 bg-[#15171a] border border-[#2d3139] rounded px-2 py-0.5 font-mono text-white text-right font-bold"
              />
            </div>
          </div>

          {/* Quick Scenario Fill Buttons */}
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Set Target from S/R</div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button
                onClick={() => isFiniteMarketNumber(supportResistance.r1) && setTargetPrice(supportResistance.r1)}
                className="px-2 py-1 bg-[#15171a] hover:bg-[#252830] border border-[#2d3139] rounded text-[10px] font-mono text-rose-300 font-bold"
              >
                R1 ({isFiniteMarketNumber(supportResistance.r1) ? `$${supportResistance.r1.toFixed(2)}` : 'N/A'})
              </button>
              <button
                onClick={() => isFiniteMarketNumber(supportResistance.r2) && setTargetPrice(supportResistance.r2)}
                className="px-2 py-1 bg-[#15171a] hover:bg-[#252830] border border-[#2d3139] rounded text-[10px] font-mono text-rose-300 font-bold"
              >
                R2 ({isFiniteMarketNumber(supportResistance.r2) ? `$${supportResistance.r2.toFixed(2)}` : 'N/A'})
              </button>
              <button
                onClick={() => isFiniteMarketNumber(supportResistance.s1) && setTargetPrice(supportResistance.s1)}
                className="px-2 py-1 bg-[#15171a] hover:bg-[#252830] border border-[#2d3139] rounded text-[10px] font-mono text-emerald-300 font-bold"
              >
                S1 ({isFiniteMarketNumber(supportResistance.s1) ? `$${supportResistance.s1.toFixed(2)}` : 'N/A'})
              </button>
              <button
                onClick={() => isFiniteMarketNumber(technicals.vwap) && setTargetPrice(technicals.vwap)}
                className="px-2 py-1 bg-[#15171a] hover:bg-[#252830] border border-[#2d3139] rounded text-[10px] font-mono text-[#a5b4fc] font-bold"
              >
                VWAP ({isFiniteMarketNumber(technicals.vwap) ? `$${technicals.vwap.toFixed(2)}` : 'N/A'})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Results Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase">Total Capital Invested</div>
          <div className="text-xl font-black font-mono text-white mt-1">
            ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">Max Loss: ${maxLoss.toFixed(2)} (100%)</div>
        </div>

        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase">Breakeven Stock Price</div>
          <div className="text-xl font-black font-mono text-amber-300 mt-1">
            ${breakeven.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            Distance: {isFiniteMarketNumber(quote.price) && quote.price > 0 ? `${((Math.abs(breakeven - quote.price) / quote.price) * 100).toFixed(2)}% away` : 'N/A'}
          </div>
        </div>

        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase">Estimated Net P/L</div>
          <div
            className={`text-xl font-black font-mono mt-1 ${
              estimatedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {estimatedPL >= 0 ? '+' : ''}${estimatedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">At target ${targetPrice.toFixed(2)} exit</div>
        </div>

        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase">Estimated ROI (%)</div>
          <div
            className={`text-xl font-black font-mono mt-1 ${
              estimatedROI >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {estimatedROI >= 0 ? '+' : ''}{estimatedROI.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            New Est. Premium: ${estimatedNewPremium.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Multi-Scenario Sensitivity Table */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139]">
          Multi-Scenario Sensitivity Matrix
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2d3139] text-[10px] text-slate-400 uppercase">
                <th className="pb-2">Scenario Benchmark</th>
                <th className="pb-2">Simulated Stock Price</th>
                <th className="pb-2">Underlying % Move</th>
                <th className="pb-2">Option Value</th>
                <th className="pb-2">Estimated P/L</th>
                <th className="pb-2">Estimated ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262d]">
              {scenariosList.map((scen, idx) => {
                const scIntrinsic =
                  optionType === 'CALL'
                    ? Math.max(0, scen.price - strike)
                    : Math.max(0, strike - scen.price);
                const scPrem = scIntrinsic + (premium * 0.4 * timeDecayFactor);
                const scVal = contracts * scPrem * 100;
                const scPL = scVal - totalCost;
                const scROI = (scPL / totalCost) * 100;
                const scPctMove = ((scen.price - quote.price) / quote.price) * 100;

                return (
                  <tr key={idx} className="hover:bg-[#1c1f24]/60 transition">
                    <td className="py-2.5 font-sans font-bold text-white">{scen.label}</td>
                    <td className="py-2.5 font-bold">${scen.price.toFixed(2)}</td>
                    <td className={`py-2.5 ${scPctMove >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {scPctMove >= 0 ? '+' : ''}{scPctMove.toFixed(2)}%
                    </td>
                    <td className="py-2.5">${scPrem.toFixed(2)}</td>
                    <td className={`py-2.5 font-bold ${scPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {scPL >= 0 ? '+' : ''}${scPL.toFixed(2)}
                    </td>
                    <td className={`py-2.5 font-bold ${scROI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {scROI >= 0 ? '+' : ''}{scROI.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
