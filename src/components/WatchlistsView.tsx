import React, { useState } from 'react';
import {
  ListPlus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { Watchlist } from '../types/user';
import { TickerSymbol } from '../types/market';
import { UserService } from '../services/userService';

import { InstrumentDirectoryService } from '../services/marketProviders/InstrumentDirectoryService';
import { DataProviderRouter } from '../services/marketProviders/DataProviderRouter';
import { useEffect, useCallback } from 'react';

interface WatchlistsViewProps {
  onSelectTicker: (ticker: TickerSymbol) => void;
  currentTicker: TickerSymbol;
}

interface LiveWatchlistSummary {
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: string;
  rsi: number | null;
  bias: string;
  status: 'LIVE' | 'DELAYED' | 'UNAVAILABLE' | 'LOADING';
}

export const WatchlistsView: React.FC<WatchlistsViewProps> = ({
  onSelectTicker,
  currentTicker,
}) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(UserService.getWatchlists());
  const [selectedListId, setSelectedListId] = useState<string>(watchlists[0]?.id || 'wl_main');
  const [newTickerInput, setNewTickerInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  const currentList = watchlists.find((l) => l.id === selectedListId) || watchlists[0];

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTickerInput.trim() || !currentList) return;
    const sym = newTickerInput.trim().toUpperCase() as TickerSymbol;
    UserService.addTickerToWatchlist(currentList.id, sym);
    setWatchlists(UserService.getWatchlists());
    setNewTickerInput('');
  };

  const handleRemoveTicker = (ticker: TickerSymbol) => {
    if (!currentList) return;
    UserService.removeTickerFromWatchlist(currentList.id, ticker);
    setWatchlists(UserService.getWatchlists());
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const created = UserService.createWatchlist(newListName.trim(), newListDesc.trim());
    const updated = UserService.getWatchlists();
    setWatchlists(updated);
    setSelectedListId(created.id);
    setNewListName('');
    setNewListDesc('');
    setShowCreateModal(false);
  };

  const handleDeleteList = (id: string) => {
    UserService.deleteWatchlist(id);
    const updated = UserService.getWatchlists();
    setWatchlists(updated);
    if (selectedListId === id && updated.length > 0) {
      setSelectedListId(updated[0].id);
    }
  };

  const [quotes, setQuotes] = useState<Record<string, LiveWatchlistSummary>>({});

  const fetchQuotesForList = useCallback(async (tickers: TickerSymbol[]) => {
    const updated: Record<string, LiveWatchlistSummary> = {};
    for (const sym of tickers) {
      const inst = InstrumentDirectoryService.getBySymbol(sym);
      const name = inst?.name || `${sym} Asset`;
      try {
        const quoteRes = await DataProviderRouter.getQuote(sym);
        if (quoteRes?.quote && quoteRes.quote.price !== null && quoteRes.quote.price !== undefined) {
          const q = quoteRes.quote;
          updated[sym] = {
            name,
            price: q.price,
            change: q.change ?? 0,
            changePercent: q.changePercent ?? 0,
            volume: q.volume ? `${(q.volume / 1000000).toFixed(1)}M` : (inst?.volume ? `${(inst.volume / 1000000).toFixed(1)}M` : 'N/A'),
            rsi: null,
            bias: (q.change ?? 0) >= 0 ? 'BULLISH' : 'BEARISH',
            status: 'LIVE',
          };
        } else if (inst && inst.price !== undefined && inst.price !== null) {
          updated[sym] = {
            name,
            price: inst.price,
            change: inst.change ?? null,
            changePercent: inst.changePercent ?? null,
            volume: inst.volume ? `${(inst.volume / 1000000).toFixed(1)}M` : 'N/A',
            rsi: null,
            bias: (inst.change ?? 0) >= 0 ? 'BULLISH' : 'BEARISH',
            status: inst.realTimeStatus === 'REAL_TIME' ? 'LIVE' : 'DELAYED',
          };
        } else {
          updated[sym] = {
            name,
            price: null,
            change: null,
            changePercent: null,
            volume: 'N/A',
            rsi: null,
            bias: 'NEUTRAL',
            status: 'UNAVAILABLE',
          };
        }
      } catch {
        updated[sym] = {
          name,
          price: inst?.price ?? null,
          change: inst?.change ?? null,
          changePercent: inst?.changePercent ?? null,
          volume: inst?.volume ? `${(inst.volume / 1000000).toFixed(1)}M` : 'N/A',
          rsi: null,
          bias: 'NEUTRAL',
          status: 'UNAVAILABLE',
        };
      }
    }
    setQuotes(updated);
  }, []);

  useEffect(() => {
    if (currentList?.tickers && currentList.tickers.length > 0) {
      fetchQuotesForList(currentList.tickers);
    }
  }, [currentList?.id, currentList?.tickers, fetchQuotesForList]);

  const exportCSV = () => {
    if (!currentList) return;
    const rows = [
      ['Ticker', 'Name', 'Price', 'Change', 'Change %', 'Volume', 'RSI', 'Bias', 'Status'],
      ...currentList.tickers.map((t) => {
        const d = quotes[t] || {
          name: InstrumentDirectoryService.getBySymbol(t)?.name || `${t} Asset`,
          price: null,
          change: null,
          changePercent: null,
          volume: 'N/A',
          rsi: null,
          bias: 'NEUTRAL',
          status: 'UNAVAILABLE',
        };
        return [
          t,
          d.name,
          d.price !== null ? `$${d.price.toFixed(2)}` : 'UNAVAILABLE',
          d.change !== null ? d.change.toFixed(2) : 'N/A',
          d.changePercent !== null ? `${d.changePercent.toFixed(2)}%` : 'N/A',
          d.volume,
          d.rsi !== null ? d.rsi.toFixed(1) : 'N/A',
          d.bias,
          d.status,
        ];
      }),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentList.name.replace(/\s+/g, '_')}_Watchlist.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3 select-none text-[#e2e8f0]">
      {/* Header & Watchlist Selector Bar */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
            <ListPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Multi-Asset Watchlist Engine</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-mono">
                REAL-TIME
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Track quantitative setups, VWAP distances &amp; relative volume spikes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Watchlists Tab Pills */}
          <div className="flex items-center bg-[#1c1f24] p-1 rounded-lg border border-[#2d3139] overflow-x-auto max-w-md">
            {watchlists.map((wl) => (
              <button
                key={wl.id}
                onClick={() => setSelectedListId(wl.id)}
                className={`px-3 py-1 rounded text-xs font-bold transition whitespace-nowrap ${
                  selectedListId === wl.id
                    ? 'bg-[#6366f1] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {wl.name} ({wl.tickers.length})
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-2.5 py-1.5 bg-[#252830] hover:bg-[#2e323d] text-white text-xs font-bold rounded-lg border border-[#2d3139] flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New List</span>
          </button>

          <button
            onClick={exportCSV}
            className="p-1.5 bg-[#252830] hover:bg-[#2e323d] text-slate-300 hover:text-white rounded-lg border border-[#2d3139] transition"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Ticker & List Controls */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-wrap justify-between items-center gap-3">
        <form onSubmit={handleAddTicker} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={newTickerInput}
              onChange={(e) => setNewTickerInput(e.target.value)}
              placeholder="Add Ticker (e.g. AMD, COIN)..."
              className="bg-[#1c1f24] border border-[#2d3139] focus:border-[#6366f1] text-xs text-white pl-8 pr-3 py-1.5 rounded-lg w-56 font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg transition"
          >
            Add Symbol
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{currentList?.description}</span>
          {watchlists.length > 1 && !currentList?.isDefault && (
            <button
              onClick={() => currentList && handleDeleteList(currentList.id)}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              Delete List
            </button>
          )}
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="bg-[#15171a] border border-[#2d3139] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1c1f24] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#2d3139]">
              <tr>
                <th className="p-3">Ticker / Asset</th>
                <th className="p-3">Real-Time Price</th>
                <th className="p-3">Day Change</th>
                <th className="p-3">Intraday Volume</th>
                <th className="p-3">RSI (14)</th>
                <th className="p-3">Quant Bias</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23272f]">
              {currentList?.tickers.map((sym) => {
                const inst = InstrumentDirectoryService.getBySymbol(sym);
                const data = quotes[sym] || {
                  name: inst?.name || `${sym} Asset`,
                  price: inst?.price ?? null,
                  change: inst?.change ?? null,
                  changePercent: inst?.changePercent ?? null,
                  volume: inst?.volume ? `${(inst.volume / 1000000).toFixed(1)}M` : 'N/A',
                  rsi: null,
                  bias: 'NEUTRAL',
                  status: 'LOADING' as const,
                };
                const hasPrice = data.price !== null && data.price !== undefined;
                const isPos = (data.change ?? 0) >= 0;
                const isSelected = currentTicker === sym;

                return (
                  <tr
                    key={sym}
                    className={`hover:bg-[#1c1f24]/70 transition-colors ${
                      isSelected ? 'bg-[#6366f1]/10' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black font-mono text-sm text-white">{sym}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {data.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] px-1 bg-[#6366f1]/30 text-[#a5b4fc] rounded font-mono font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 font-mono font-bold text-sm text-white">
                      {hasPrice ? `$${data.price!.toFixed(2)}` : (
                        <span className="text-slate-500 text-xs font-normal">
                          {data.status === 'LOADING' ? 'Loading...' : 'UNAVAILABLE'}
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono font-semibold">
                      {data.change !== null && data.changePercent !== null ? (
                        <div
                          className={`flex items-center gap-1 ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>
                            {isPos ? '+' : ''}
                            {data.change.toFixed(2)} ({isPos ? '+' : ''}
                            {data.changePercent.toFixed(2)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs font-normal">--</span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-slate-300">{data.volume}</td>

                    <td className="p-3">
                      {data.rsi !== null ? (
                        <span
                          className={`font-mono font-bold ${
                            data.rsi > 70
                              ? 'text-rose-400'
                              : data.rsi < 30
                              ? 'text-emerald-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {data.rsi.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">--</span>
                      )}
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          data.bias === 'BULLISH'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : data.bias === 'BEARISH'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {data.bias}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectTicker(sym)}
                          className="px-2.5 py-1 bg-[#6366f1]/20 hover:bg-[#6366f1] text-[#a5b4fc] hover:text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <span>Open in Terminal</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveTicker(sym)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                          title="Remove from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="bg-[#15171a] border border-[#2d3139] rounded-xl w-full max-w-sm p-4 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase">Create New Watchlist</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. High Volatility Tech"
                className="w-full bg-[#1c1f24] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="Short description..."
                className="w-full bg-[#1c1f24] border border-[#2d3139] rounded px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 bg-[#252830] text-slate-300 text-xs rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                className="px-3 py-1 bg-[#6366f1] text-white text-xs font-bold rounded"
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
