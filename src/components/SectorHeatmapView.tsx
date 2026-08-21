import { useI18n } from '../i18n/I18nContext.js';
import React from 'react';
import { PieChart, TrendingUp, TrendingDown, Award, Flame, BarChart3 } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';

interface SectorHeatmapViewProps {
  data: ComprehensiveMarketData;
}

export const SectorHeatmapView: React.FC<SectorHeatmapViewProps> = ({ data }) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  const { sectors, strongestSector, weakestSector } = data;

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Banner: Sector Leadership Spotlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-[#15171a] border border-[#10b981]/40 bg-gradient-to-r from-emerald-950/20 to-[#15171a] rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Strongest Sector Leader
              </div>
              <div className="text-base font-black text-white">
                {strongestSector.name} ({strongestSector.symbol})
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Index Weight: {strongestSector.weight}% &bull; Rel Volume: {strongestSector.volumeRelative}x
              </div>
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-400">
            +{strongestSector.changePercent}%
          </div>
        </div>

        <div className="bg-[#15171a] border border-[#f43f5e]/40 bg-gradient-to-r from-rose-950/20 to-[#15171a] rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 rounded-lg text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                Weakest Laggard Sector
              </div>
              <div className="text-base font-black text-white">
                {weakestSector.name} ({weakestSector.symbol})
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Index Weight: {weakestSector.weight}% &bull; Rel Volume: {weakestSector.volumeRelative}x
              </div>
            </div>
          </div>
          <div className="text-xl font-black font-mono text-rose-400">
            {weakestSector.changePercent}%
          </div>
        </div>
      </div>

      {/* 11 S&P Sectors Heatmap Grid */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3">
        <div className="flex justify-between items-center pb-2 border-b border-[#2d3139]">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#818cf8]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              S&P 500 11-Sector Relative Strength Heatmap
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Sized by Index Weight & Relative Capital Inflow
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mt-3">
          {sectors.map((sec) => {
            const isPos = sec.changePercent >= 0;
            return (
              <div
                key={sec.symbol}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                  sec.sentiment === 'Strong Bullish'
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : sec.sentiment === 'Bullish'
                    ? 'bg-emerald-900/20 border-emerald-700/30'
                    : sec.sentiment === 'Strong Bearish'
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : sec.sentiment === 'Bearish'
                    ? 'bg-rose-900/20 border-rose-700/30'
                    : 'bg-[#1c1f24] border-[#2d3139]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-black text-white font-mono px-2 py-0.5 bg-[#0f1013] rounded border border-[#2d3139]">
                      {sec.symbol}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 mt-1.5">{sec.name}</h4>
                  </div>
                  <div className={`text-base font-black font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? '+' : ''}{sec.changePercent}%
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#2d3139]/70 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Weight: {sec.weight}%</span>
                  <span
                    className={`font-bold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                      sec.sentiment.includes('Bullish')
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : sec.sentiment.includes('Bearish')
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {sec.sentiment}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
