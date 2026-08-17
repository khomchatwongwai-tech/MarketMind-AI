import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Sparkles,
  Globe,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { NormalizedInstrument, UniversalAssetClass, InstrumentSearchResultGroup } from '../../types/instrument';
import { AssetClassBadge, RealTimeBadge } from '../common/AssetClassBadge';
import { InstrumentDirectoryService } from '../../services/marketProviders/InstrumentDirectoryService';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInstrument: (instrument: NormalizedInstrument) => void;
  initialQuery?: string;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectInstrument,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeAssetFilter, setActiveAssetFilter] = useState<UniversalAssetClass | 'ALL'>('ALL');
  const [groupedResults, setGroupedResults] = useState<InstrumentSearchResultGroup[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterTabs: Array<{ id: UniversalAssetClass | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Instruments' },
    { id: 'STOCK', label: 'Stocks & ADRs' },
    { id: 'ETF', label: 'ETFs & Funds' },
    { id: 'OPTION', label: 'Options' },
    { id: 'FOREX', label: 'Forex (24/5)' },
    { id: 'CRYPTO_PAIR', label: 'Crypto (24/7)' },
    { id: 'FUTURES', label: 'Futures' },
    { id: 'COMMODITY', label: 'Commodities' },
    { id: 'INDEX', label: 'Indexes' },
    { id: 'TREASURY', label: 'Fixed Income' },
    { id: 'BOND', label: 'Bonds' },
    { id: 'ECONOMIC_INDICATOR', label: 'Macro Series' },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Execute search
  useEffect(() => {
    const filter = activeAssetFilter === 'ALL' ? undefined : activeAssetFilter;
    const { groupedResults: groups, totalCount } = InstrumentDirectoryService.search(query, filter);
    setGroupedResults(groups);
    setTotalMatches(totalCount);
    setSelectedIndex(0);
  }, [query, activeAssetFilter]);

  if (!isOpen) return null;

  // Flattened items list for keyboard navigation
  const flatItems: NormalizedInstrument[] = groupedResults.flatMap((g) => g.instruments);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        onSelectInstrument(flatItems[selectedIndex]);
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-20 px-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#0d0e11] border border-[#2d3139] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input Header */}
        <div className="p-3.5 border-b border-[#24272e] flex items-center gap-3 bg-[#13151a]">
          <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks, ETFs, options, forex, crypto, futures, commodities, bonds, yields (e.g. NVDA, EUR/USD, BTC, /ES, SPY 515C, US10Y)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1e222b] transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-mono text-slate-400 hover:text-white border border-[#2d3139] rounded bg-[#181b22] hover:bg-[#222731] transition"
          >
            ESC
          </button>
        </div>

        {/* Asset Class Filter Tabs */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#1f2229] bg-[#0f1115] overflow-x-auto scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = activeAssetFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAssetFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-[#D4AF37]/20 text-[#F2D675] border border-[#D4AF37]/50 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1d24] border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 divide-y divide-[#1e222b]/50 scrollbar-thin">
          {groupedResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No financial instruments matched your search</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try searching by exact symbol (e.g. AAPL, BTC/USD, EUR/USD, /ES), company name, index, or contract type.
              </p>
            </div>
          ) : (
            groupedResults.map((group, gIdx) => (
              <div key={group.title} className={gIdx > 0 ? 'pt-3' : ''}>
                <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37] font-bold">
                  <span>{group.title}</span>
                  <span className="text-slate-500 text-[10px]">{group.instruments.length} instruments</span>
                </div>

                <div className="space-y-1">
                  {group.instruments.map((inst) => {
                    const itemGlobalIndex = flatItems.findIndex((i) => i.instrumentId === inst.instrumentId);
                    const isSelected = itemGlobalIndex === selectedIndex;
                    const isPositive = (inst.changePercent || 0) >= 0;

                    return (
                      <div
                        key={inst.instrumentId}
                        onClick={() => {
                          onSelectInstrument(inst);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={`p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-[#181b22] border-[#D4AF37]/60 shadow-[0_0_12px_rgba(212,175,55,0.1)]'
                            : 'bg-[#111317] border-[#1e222a] hover:bg-[#16181f] hover:border-[#2d313b]'
                        }`}
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <AssetClassBadge assetClass={inst.assetClass} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm tracking-wide">
                                {inst.displaySymbol || inst.symbol}
                              </span>
                              {inst.exchange && (
                                <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-[#1b1e26] rounded border border-[#2a2e38]">
                                  {inst.exchange}
                                </span>
                              )}
                              {inst.country && (
                                <span className="text-[10px] text-slate-500 hidden sm:inline">
                                  {inst.country}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-md">
                              {inst.name}
                            </p>
                          </div>
                        </div>

                        {/* Right Price & Provider Info */}
                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div>
                            <div className="font-mono text-sm font-bold text-white">
                              {inst.currency === 'USD' ? '$' : ''}
                              {inst.price != null
                                ? inst.price.toLocaleString(undefined, {
                                    minimumFractionDigits: inst.assetClass === 'FOREX' ? 4 : 2,
                                    maximumFractionDigits: inst.assetClass === 'FOREX' ? 4 : 2,
                                  })
                                : '--'}
                            </div>
                            {inst.changePercent != null && (
                              <div
                                className={`text-[11px] font-mono font-semibold flex items-center justify-end gap-0.5 ${
                                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{isPositive ? '+' : ''}{inst.changePercent.toFixed(2)}%</span>
                              </div>
                            )}
                          </div>

                          <ArrowRight className={`w-4 h-4 transition ${isSelected ? 'text-[#D4AF37] translate-x-0.5' : 'text-slate-600'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info & Entitlement transparency */}
        <div className="p-2.5 px-4 bg-[#111317] border-t border-[#20232b] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <strong>{totalMatches}</strong> total instruments indexed
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Licensed Multi-Asset Gateway
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-500">
            <span>Use &uarr; &darr; to navigate</span>
            <span>&bull;</span>
            <span>Press Enter to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
