import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Globe,
  Radio,
} from 'lucide-react';
import {
  NormalizedInstrument,
  UniversalAssetClass,
  InstrumentSearchResultGroup,
} from '../../types/instrument';
import { formatPercent, isFiniteMarketNumber } from '../../utils/formatters';
import { AssetClassBadge, RealTimeBadge, SessionStatusBadge } from '../common/AssetClassBadge';
import { InstrumentDirectoryService } from '../../services/marketProviders/InstrumentDirectoryService';
import { ProviderCapabilityPanel } from './ProviderCapabilityPanel';

interface MultiAssetMarketsViewProps {
  selectedInstrument: NormalizedInstrument;
  onSelectInstrument: (instrument: NormalizedInstrument) => void;
  onOpenAiAnalysis: (instrument: NormalizedInstrument) => void;
  watchlistIds: string[];
  onToggleWatchlist: (instrumentId: string) => void;
}

export const MultiAssetMarketsView: React.FC<MultiAssetMarketsViewProps> = ({
  selectedInstrument,
  onSelectInstrument,
  onOpenAiAnalysis,
  watchlistIds,
  onToggleWatchlist,
}) => {
  const [activeAssetFilter, setActiveAssetFilter] = useState<UniversalAssetClass | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [instruments, setInstruments] = useState<NormalizedInstrument[]>([]);
  const [showProviderMatrix, setShowProviderMatrix] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'changePercent' | 'volume'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filterTabs: Array<{ id: UniversalAssetClass | 'ALL'; label: string; count?: number }> = [
    { id: 'ALL', label: 'All Markets' },
    { id: 'STOCK', label: 'Stocks' },
    { id: 'ETF', label: 'ETFs & Funds' },
    { id: 'OPTION', label: 'Options' },
    { id: 'FOREX', label: 'Forex (24/5)' },
    { id: 'CRYPTO_PAIR', label: 'Crypto (24/7)' },
    { id: 'FUTURES', label: 'Futures' },
    { id: 'COMMODITY', label: 'Commodities' },
    { id: 'INDEX', label: 'Indexes' },
    { id: 'TREASURY', label: 'Fixed Income' },
    { id: 'ECONOMIC_INDICATOR', label: 'Macro Indicators' },
  ];

  useEffect(() => {
    const filter = activeAssetFilter === 'ALL' ? undefined : activeAssetFilter;
    const { results } = InstrumentDirectoryService.search(searchQuery, filter);

    // Apply sorting
    const sorted = [...results].sort((a, b) => {
      let valA = a[sortBy] ?? 0;
      let valB = b[sortBy] ?? 0;

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }

      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    setInstruments(sorted);
  }, [activeAssetFilter, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: 'symbol' | 'price' | 'changePercent' | 'volume') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Controls */}
      <div className="bg-[#111317] border border-[#232731] rounded-xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter instruments by symbol, name, or exchange..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#171922] border border-[#272b37] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] transition font-mono"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProviderMatrix(!showProviderMatrix)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition ${
                showProviderMatrix
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F2D675]'
                  : 'bg-[#171922] border-[#272b37] text-slate-300 hover:text-white hover:bg-[#20242f]'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Provider Capabilities</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          {filterTabs.map((tab) => {
            const isActive = activeAssetFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAssetFilter(tab.id)}
                className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#D4AF37] text-black font-bold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                    : 'bg-[#171922] text-slate-400 hover:text-white hover:bg-[#20242f] border border-[#272b37]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Provider Matrix Drawer */}
      {showProviderMatrix && <ProviderCapabilityPanel />}

      {/* Main Multi-Asset Table */}
      <div className="bg-[#111317] border border-[#232731] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#20242e] bg-[#14161d] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="p-3.5 pl-4 cursor-pointer" onClick={() => handleSort('symbol')}>
                  Instrument / Symbol
                </th>
                <th className="p-3.5">Asset Class</th>
                <th className="p-3.5 cursor-pointer text-right" onClick={() => handleSort('price')}>
                  Price
                </th>
                <th className="p-3.5 cursor-pointer text-right" onClick={() => handleSort('changePercent')}>
                  24h / Session Change
                </th>
                <th className="p-3.5 text-right hidden sm:table-cell">Spread</th>
                <th className="p-3.5 text-center hidden md:table-cell">Session Regime</th>
                <th className="p-3.5 text-center hidden lg:table-cell">Feed Routing</th>
                <th className="p-3.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1c202a] text-xs">
              {instruments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p>No financial instruments matched your criteria</p>
                  </td>
                </tr>
              ) : (
                instruments.map((inst) => {
                  const isSelected = selectedInstrument?.instrumentId === inst.instrumentId;
                  const isWatchlisted = watchlistIds.includes(inst.instrumentId);
                  const isPositive = (inst.changePercent || 0) >= 0;
                  const isForex = inst.assetClass === 'FOREX';
                  const decimals = isForex ? 4 : 2;

                  return (
                    <tr
                      key={inst.instrumentId}
                      className={`hover:bg-[#161922] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#181b25] border-l-2 border-l-[#D4AF37]' : ''
                      }`}
                      onClick={() => onSelectInstrument(inst)}
                    >
                      {/* Symbol & Name */}
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist(inst.instrumentId);
                            }}
                            className="text-slate-500 hover:text-[#D4AF37] transition"
                          >
                            {isWatchlisted ? (
                              <BookmarkCheck className="w-4 h-4 text-[#D4AF37]" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold font-mono text-sm text-white">
                                {inst.displaySymbol || inst.symbol}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-[#1a1d26] rounded border border-[#2b303d]">
                                {inst.exchange}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                              {inst.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Asset Class Badge */}
                      <td className="p-3.5">
                        <AssetClassBadge assetClass={inst.assetClass} size="sm" />
                      </td>

                      {/* Price */}
                      <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                        {inst.currency === 'USD' ? '$' : ''}
                        {inst.price != null
                          ? inst.price.toLocaleString(undefined, {
                              minimumFractionDigits: decimals,
                              maximumFractionDigits: decimals,
                            })
                          : '--'}
                      </td>

                      {/* Change */}
                      <td className="p-3.5 text-right font-mono">
                        <div
                          className={`font-semibold inline-flex items-center gap-1 ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>
                            {isFiniteMarketNumber(inst.changePercent)
                              ? formatPercent(inst.changePercent)
                              : 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Spread */}
                      <td className="p-3.5 text-right font-mono text-slate-400 hidden sm:table-cell">
                        {isFiniteMarketNumber(inst.spread)
                          ? inst.spread!.toFixed(decimals)
                          : 'N/A'}
                      </td>

                      {/* Session Regime */}
                      <td className="p-3.5 text-center hidden md:table-cell">
                        <SessionStatusBadge sessionState={inst.tradingSession === 'CONTINUOUS_24_7' ? 'ACTIVE_24_7' : inst.tradingSession === 'REGULAR_24_5' ? 'ACTIVE_24_5' : 'REGULAR'} />
                      </td>

                      {/* Feed Routing */}
                      <td className="p-3.5 text-center hidden lg:table-cell">
                        <span className="font-mono text-[10px] text-slate-400">
                          {inst.primaryProvider.toUpperCase()}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onOpenAiAnalysis(inst)}
                            title="Run Multi-Asset Tactical AI Intelligence"
                            className="p-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#F2D675] border border-[#D4AF37]/40 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectInstrument(inst)}
                            title="Focus Chart & Analytics"
                            className="p-1.5 rounded-lg bg-[#1a1d26] hover:bg-[#222733] text-slate-300 hover:text-white border border-[#2b303d] transition"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#14161d] border-t border-[#20242e] flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>
            Showing <strong className="text-slate-300">{instruments.length}</strong> instruments across active license router
          </span>
          <span>Press &ldquo;/&rdquo; to open universal multi-asset search</span>
        </div>
      </div>
    </div>
  );
};
