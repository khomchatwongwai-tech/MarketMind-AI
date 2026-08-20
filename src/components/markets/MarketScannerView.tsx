import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Zap,
} from 'lucide-react';
import { TickerSymbol } from '../../types/market.js';
import { MARKET_UNIVERSE, UniverseItem } from '../../data/marketUniverse.js';
import { useRealTimeWatchlist } from '../../hooks/useRealTimeMarket.js';
import { isFiniteMarketNumber, formatPrice, formatPercent, formatVolume } from '../../utils/formatters.js';

interface MarketScannerViewProps {
  onSelectTicker: (ticker: TickerSymbol) => void;
  watchlistSymbols?: string[];
  className?: string;
}

export type PresetFilter = 'all' | 'sp500' | 'nasdaq100' | 'dow30' | 'sector_etf' | 'top_movers' | 'most_active' | 'watchlist';
export type AssetTypeFilter = 'ALL' | 'STOCK' | 'ETF';
export type DirectionFilter = 'ALL' | 'GAINERS' | 'LOSERS' | 'FLAT';
export type VolumeFilter = 'ALL' | 'HIGH' | 'EXTREME';
export type SortColumn = 'symbol' | 'price' | 'changePercent' | 'volume' | 'relativeVolume' | 'name';
export type SortDirection = 'asc' | 'desc';

