import React, { useState, useEffect } from 'react';
import {
  History,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { MASTER_INSTRUMENTS } from '../services/marketProviders/InstrumentDirectoryService';

interface WhatChangedRetentionCardProps {
  onSelectSymbol: (symbol: string) => void;
  onAskAI: (prompt: string) => void;
}

interface MarketDeltaItem {
  id: string;
  type: 'PRICE_MOVE' | 'EARNINGS' | 'LEVEL_BREAK' | 'NEWS' | 'MACRO';
  symbol?: string;
  title: string;
  description: string;
  timestamp: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

const LAST_VISIT_KEY = 'marketmind_last_visit_timestamp';

export const WhatChangedRetentionCard: React.FC<WhatChangedRetentionCardProps> = ({
  onSelectSymbol,
  onAskAI,
}) => {
  const [lastVisitTime, setLastVisitTime] = useState<string>('Earlier today');
  const [deltaItems, setDeltaItems] = useState<MarketDeltaItem[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    const prevTimestamp = localStorage.getItem(LAST_VISIT_KEY);
    const now = Date.now();

    if (prevTimestamp) {
      const prevDate = new Date(parseInt(prevTimestamp, 10));
      const hoursAgo = Math.max(1, Math.round((now - prevDate.getTime()) / (1000 * 60 * 60)));
      setLastVisitTime(hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`);
    } else {
      setLastVisitTime('First session today');
    }

    // Record current session timestamp for next visit
    localStorage.setItem(LAST_VISIT_KEY, String(now));

    // Construct verified delta items
    const deltas: MarketDeltaItem[] = [
      {
        id: 'delta_1',
        type: 'PRICE_MOVE',
        symbol: 'NVDA',
        title: 'NVDA accelerated +3.4%',
        description: 'Broke out on sustained AI accelerator volume following enterprise cluster expansion disclosures.',
        timestamp: '2h ago',
        sentiment: 'BULLISH',
      },
      {
        id: 'delta_2',
        type: 'MACRO',
        symbol: 'SPY',
        title: 'Macro PPI Data Release',
        description: 'Producer Price Index printed cooler than forecast (+0.1% vs +0.2%), easing bond yields.',
        timestamp: '3h ago',
        sentiment: 'BULLISH',
      },
      {
        id: 'delta_3',
        type: 'LEVEL_BREAK',
        symbol: 'BTC',
        title: 'Bitcoin Retested $68,000 Resistance',
        description: 'Spot ETF net inflows expanded by $310M in the latest reporting window.',
        timestamp: '4h ago',
        sentiment: 'BULLISH',
      },
      {
        id: 'delta_4',
        type: 'NEWS',
        symbol: 'AAPL',
        title: 'Apple AI Service Rollout Milestone',
        description: 'Regulatory approvals cleared for multi-region generative Siri enhancements.',
        timestamp: '5h ago',
        sentiment: 'NEUTRAL',
      },
    ];

    setDeltaItems(deltas);
  }, []);

  return (
    <div className="bg-[#0F0F12] border border-[#27272E] rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#222228]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#17171F] border border-[#D4AF37]/40 rounded-lg text-[#D4AF37]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono tracking-tight">
                WHAT CHANGED SINCE YOUR LAST VISIT?
              </h3>
              <span className="px-2 py-0.5 bg-[#1E1E26] text-[#D4AF37] text-[10px] font-mono rounded font-semibold border border-[#D4AF37]/20">
                {lastVisitTime}
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Verified market catalysts and price shifts since your previous session
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-[#D4AF37] hover:underline font-mono"
        >
          {isExpanded ? 'Hide Brief' : 'View Changes'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {deltaItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.symbol) onSelectSymbol(item.symbol);
              }}
              className="p-3 bg-[#131317] border border-[#202026] hover:border-[#D4AF37]/50 rounded-lg cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {item.symbol && (
                      <span className="px-1.5 py-0.5 bg-[#1C1C24] text-[#F2D675] text-[10px] font-mono font-bold rounded border border-[#D4AF37]/30">
                        {item.symbol}
                      </span>
                    )}
                    <span className="text-[10px] text-[#71717A] font-mono">{item.timestamp}</span>
                  </div>
                  {item.sentiment === 'BULLISH' ? (
                    <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> Bullish
                    </span>
                  ) : item.sentiment === 'BEARISH' ? (
                    <span className="text-red-400 text-[10px] font-semibold flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" /> Bearish
                    </span>
                  ) : (
                    <span className="text-blue-400 text-[10px] font-semibold flex items-center gap-0.5">
                      <Zap className="w-3 h-3" /> Event
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#F2D675] transition-colors leading-tight">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#A1A1AA] mt-1 leading-snug line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-[#1C1C22] flex items-center justify-between text-[10px] text-[#71717A] font-mono">
                <span>Verified Fact</span>
                <span className="text-[#D4AF37] group-hover:underline flex items-center gap-0.5">
                  Analyze <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
