import React from 'react';
import { Calendar, AlertTriangle, Scale, Landmark, TrendingUp, TrendingDown, Clock, ShieldAlert } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';

interface EconomicFedViewProps {
  data: ComprehensiveMarketData;
}

export const EconomicFedView: React.FC<EconomicFedViewProps> = ({ data }) => {
  const { economicEvents, fed } = data;

  const hasHighVolEvent = economicEvents.some((e) => e.isApproachingHighVol);

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* High Volatility Event Approaching Banner */}
      {hasHighVolEvent && (
        <div className="bg-rose-950/40 border-2 border-rose-500 rounded-lg p-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-black text-rose-400 uppercase tracking-widest">
                HIGH VOLATILITY EVENT APPROACHING
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                FOMC Release / Federal Reserve Chair Speech scheduled at 02:00 PM ET. Expect sudden spreads and rapid index momentum shifts.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-500 text-white text-xs font-black rounded uppercase font-mono">
            Extreme Risk
          </span>
        </div>
      )}

      {/* Federal Reserve Central Bank Dashboard */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Federal Reserve Macro Policy & Rate Probability Engine
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-400">Current Target Range:</span>
            <span className="px-2 py-0.5 bg-[#1c1f24] text-white border border-[#2d3139] rounded font-bold font-mono text-[10px]">
              {fed.targetRange}
            </span>
          </div>
        </div>

        {/* Fed Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
          {/* Fed Sentiment Gauge */}
          <div className="bg-[#1c1f24] p-3 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="text-[9px] text-slate-400 uppercase font-bold">
              Fed Sentiment Score
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {fed.fedSentimentScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/100</span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase px-1.5 py-0.2 bg-emerald-950/40 rounded border border-emerald-500/30">
                {fed.hawkishDovishStance}
              </span>
            </div>
            <div className="w-full bg-[#2d3139] h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full" style={{ width: `${fed.fedSentimentScore}%` }} />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-mono uppercase">
              <span>0 (Dovish)</span>
              <span>50 (Neut)</span>
              <span>100 (Hawkish)</span>
            </div>
          </div>

          {/* Next FOMC Meeting Countdown */}
          <div className="bg-[#1c1f24] p-3 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Next FOMC Decision</div>
            <div className="text-base font-black text-white mt-1">{fed.nextMeetingDate}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Countdown: <span className="text-amber-400 font-bold">{fed.daysUntilMeeting} Days</span>
            </div>
          </div>

          {/* Market Rate Cut/Hold Expectations */}
          <div className="bg-[#1c1f24] p-3 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Market Rate Probability</div>
            <div className="flex justify-between items-center text-xs font-mono font-bold mt-1">
              <span className="text-emerald-400">Cut: {fed.cutProbability}%</span>
              <span className="text-slate-300">Hold: {fed.holdProbability}%</span>
              <span className="text-rose-400">Hike: {fed.hikeProbability}%</span>
            </div>
            <div className="w-full bg-[#2d3139] h-1.5 rounded-full overflow-hidden mt-2 flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${fed.cutProbability}%` }} />
              <div className="bg-slate-500 h-full" style={{ width: `${fed.holdProbability}%` }} />
              <div className="bg-rose-500 h-full" style={{ width: `${fed.hikeProbability}%` }} />
            </div>
          </div>

          {/* Treasury Yield Dynamics */}
          <div className="bg-[#1c1f24] p-3 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Treasury 10Y vs 2Y Curve</div>
            <div className="text-xs font-mono font-bold text-white mt-1">
              10Y: <span className="text-emerald-400">{fed.treasury10Y}%</span> &bull; 2Y: <span>{fed.treasury2Y}%</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Curve Spread: <span className="text-amber-400 font-bold">{fed.yieldCurveInversion}%</span> (Inversion easing)
            </div>
          </div>
        </div>

        {/* Recent Fed Remarks */}
        <div className="mt-2.5 p-2.5 bg-[#1c1f24] rounded border border-[#2d3139] text-xs text-slate-300">
          <span className="font-bold text-white uppercase text-[10px] mr-1.5">Latest Chair Commentary:</span>
          "{fed.recentCommentary}"
        </div>
      </div>

      {/* Economic Events Calendar Full Table */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex justify-between items-center pb-2 border-b border-[#2d3139]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Comprehensive Macroeconomic Calendar & Impact Analysis
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">All Times Eastern (ET)</span>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2d3139] text-[10px] text-slate-400 uppercase">
                <th className="pb-2">Time</th>
                <th className="pb-2">Economic Event</th>
                <th className="pb-2">Importance</th>
                <th className="pb-2">Consensus</th>
                <th className="pb-2">Previous</th>
                <th className="pb-2">Actual Result</th>
                <th className="pb-2">Market & Index Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262d]">
              {economicEvents.map((evt) => (
                <tr
                  key={evt.id}
                  className={`transition ${
                    evt.isApproachingHighVol ? 'bg-rose-950/20 font-bold' : 'hover:bg-[#1c1f24]/60'
                  }`}
                >
                  <td className="py-2.5 text-slate-300 font-bold">{evt.time}</td>
                  <td className="py-2.5 font-sans font-semibold text-white">{evt.event}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        evt.importance === 'Extreme'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : evt.importance === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600'
                      }`}
                    >
                      {evt.importance}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300">{evt.consensus}</td>
                  <td className="py-2.5 text-slate-400">{evt.previous}</td>
                  <td className="py-2.5">
                    {evt.actual ? (
                      <span className="font-bold text-emerald-400">{evt.actual}</span>
                    ) : (
                      <span className="text-slate-500 italic">Pending Release</span>
                    )}
                  </td>
                  <td className="py-2.5 font-sans text-slate-300 text-[11px] max-w-[280px]">
                    {evt.marketImpact}
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
