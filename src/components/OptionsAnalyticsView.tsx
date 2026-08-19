import React from 'react';
import { Layers, Zap, ShieldCheck, Crosshair } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { isFiniteMarketNumber } from '../utils/formatters';

interface OptionsAnalyticsViewProps {
  data: ComprehensiveMarketData;
}

export const OptionsAnalyticsView: React.FC<OptionsAnalyticsViewProps> = ({ data }) => {
  const { quote, options } = data;

  const pcrStr = isFiniteMarketNumber(options?.putCallRatio) ? options.putCallRatio.toFixed(2) : 'N/A';
  const callsM = isFiniteMarketNumber(options?.callVolume) ? `${(options.callVolume / 1000000).toFixed(2)}M` : 'N/A';
  const putsM = isFiniteMarketNumber(options?.putVolume) ? `${(options.putVolume / 1000000).toFixed(2)}M` : 'N/A';

  const lowStr = isFiniteMarketNumber(options?.expectedDailyMove?.low) ? `$${options.expectedDailyMove.low.toFixed(2)}` : 'N/A';
  const highStr = isFiniteMarketNumber(options?.expectedDailyMove?.high) ? `$${options.expectedDailyMove.high.toFixed(2)}` : 'N/A';
  const ptsHalfStr = isFiniteMarketNumber(options?.expectedDailyMove?.rangePoints) ? `+$${(options.expectedDailyMove.rangePoints / 2).toFixed(2)}` : 'N/A';
  const ptsTotStr = isFiniteMarketNumber(options?.expectedDailyMove?.rangePoints) ? `${options.expectedDailyMove.rangePoints.toFixed(2)} pts` : 'N/A';

  const oiStr = isFiniteMarketNumber(options?.totalOpenInterest) ? `${(options.totalOpenInterest / 1000000).toFixed(1)}M` : 'N/A';

  const callOIStrikeStr = isFiniteMarketNumber(options?.largestCallOIStrike) ? `$${options.largestCallOIStrike.toFixed(2)}` : 'N/A';
  const gammaResStr = isFiniteMarketNumber(options?.gammaResistance) ? `$${options.gammaResistance.toFixed(2)}` : 'N/A';

  const putOIStrikeStr = isFiniteMarketNumber(options?.largestPutOIStrike) ? `$${options.largestPutOIStrike.toFixed(2)}` : 'N/A';
  const gammaSuppStr = isFiniteMarketNumber(options?.gammaSupport) ? `$${options.gammaSupport.toFixed(2)}` : 'N/A';

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Banner: Options Market Structure & Gamma Walls */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Institutional Options Profile &mdash; {quote.ticker}
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">
            SENTIMENT: {options?.sentiment || 'NEUTRAL'}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Put / Call Volume Ratio</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              {pcrStr}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Calls: {callsM} | Puts: {putsM}</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Implied Volatility (IV)</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {options?.impliedVolatility ?? 25}%
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">IV Percentile: {options?.ivPercentile ?? 50}% | IV Rank: {options?.ivRank ?? 50}%</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Expected Daily Move Range</div>
            <div className="text-sm font-black font-mono text-amber-300 mt-1">
              {lowStr} - {highStr}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">{ptsHalfStr} ({ptsTotStr})</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Total Open Interest</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {oiStr}
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
            Major Open Interest &amp; Gamma Resistance
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Largest Call Open Interest Strike</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{callOIStrikeStr}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Potential Gamma Resistance Wall</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{gammaResStr}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Dealers Hedging Dynamic</span>
              <span className="text-[11px] text-slate-300 font-sans">Selling futures into strength above overhead levels</span>
            </div>
          </div>
        </div>

        <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-[#2d3139] flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#6366f1]" />
            Major Open Interest &amp; Gamma Support
          </div>
          <div className="divide-y divide-[#22262d] text-xs mt-1">
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Largest Put Open Interest Strike</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{putOIStrikeStr}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Potential Gamma Support Floor</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{gammaSuppStr}</span>
            </div>
            <div className="py-2 flex justify-between items-center">
              <span className="text-slate-400 font-medium">Dealers Hedging Dynamic</span>
              <span className="text-[11px] text-slate-300 font-sans">Buying dips near floor levels to maintain delta neutrality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unusual Options Flow Sweeps Table */}
      {options?.unusualSweeps && options.unusualSweeps.length > 0 && (
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
                    <td className="py-2.5 font-bold text-white">
                      {isFiniteMarketNumber(sweep.strike) ? `$${sweep.strike.toFixed(2)}` : 'N/A'}
                    </td>
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
      )}
    </div>
  );
};
