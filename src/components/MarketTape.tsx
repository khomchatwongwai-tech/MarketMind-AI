import React, { useEffect, useState } from 'react';
import { fetchLiveTape } from '../services/marketDataService';
import { TrendingUp, TrendingDown, Radio, Zap } from 'lucide-react';
import { TickerSymbol } from '../types/market';

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

export const MarketTape: React.FC<MarketTapeProps> = ({
  selectedTicker,
  onSelectTicker,
  isLive,
}) => {
  const [tapeQuotes, setTapeQuotes] = useState<TapeQuote[]>([
    { symbol: 'SPY', name: 'S&P 500 ETF', price: 512.48, change: 4.2, changePercent: 0.82 },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 442.35, change: 4.25, changePercent: 0.97 },
    { symbol: 'DIA', name: 'Dow Jones ETF', price: 391.2, change: 1.8, changePercent: 0.46 },
    { symbol: 'IWM', name: 'Russell 2000', price: 214.8, change: 2.7, changePercent: 1.27 },
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: 128.6, change: 3.7, changePercent: 2.96 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 224.2, change: 2.7, changePercent: 1.22 },
    { symbol: 'MSFT', name: 'Microsoft Corp', price: 428.9, change: 3.8, changePercent: 0.89 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 218.4, change: 5.6, changePercent: 2.63 },
    { symbol: 'AMZN', name: 'Amazon.com', price: 186.75, change: 2.55, changePercent: 1.38 },
    { symbol: 'META', name: 'Meta Platforms', price: 514.3, change: 7.5, changePercent: 1.48 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 154.2, change: 3.4, changePercent: 2.25 },
    { symbol: 'PLTR', name: 'Palantir Tech', price: 31.8, change: 0.9, changePercent: 2.91 },
    { symbol: 'COIN', name: 'Coinbase Global', price: 215.3, change: 5.8, changePercent: 2.77 },
  ]);

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

    const interval = setInterval(loadTape, 5000);
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
          const isPos = item.change >= 0;
          return (
            <button
              key={item.symbol}
              onClick={() => onSelectTicker(item.symbol as TickerSymbol)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono shrink-0 transition ${
                isSelected
                  ? 'bg-gradient-to-r from-[rgba(212,175,55,0.2)] to-[rgba(20,20,20,0.9)] text-white border border-[#D4AF37] font-black shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                  : 'bg-[#0A0A0A] hover:bg-[#101010] text-[#9CA3AF] hover:text-[#E5E5E5] border border-[#1C1C1C]'
              }`}
              title={`Click to load live ${item.name} analysis`}
            >
              <span className="font-bold text-white">{item.symbol}</span>
              <span className="text-[#E5E5E5]">${item.price.toFixed(2)}</span>
              <span
                className={`flex items-center text-[10px] font-bold ${
                  isPos ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {isPos ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </span>
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