export const MarketScannerView: React.FC<MarketScannerViewProps> = ({
  onSelectTicker,
  watchlistSymbols = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'TSLA'],
  className = '',
}) => {
  // 1. Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreset, setActivePreset] = useState<PresetFilter>('all');
  const [assetType, setAssetType] = useState<AssetTypeFilter>('ALL');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('ALL');
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // 2. Sort & Pagination States
  const [sortColumn, setSortColumn] = useState<SortColumn>('changePercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // 3. Universe symbols extraction
  const allSymbols = useMemo(() => MARKET_UNIVERSE.map((item) => item.symbol), []);
  const { quotes: rtQuotes, flashes } = useRealTimeWatchlist(allSymbols, 'scanner');

  // Sectors list
  const sectorsList = useMemo(() => {
    const set = new Set<string>();
    MARKET_UNIVERSE.forEach((item) => {
      if (item.sector) set.add(item.sector);
    });
    return Array.from(set).sort();
  }, []);

  // 4. Filtering Logic
  const filteredItems = useMemo(() => {
    return MARKET_UNIVERSE.filter((item) => {
      // Preset Filter
      if (activePreset === 'watchlist') {
        if (!watchlistSymbols.includes(item.symbol)) return false;
      } else if (activePreset !== 'all') {
        if (!item.presetTags.includes(activePreset)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSym = item.symbol.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        if (!matchesSym && !matchesName) return false;
      }

      // Asset Type
      if (assetType !== 'ALL' && item.type !== assetType) return false;

      // Sector Filter
      if (selectedSector !== 'ALL' && item.sector !== selectedSector) return false;

      const rtQuote = rtQuotes[item.symbol];
      const changePct = rtQuote && isFiniteMarketNumber(rtQuote.changePercent) ? rtQuote.changePercent : null;
      const vol = rtQuote && isFiniteMarketNumber(rtQuote.volume) ? rtQuote.volume : null;

      // Direction Filter
      if (directionFilter === 'GAINERS') {
        if (changePct === null || changePct <= 0) return false;
      } else if (directionFilter === 'LOSERS') {
        if (changePct === null || changePct >= 0) return false;
      } else if (directionFilter === 'FLAT') {
        if (changePct === null || Math.abs(changePct) > 0.05) return false;
      }

      // Volume Filter
      if (volumeFilter === 'HIGH' && (vol === null || vol < 10000000)) return false;
      if (volumeFilter === 'EXTREME' && (vol === null || vol < 50000000)) return false;

      return true;
    });
  }, [
    activePreset,
    searchTerm,
    assetType,
    selectedSector,
    directionFilter,
    volumeFilter,
    rtQuotes,
    watchlistSymbols,
  ]);

  // 5. Sorting Logic
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const qA = rtQuotes[a.symbol];
      const qB = rtQuotes[b.symbol];

      let valA: any = null;
      let valB: any = null;

      if (sortColumn === 'symbol') {
        valA = a.symbol;
        valB = b.symbol;
      } else if (sortColumn === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortColumn === 'price') {
        valA = qA && isFiniteMarketNumber(qA.price) ? qA.price : -Infinity;
        valB = qB && isFiniteMarketNumber(qB.price) ? qB.price : -Infinity;
      } else if (sortColumn === 'changePercent') {
        valA = qA && isFiniteMarketNumber(qA.changePercent) ? qA.changePercent : -Infinity;
        valB = qB && isFiniteMarketNumber(qB.changePercent) ? qB.changePercent : -Infinity;
      } else if (sortColumn === 'volume') {
        valA = qA && isFiniteMarketNumber(qA.volume) ? qA.volume : -Infinity;
        valB = qB && isFiniteMarketNumber(qB.volume) ? qB.volume : -Infinity;
      } else if (sortColumn === 'relativeVolume') {
        valA = qA && isFiniteMarketNumber(qA.relativeVolume) ? qA.relativeVolume : -Infinity;
        valB = qB && isFiniteMarketNumber(qB.relativeVolume) ? qB.relativeVolume : -Infinity;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
  }, [filteredItems, rtQuotes, sortColumn, sortDirection]);

  // 6. Pagination Calculations
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + pageSize);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActivePreset('all');
    setAssetType('ALL');
    setDirectionFilter('ALL');
    setVolumeFilter('ALL');
    setSelectedSector('ALL');
    setCurrentPage(1);
  };

  const presetsList: { id: PresetFilter; label: string }[] = [
    { id: 'all', label: 'All Universe' },
    { id: 'sp500', label: 'S&P 500' },
    { id: 'nasdaq100', label: 'Nasdaq 100' },
    { id: 'dow30', label: 'Dow 30' },
    { id: 'sector_etf', label: 'Sector ETFs' },
    { id: 'top_movers', label: 'Top Movers' },
    { id: 'most_active', label: 'Most Active' },
    { id: 'watchlist', label: 'My Watchlist' },
  ];

  return (
    <div className={`space-y-4 select-none ${className}`}>
      {/* 1. Header & Quick Scanner Metrics Banner */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4 md:p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-black font-mono tracking-wide text-white flex items-center gap-2">
              <PieChart className="w-6 h-6 text-[#D4AF37]" />
              MARKET SCANNER & UNIVERSE
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-[#151515] border border-[#D4AF37]/40 text-[#F2D675] font-mono font-bold rounded">
              5,000+ ASSET UNIVERSE
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] font-mono mt-1">
            Real-time multi-asset market screener • Institutionally routed quotes & multi-factor filters
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-[#101010] border border-[#242424] px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
            </span>
            <span className="text-white font-bold">{totalItems}</span>
            <span className="text-[#9CA3AF]">Matching Assets</span>
          </div>
        </div>
      </div>

      {/* 2. Preset Tabs & Search Control Bar */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-3.5 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar max-w-full">
            {presetsList.map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setActivePreset(preset.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition border cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37]/20 text-[#F2D675] border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                      : 'bg-[#101010] hover:bg-[#151515] text-[#9CA3AF] hover:text-white border-[#242424]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Search Box & Advanced Filters Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol or company..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#101010] border border-[#242424] focus:border-[#D4AF37] text-xs text-white placeholder-[#6B7280] pl-9 pr-3 py-1.5 rounded-lg font-mono outline-none transition"
              />
            </div>

            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isFilterPanelOpen
                  ? 'bg-[#D4AF37]/20 text-[#F2D675] border-[#D4AF37]'
                  : 'bg-[#101010] hover:bg-[#151515] text-[#9CA3AF] hover:text-white border-[#242424]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {isFilterPanelOpen && (
          <div className="pt-3 border-t border-[#1C1C1C] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono animate-in fade-in duration-200">
            {/* Asset Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#9CA3AF] uppercase">Asset Class</label>
              <select
                value={assetType}
                onChange={(e) => {
                  setAssetType(e.target.value as AssetTypeFilter);
                  setCurrentPage(1);
                }}
                className="bg-[#101010] border border-[#242424] text-white p-1.5 rounded-lg font-mono text-xs focus:outline-none"
              >
                <option value="ALL">All Asset Types</option>
                <option value="STOCK">Equities (Stocks)</option>
                <option value="ETF">ETFs & Funds</option>
              </select>
            </div>

            {/* Performance Direction */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#9CA3AF] uppercase">Performance</label>
              <select
                value={directionFilter}
                onChange={(e) => {
                  setDirectionFilter(e.target.value as DirectionFilter);
                  setCurrentPage(1);
                }}
                className="bg-[#101010] border border-[#242424] text-white p-1.5 rounded-lg font-mono text-xs focus:outline-none"
              >
                <option value="ALL">All Moves</option>
                <option value="GAINERS">Gainers (+)</option>
                <option value="LOSERS">Losers (-)</option>
                <option value="FLAT">Flat (&plusmn;0.05%)</option>
              </select>
            </div>

            {/* Volume Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#9CA3AF] uppercase">Volume Level</label>
              <select
                value={volumeFilter}
                onChange={(e) => {
                  setVolumeFilter(e.target.value as VolumeFilter);
                  setCurrentPage(1);
                }}
                className="bg-[#101010] border border-[#242424] text-white p-1.5 rounded-lg font-mono text-xs focus:outline-none"
              >
                <option value="ALL">All Volumes</option>
                <option value="HIGH">High Vol (&gt;10M)</option>
                <option value="EXTREME">Extreme Vol (&gt;50M)</option>
              </select>
            </div>

            {/* Sector Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#9CA3AF] uppercase">Sector</label>
              <select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#101010] border border-[#242424] text-white p-1.5 rounded-lg font-mono text-xs focus:outline-none"
              >
                <option value="ALL">All Sectors</option>
                {sectorsList.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Scanner Data Table Container */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-[#101010] border-b border-[#242424] text-[10px] text-[#9CA3AF] uppercase tracking-wider">
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Symbol</span>
                    {sortColumn === 'symbol' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-[#D4AF37]" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-[#D4AF37]" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition min-w-[160px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Name / Sector</span>
                    {sortColumn === 'name' && (
                      <ArrowUp className="w-3 h-3 text-[#D4AF37]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    {sortColumn === 'price' && (
                      <ArrowDown className="w-3 h-3 text-[#D4AF37]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('changePercent')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Change</span>
                    {sortColumn === 'changePercent' && (
                      <ArrowDown className="w-3 h-3 text-[#D4AF37]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('volume')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Volume</span>
                    {sortColumn === 'volume' && (
                      <ArrowDown className="w-3 h-3 text-[#D4AF37]" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('relativeVolume')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition hidden md:table-cell"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Rel Vol</span>
                    {sortColumn === 'relativeVolume' && (
                      <ArrowDown className="w-3 h-3 text-[#D4AF37]" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-right hidden lg:table-cell">Day Range</th>
                <th className="py-3 px-4 text-center hidden xl:table-cell">Source Feed</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1C1C1C]">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9CA3AF] font-mono">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="w-8 h-8 text-amber-400 opacity-60" />
                      <span className="text-sm font-bold text-white">No Matching Assets Found</span>
                      <span className="text-xs text-[#6B7280]">
                        Try relaxing your search or filter parameters.
                      </span>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 bg-[#151515] hover:bg-[#1E1E1E] border border-[#242424] text-xs text-[#F2D675] font-bold rounded-lg transition"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const rtQuote = rtQuotes[item.symbol];
                  const flash = flashes[item.symbol];

                  const hasValidPrice = rtQuote && isFiniteMarketNumber(rtQuote.price) && rtQuote.price > 0;
                  const hasValidChangePct = rtQuote && isFiniteMarketNumber(rtQuote.changePercent);
                  const hasValidVol = rtQuote && isFiniteMarketNumber(rtQuote.volume);
                  const hasValidRelVol = rtQuote && isFiniteMarketNumber(rtQuote.relativeVolume);
                  const hasValidHigh = rtQuote && isFiniteMarketNumber(rtQuote.dayHigh);
                  const hasValidLow = rtQuote && isFiniteMarketNumber(rtQuote.dayLow);

                  const price = hasValidPrice ? rtQuote.price : null;
                  const changePct = hasValidChangePct ? rtQuote.changePercent : null;
                  const change = rtQuote && isFiniteMarketNumber(rtQuote.change) ? rtQuote.change : null;
                  const isPos = changePct !== null ? changePct >= 0 : true;

                  const sourceLabel = rtQuote?.metadata?.source || rtQuote?.dataSource || 'Alpaca IEX';
                  const isRealtime = rtQuote?.metadata?.mode === 'REAL_TIME' || rtQuote?.dataStatus === 'REAL_TIME';

                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => onSelectTicker(item.symbol as TickerSymbol)}
                      className={`hover:bg-[#121212] transition-colors duration-200 cursor-pointer ${
                        flash === 'UP'
                          ? 'bg-emerald-950/30'
                          : flash === 'DOWN'
                          ? 'bg-rose-950/30'
                          : ''
                      }`}
                    >
                      {/* Symbol & Type Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm tracking-wider font-mono">
                            {item.symbol}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                              item.type === 'ETF'
                                ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30'
                                : 'bg-[#151515] text-[#9CA3AF] border border-[#242424]'
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>
                      </td>

                      {/* Name & Sector */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col min-w-[140px]">
                          <span className="text-xs text-white font-medium truncate max-w-[200px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-[#6B7280] font-mono">{item.sector}</span>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-black text-white text-sm">
                        {hasValidPrice ? `$${price!.toFixed(2)}` : 'Unavailable'}
                      </td>

                      {/* % Change */}
                      <td className="py-3 px-4 text-right font-bold">
                        {hasValidChangePct ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                              isPos
                                ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                                : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                            }`}
                          >
                            {isPos ? '+' : ''}
                            {changePct!.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-[#6B7280]">Unavailable</span>
                        )}
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 text-right text-xs text-[#E5E5E5]">
                        {hasValidVol ? formatVolume(rtQuote.volume, 'Unavailable') : 'Unavailable'}
                      </td>

                      {/* Relative Volume */}
                      <td className="py-3 px-4 text-right text-xs text-[#D4AF37] hidden md:table-cell font-bold">
                        {hasValidRelVol ? `${rtQuote.relativeVolume.toFixed(2)}x` : 'Unavailable'}
                      </td>

                      {/* Day Range */}
                      <td className="py-3 px-4 text-right text-[11px] text-[#9CA3AF] hidden lg:table-cell">
                        {hasValidLow && hasValidHigh ? (
                          <span>
                            ${rtQuote.dayLow.toFixed(2)} - ${rtQuote.dayHigh.toFixed(2)}
                          </span>
                        ) : (
                          <span>Unavailable</span>
                        )}
                      </td>

                      {/* Data Source Label */}
                      <td className="py-3 px-4 text-center hidden xl:table-cell">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#121212] border border-[#242424] text-[10px] text-[#9CA3AF] rounded font-mono">
                          <Radio className="w-2.5 h-2.5 text-[#22C55E]" />
                          {sourceLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination & Page Size Footer */}
        <div className="bg-[#101010] border-t border-[#242424] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#151515] border border-[#242424] text-white rounded px-2 py-1 font-mono focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-white font-bold ml-2">
              Showing {totalItems > 0 ? startIndex + 1 : 0} -{' '}
              {Math.min(startIndex + pageSize, totalItems)} of {totalItems} assets
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#151515] hover:bg-[#1E1E1E] border border-[#242424] text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-[#151515] border border-[#242424] text-white font-bold rounded-lg">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#151515] hover:bg-[#1E1E1E] border border-[#242424] text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
