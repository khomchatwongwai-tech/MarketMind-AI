import React from 'react';
import { Layers, Zap, Info, ShieldCheck, TrendingUp, TrendingDown, Crosshair } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';

interface OptionsAnalyticsViewProps {
  data: ComprehensiveMarketData;
}

export const OptionsAnalyticsView: React.FC<OptionsAnalyticsViewProps> = ({ data }) => {
  const { options, quote } = data;

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Banner: Options Market Structure & Gamma Walls */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Institutional Options Flow & Gamma Concentration
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-400">Options Bias:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] uppercase border ${
                options.sentiment.includes('Bullish')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {options.sentiment}
            </span>
          </div>
        </div>

        {/* Hedging Activity Context Note */}
        <div className="mt-2.5 p-2.5 bg-[#1c1f24] rounded border border-[#2d3139] flex items-start gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-[#6366f1] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white uppercase text-[10px] mr-1.5">Flow & Hedging Context:</span>
            {options.hedgingContext}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Put / Call Volume Ratio</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              {options.putCallRatio.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Calls: {(options.callVolume/1000000).toFixed(2)}M | Puts: {(options.putVolume/1000000).toFixed(2)}M</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Implied Volatility (IV)</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {options.impliedVolatility}%
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">IV Percentile: {options.ivPercentile}% | IV Rank: {options.ivRank}%</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Expected Daily Move Range</div>
            <div className="text-sm font-black font-mono text-amber-300 mt-1">
              ${options.expectedDailyMove.low.toFixed(2)} - ${options.expectedDailyMove.high.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">&plusmn;${(options.expectedDailyMove.rangePoints/2).toFixed(2)} ({options.expectedDailyMove.rangePoints.toFixed(2)} pts)</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Total Open Interest</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {(options.totalOpenInterest / 1000000).toFixed(1)}M
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Across all standard expiries</div>
          </div>
        </div>
      </div>

      {/* Options Key Price Zones (Gamma Support & Resistance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-[#6366f1]" />
            Major Open Interest & Gamma Resistance
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Largest Call Open Interest Strike</span>
              <span className="font-mono font-bold text-rose-400 text-sm">${options.largestCallOIStrike.toFixed(2)}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Potential Gamma Resistance Wall</span>
              <span className="font-mono font-bold text-rose-400 text-sm">${options.gammaResistance.toFixed(2)}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Dealers Hedging Dynamic</span>
              <span className="text-[11px] text-slate-300 font-sans">Selling futures into strength above $515</span>
            </div>
          </div>
        </div>

        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#6366f1]" />
            Major Open Interest & Gamma Support
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Largest Put Open Interest Strike</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">${options.largestPutOIStrike.toFixed(2)}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Potential Gamma Support Floor</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">${options.gammaSupport.toFixed(2)}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Dealers Hedging Dynamic</span>
              <span className="text-[11px] text-slate-300 font-sans">Buying dips near $505 to maintain delta neutrality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unusual Options Flow Sweeps Table */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex justify-between items-center pb-2 border-b border-[#2d3139]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Real-Time Unusual Institutional Options Sweeps
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Filtered for Orders &gt; $400K Premium</span>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2d3139] text-[10px] text-slate-400 uppercase">
                <th className="pb-2">Type</th>
                <th className="pb-2">Strike Price</th>
                <th className="pb-2">Expiration</th>
                <th className="pb-2">Total Premium</th>
                <th className="pb-2">Execution Order Type</th>
                <th className="pb-2">Inferred Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262d]">
              {options.unusualSweeps.map((sweep, idx) => (
                <tr key={idx} className="hover:bg-[#1c1f24]/60 transition">
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        sweep.type === 'CALL'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {sweep.type}
                    </span>
                  </td>
                  <td className="py-2.5 font-bold text-white">${sweep.strike.toFixed(2)}</td>
                  <td className="py-2.5 text-slate-300">{sweep.exp}</td>
                  <td className="py-2.5 font-bold text-emerald-400">{sweep.premium}</td>
                  <td className="py-2.5 text-slate-300">{sweep.action}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        sweep.sentiment === 'BULLISH'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : sweep.sentiment === 'BEARISH'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600'
                      }`}
                    >
                      {sweep.sentiment === 'NEUTRAL' ? 'COLLAR / HEDGE' : sweep.sentiment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
