import React, { useEffect, useState, useMemo } from 'react';
import { fetchLiveTape } from '../services/marketDataService';
import { TrendingUp, TrendingDown, Radio, Zap } from 'lucide-react';
import { TickerSymbol } from '../types/market';
import { useRealTimeWatchlist } from '../hooks/useRealTimeMarket';

interface MarketTapeProps {
  selectedTicker: TickerSymbol;
  onSelectTicker: (ticker: TickerSymbol) => void;
  isLive: boolean;
}

interface TapeQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

const DEFAULT_SYMBOLS = [
  'SPY',
  'QQQ',
  'DIA',
  'IWM',
  'NVDA',
  'AAPL',
  'MSFT',
  'TSLA',
  'AMZN',
  'META',
  'AMD',
  'PLTR',
  'COIN',
  'BTC-USD',
  'ETH-USD',
];

export const MarketTape: React.FC<MarketTapeProps> = ({
  selectedTicker,
  onSelectTicker,
  isLive,
}) => {
  const [tapeQuotes, setTapeQuotes] = useState<TapeQuote[]>(() =>
    DEFAULT_SYMBOLS.map((sym) => ({
      symbol: sym,
      name: `${sym} Asset`,
      price: 0,
      change: 0,
      changePercent: 0,
    }))
  );

  const symbolsList = useMemo(() => DEFAULT_SYMBOLS, []);
  const { quotes: rtQuotes, flashes: rtFlashes } = useRealTimeWatchlist(symbolsList, 'tape');

  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    let mounted = true;
    const loadTape = async () => {
      const liveTape = await fetchLiveTape();
      if (mounted && liveTape && liveTape.length > 0) {
        setTapeQuotes(liveTape);
        setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    };

    loadTape();
    if (!isLive) return;

    const interval = setInterval(loadTape, 6000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isLive]);

  return (
    <div className="bg-[#050505] border-b border-[#242424] px-3.5 py-1.5 flex items-center justify-between overflow-hidden select-none text-xs">
      <div className="flex items-center gap-2 pr-3.5 border-r border-[#242424] shrink-0">
        <span className="relative flex h-2 w-2">
          {isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLive ? 'bg-[#22C55E]' : 'bg-[#6B7280]'
            }`}
          ></span>
        </span>
        <span className="font-mono text-[10px] font-extrabold text-[#E5E5E5] uppercase tracking-widest flex items-center gap-1">
          <Radio className="w-3 h-3 text-[#D4AF37]" />
          Direct Multi-Feed
        </span>
        <span className="text-[9px] text-[#6B7280] font-mono hidden md:inline">
          {lastSync}
        </span>
      </div>

      {/* Horizontal scrolling ticker ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-2 flex-1 scroll-smooth">
        {tapeQuotes.map((item) => {
          const isSelected = selectedTicker.toUpperCase() === item.symbol.toUpperCase();
          const rtQuote = rtQuotes[item.symbol.toUpperCase()];
          const flash = rtFlashes[item.symbol.toUpperCase()];

          const currentPrice = rtQuote && rtQuote.price > 0 ? rtQuote.price : item.price;
          const currentChange = rtQuote && rtQuote.change !== undefined ? rtQuote.change : item.change;
          const currentChangePct = rtQuote && rtQuote.changePercent !== undefined ? rtQuote.changePercent : item.changePercent;
          const isPos = currentChange >= 0;
          const hasValidPrice = currentPrice > 0;

          return (
            <button
              key={item.symbol}
              onClick={() => onSelectTicker(item.symbol as TickerSymbol)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono shrink-0 transition-all duration-300 ${
                flash === 'UP'
                  ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 ring-1 ring-emerald-500'
                  : flash === 'DOWN'
                  ? 'bg-rose-900/60 border-rose-400 text-rose-200 ring-1 ring-rose-500'
                  : isSelected
                  ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[rgba(20,20,20,0.9)] text-white border border-[#D4AF37] font-black shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                  : 'bg-[#0A0A0A] hover:bg-[#101010] text-[#9CA3AF] hover:text-[#E5E5E5] border border-[#1C1C1C]'
              }`}
              title={`Click to load live ${item.name} analysis`}
            >
              <span className="font-bold text-white">{item.symbol}</span>
              <span className="text-[#E5E5E5]">{hasValidPrice ? `$${currentPrice.toFixed(2)}` : '--'}</span>
              {hasValidPrice && (
                <span
                  className={`flex items-center text-[10px] font-bold ${
                    isPos ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}
                >
                  {isPos ? '+' : ''}
                  {currentChangePct.toFixed(2)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-[#242424] shrink-0 text-[10px] font-mono text-[#9CA3AF]">
        <Zap className="w-3 h-3 text-[#D4AF37]" />
        <span>Sub-millisecond Routing</span>
      </div>
    </div>
  );
};
