import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, ChevronRight, Flame } from 'lucide-react';
import { TickerSymbol } from '../types/market.js';
import { useRealTimeWatchlist } from '../hooks/useRealTimeMarket.js';
import { isFiniteMarketNumber } from '../utils/formatters.js';

interface MarketMoversCardProps {
  onSelectTicker?: (ticker: TickerSymbol) => void;
  onViewAll?: () => void;
}

interface MoverItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  category: 'gainers' | 'losers' | 'active';
}

const INITIAL_MOVERS: MoverItem[] = [
  // Top Gainers
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 128.65, change: 8.42, changePercent: 7.01, volume: '94.2M', category: 'gainers' },
  { symbol: 'PLTR', name: 'Palantir Technologies', price: 31.85, change: 1.95, changePercent: 6.52, volume: '48.6M', category: 'gainers' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 154.20, change: 7.15, changePercent: 4.86, volume: '32.1M', category: 'gainers' },
  { symbol: 'SMCI', name: 'Super Micro Computer', price: 612.40, change: 24.80, changePercent: 4.22, volume: '12.4M', category: 'gainers' },

  // Top Losers
  { symbol: 'TSLA', name: 'Tesla Inc', price: 214.50, change: -9.20, changePercent: -4.11, volume: '62.8M', category: 'losers' },
  { symbol: 'INTC', name: 'Intel Corporation', price: 19.80, change: -0.72, changePercent: -3.51, volume: '55.3M', category: 'losers' },
  { symbol: 'NKE', name: 'Nike Inc', price: 82.30, change: -2.45, changePercent: -2.89, volume: '18.9M', category: 'losers' },
  { symbol: 'COIN', name: 'Coinbase Global', price: 205.10, change: -5.40, changePercent: -2.56, volume: '14.2M', category: 'losers' },

  // Most Active
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', price: 530.48, change: 4.12, changePercent: 0.78, volume: '72.4M', category: 'active' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 472.15, change: 5.60, changePercent: 1.20, volume: '48.9M', category: 'active' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 224.23, change: 1.85, changePercent: 0.83, volume: '42.5M', category: 'active' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', price: 178.50, change: 2.10, changePercent: 1.19, volume: '38.1M', category: 'active' },
];

export const MarketMoversCard: React.FC<MarketMoversCardProps> = ({
  onSelectTicker,
  onViewAll,
}) => {
  const [filter, setFilter] = useState<'gainers' | 'losers' | 'active'>('gainers');
  const symbols = INITIAL_MOVERS.map((m) => m.symbol);
  const { quotes: rtQuotes } = useRealTimeWatchlist(symbols, 'market_movers');

  const filteredMovers = INITIAL_MOVERS.filter((m) => m.category === filter);

  return (
    <div className="bg-[#0A0A0A] border border-[#242424] hover:border-[rgba(212,175,55,0.35)] rounded-xl p-3.5 shadow-xl transition select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#151515] border border-[#D4AF37]/30">
            <Flame className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
            Market Movers
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-[11px] font-mono text-[#F2D675] hover:text-[#FFE08A] transition cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter('gainers')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'gainers'
              ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/50 shadow-sm'
              : 'bg-[#101010] text-[#9CA3AF] border border-[#242424] hover:text-white'
          }`}
        >
          Top Gainers
        </button>
        <button
          onClick={() => setFilter('losers')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'losers'
              ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/50 shadow-sm'
              : 'bg-[#101010] text-[#9CA3AF] border border-[#242424] hover:text-white'
          }`}
        >
          Top Losers
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'active'
              ? 'bg-[#D4AF37]/15 text-[#F2D675] border border-[#D4AF37]/50 shadow-sm'
              : 'bg-[#101010] text-[#9CA3AF] border border-[#242424] hover:text-white'
          }`}
        >
          Most Active
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-[#1C1C1C]">
        {filteredMovers.map((item) => {
          const rtQuote = rtQuotes[item.symbol];
          const hasValidPrice = isFiniteMarketNumber(rtQuote?.price) && rtQuote!.price > 0;
          const hasValidChange = isFiniteMarketNumber(rtQuote?.changePercent);
          const price = hasValidPrice ? rtQuote!.price : null;
          const changePct = hasValidChange ? rtQuote!.changePercent : null;
          const isPos = changePct !== null ? changePct >= 0 : true;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectTicker && onSelectTicker(item.symbol as TickerSymbol)}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-[#101010] rounded-lg transition cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-white text-xs">{item.symbol}</span>
                  <span className="text-[10px] text-[#9CA3AF] font-mono truncate max-w-[140px]">
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280] font-mono">Vol {item.volume}</span>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="font-mono font-black text-white text-xs">
                  {hasValidPrice ? `$${price!.toFixed(2)}` : 'Unavailable'}
                </span>
                {hasValidChange ? (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                      isPos
                        ? 'bg-[#22C55E]/15 text-[#22C55E]'
                        : 'bg-[#EF4444]/15 text-[#EF4444]'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {changePct!.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-[#6B7280] mt-0.5">Unavailable</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
