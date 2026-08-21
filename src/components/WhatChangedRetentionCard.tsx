import { useI18n } from '../i18n/I18nContext.js';
import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import { MarketNewsItem } from '../types/market.js';
import {
  VerifiedMarketCatalyst,
  validateVerifiedCatalyst,
  formatRelativeTime,
} from '../utils/verifiedCatalystService.js';

interface WhatChangedRetentionCardProps {
  onSelectSymbol: (symbol: string) => void;
  onAskAI?: (prompt: string) => void;
  news?: MarketNewsItem[];
  rawEvents?: any[];
  className?: string;
}

const LAST_VISIT_KEY = 'marketmind_last_visit_timestamp';

export const WhatChangedRetentionCard: React.FC<WhatChangedRetentionCardProps> = ({
  onSelectSymbol,
  onAskAI,
  news = [],
  rawEvents = [],
  className = '',
}) => {
  const { t } = useI18n();
  const [lastVisitLabel, setLastVisitLabel] = useState<string>('Earlier today');
  const [lastVisitMs, setLastVisitMs] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    const prevTimestamp = localStorage.getItem(LAST_VISIT_KEY);
    const now = Date.now();

    if (prevTimestamp) {
      const prevMs = parseInt(prevTimestamp, 10);
      if (!isNaN(prevMs) && prevMs > 0) {
        setLastVisitMs(prevMs);
        const hoursAgo = Math.max(1, Math.round((now - prevMs) / (1000 * 60 * 60)));
        setLastVisitLabel(hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`);
      } else {
        setLastVisitLabel('First session today');
      }
    } else {
      setLastVisitLabel('First session today');
    }

    // Record current session timestamp for next visit
    localStorage.setItem(LAST_VISIT_KEY, String(now));
  }, []);

  // Filter & validate verified events strictly
  const verifiedCatalysts = useMemo(() => {
    const combinedCandidates = [...news, ...rawEvents];
    const results: VerifiedMarketCatalyst[] = [];

    for (const item of combinedCandidates) {
      const validated = validateVerifiedCatalyst(item, lastVisitMs);
      if (validated) {
        results.push(validated);
      }
    }

    // Sort by publication timestamp descending
    return results.sort((a, b) => b.publishedAtMs - a.publishedAtMs);
  }, [news, rawEvents, lastVisitMs]);

  return (
    <div className={`bg-[#0F0F12] border border-[#27272E] rounded-xl p-4 shadow-lg select-none font-sans ${className}`}>
      {/* 1. Header & Last Visit Session Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#222228]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-[#17171F] border border-[#D4AF37]/40 rounded-lg text-[#D4AF37]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono tracking-tight">
                {t('dashboard.whatChanged')}
              </h3>
              <span className="px-2 py-0.5 bg-[#1E1E26] text-[#D4AF37] text-[10px] font-mono rounded font-semibold border border-[#D4AF37]/20">
                {lastVisitLabel}
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] font-mono">
              Genuinely verified market developments &bull; Source provenance & timestamp verified
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-[#D4AF37] hover:underline font-mono cursor-pointer"
        >
          {isExpanded ? t('dashboard.hideBrief') : t('dashboard.viewChanges')}
        </button>
      </div>

      {/* 2. Verified Catalyst Grid or Empty State */}
      {isExpanded && (
        <div className="mt-3">
          {verifiedCatalysts.length === 0 ? (
            <div className="p-6 bg-[#131317] border border-[#202026] rounded-lg text-center font-mono">
              <div className="flex flex-col items-center justify-center gap-2">
                <Info className="w-6 h-6 text-[#9CA3AF] opacity-60" />
                <span className="text-xs font-bold text-[#E5E5E5]">
                  {t('dashboard.noVerifiedDevelopments')}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  MarketMind strictly rejects unverified stories, missing sources, and sample news.
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {verifiedCatalysts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#131317] border border-[#202026] hover:border-[#D4AF37]/50 rounded-lg transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Row: Symbol, Relative Time & Sentiment */}
                    <div className="flex items-center justify-between mb-1.5 font-mono">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectSymbol(item.symbol)}
                          className="px-1.5 py-0.5 bg-[#1C1C24] text-[#F2D675] hover:text-white text-[10px] font-bold rounded border border-[#D4AF37]/30 transition cursor-pointer"
                        >
                          {item.symbol}
                        </button>
                        <span className="text-[10px] text-[#71717A]">
                          {formatRelativeTime(item.publishedAtMs)}
                        </span>
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
                        <span className="text-amber-400 text-[10px] font-semibold flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> Neutral
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-white group-hover:text-[#F2D675] transition-colors leading-tight">
                      {item.title}
                    </h4>

                    {/* Description */}
                    {item.description && (
                      <p className="text-[11px] text-[#A1A1AA] mt-1 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Row: Provenance Source, Verification Badge & Clickable Source Link */}
                  <div className="mt-2 pt-2 border-t border-[#1C1C22] flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Fact</span>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4AF37] hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                      title={`Read original story from ${item.source}`}
                    >
                      <span className="truncate max-w-[80px]">{item.source}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
