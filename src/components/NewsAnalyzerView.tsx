import React, { useState } from 'react';
import { Newspaper, Sparkles, TrendingUp, TrendingDown, Minus, Filter, ExternalLink } from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { MarketNewsItem } from '../types/market';

interface NewsAnalyzerViewProps {
  data: ComprehensiveMarketData;
}

export const NewsAnalyzerView: React.FC<NewsAnalyzerViewProps> = ({ data }) => {
  const { news, quote } = data;
  const [filterSentiment, setFilterSentiment] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('ALL');

  const filteredNews = news.filter((item) => {
    if (filterSentiment === 'ALL') return true;
    return item.sentiment === filterSentiment;
  });

  return (
    <div className="flex flex-col gap-2.5 select-none text-[#e2e8f0]">
      {/* Top Filter Bar */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#818cf8]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Real-Time AI News & Catalyst Impact Analyzer
          </h3>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((sent) => (
            <button
              key={sent}
              onClick={() => setFilterSentiment(sent)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition ${
                filterSentiment === sent
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[#1c1f24] text-slate-400 hover:text-white border border-[#2d3139]'
              }`}
            >
              {sent}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed Grid / List */}
      <div className="space-y-2.5">
        {filteredNews.map((item) => {
          return (
            <div
              key={item.id}
              className={`bg-[#15171a] border rounded-lg p-3.5 transition hover:border-[#434956] ${
                item.sentiment === 'BULLISH'
                  ? 'border-l-4 border-l-emerald-500 border-[#2d3139]'
                  : item.sentiment === 'BEARISH'
                  ? 'border-l-4 border-l-rose-500 border-[#2d3139]'
                  : 'border-l-4 border-l-amber-500 border-[#2d3139]'
              }`}
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {item.publishedTime} &bull; {item.source}
                    </span>
                    <div className="flex gap-1">
                      {item.relevantTickers.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.2 bg-[#1c1f24] text-white border border-[#2d3139] rounded text-[9px] font-mono font-bold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h4 className="text-sm md:text-base font-bold text-white leading-snug">
                    {item.headline}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.summary}</p>
                </div>

                {/* Impact Badge */}
                <div className="flex flex-col items-end shrink-0">
                  <div
                    className={`px-2.5 py-1 rounded text-xs font-black uppercase font-mono flex items-center gap-1 border ${
                      item.sentiment === 'BULLISH'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : item.sentiment === 'BEARISH'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {item.sentiment === 'BULLISH' && <TrendingUp className="w-3.5 h-3.5" />}
                    {item.sentiment === 'BEARISH' && <TrendingDown className="w-3.5 h-3.5" />}
                    {item.sentiment === 'NEUTRAL' && <Minus className="w-3.5 h-3.5" />}
                    {item.sentiment} ({item.impactScore}/10)
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">
                    Market Weight: High
                  </span>
                </div>
              </div>

              {/* AI Contextual Interpretation Box */}
              <div className="mt-3 p-2.5 bg-[#1c1f24] rounded border border-[#2d3139] text-xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#818cf8] uppercase mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Quant Contextual Impact on {quote.ticker} & Sectors
                </div>
                <div className="text-slate-300 leading-relaxed font-sans">{item.aiExplanation}</div>
                <div className="mt-2 pt-1.5 border-t border-[#2d3139] flex flex-wrap justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>
                    Affected Sectors: <strong className="text-white">{item.sectorsAffected.join(', ')}</strong>
                  </span>
                  <span>
                    Expected Direct SPY Delta: <strong className="text-emerald-400">{item.potentialSPYImpact}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
