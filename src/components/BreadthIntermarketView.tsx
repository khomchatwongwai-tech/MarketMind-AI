import React from 'react';
import { Globe2, Activity, TrendingUp, TrendingDown, Layers, Scale, Sparkles } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';

interface BreadthIntermarketViewProps {
  data: ComprehensiveMarketData;
}

export const BreadthIntermarketView: React.FC<BreadthIntermarketViewProps> = ({ data }) => {
  const { breadth, intermarket, quote } = data;

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* 1. Market Breadth Command Panel */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-[#2d3139] gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Market Breadth & Participation Engine
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-400">Breadth Status:</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-bold font-mono text-[10px]">
              {breadth.breadthStatus} (Score: {breadth.breadthScore}/100)
            </span>
          </div>
        </div>

        {/* Breadth Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">S&P 500 Adv / Dec</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-1">
              {breadth.sp500Adv} <span className="text-slate-500 text-xs font-normal">/</span> {breadth.sp500Dec}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Ratio: {breadth.sp500AdvDecRatio}x Bullish</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">NASDAQ Adv / Dec</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-1">
              {breadth.nasdaqAdv} <span className="text-slate-500 text-xs font-normal">/</span> {breadth.nasdaqDec}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Ratio: 1.76x Advancing</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">NYSE Adv / Dec</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-1">
              {breadth.nyseAdv} <span className="text-slate-500 text-xs font-normal">/</span> {breadth.nyseDec}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">Ratio: 1.98x Advancing</div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139]">
            <div className="text-[9px] text-slate-400 uppercase font-bold">Up Volume vs Down Volume</div>
            <div className="text-base font-black font-mono text-emerald-400 mt-1">
              {breadth.upVolumeRatio}%
            </div>
            <div className="w-full bg-[#2d3139] h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-500 h-full" style={{ width: `${breadth.upVolumeRatio}%` }} />
            </div>
          </div>
        </div>

        {/* % Above Key SMAs & Highs/Lows */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
              <span>% Above 20-Day SMA</span>
              <span className="font-mono text-emerald-400">{breadth.pctAbove20SMA}%</span>
            </div>
            <div className="w-full bg-[#2d3139] h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full" style={{ width: `${breadth.pctAbove20SMA}%` }} />
            </div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
              <span>% Above 50-Day SMA</span>
              <span className="font-mono text-emerald-400">{breadth.pctAbove50SMA}%</span>
            </div>
            <div className="w-full bg-[#2d3139] h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full" style={{ width: `${breadth.pctAbove50SMA}%` }} />
            </div>
          </div>

          <div className="bg-[#1c1f24] p-2.5 rounded border border-[#2d3139] flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase">
              <span>% Above 200-Day SMA</span>
              <span className="font-mono text-emerald-400">{breadth.pctAbove200SMA}%</span>
            </div>
            <div className="w-full bg-[#2d3139] h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full" style={{ width: `${breadth.pctAbove200SMA}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Intermarket Cross-Asset Correlations Table */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex justify-between items-center pb-2 border-b border-[#2d3139]">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cross-Asset Intermarket Correlations & Macro Drivers
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 italic">
            "SPY is rising while VIX and Treasury yields are falling, supporting bullish equity continuation."
          </span>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#2d3139] text-[10px] text-slate-400 uppercase">
                <th className="pb-2">Asset Symbol</th>
                <th className="pb-2">Asset Name</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">Change %</th>
                <th className="pb-2">Correlation to {quote.ticker}</th>
                <th className="pb-2">SPY Impact</th>
                <th className="pb-2">Quant Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22262d]">
              {intermarket.map((item) => {
                const isItemPos = item.changePercent >= 0;
                return (
                  <tr key={item.symbol} className="hover:bg-[#1c1f24]/60 transition">
                    <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-[#1c1f24] rounded border border-[#2d3139]">
                        {item.symbol}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300 font-sans">{item.name}</td>
                    <td className="py-2.5 font-bold text-white">${item.price.toLocaleString()}</td>
                    <td className={`py-2.5 font-bold ${isItemPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isItemPos ? '+' : ''}{item.changePercent}%
                    </td>
                    <td className="py-2.5 text-slate-300">
                      {item.correlationWithSPY > 0 ? '+' : ''}{item.correlationWithSPY}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                          item.impactOnSPY === 'BULLISH'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : item.impactOnSPY === 'BEARISH'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {item.impactOnSPY}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans text-[11px] max-w-[280px]">
                      {item.notes}
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
