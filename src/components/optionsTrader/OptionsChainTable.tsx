import React, { useState, useMemo } from 'react';
import {
  Brain,
  Calculator,
  ShoppingCart,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { OptionChainData, OptionContract } from '../../types/optionsTrader';

interface OptionsChainTableProps {
  chainData: OptionChainData;
  onSelectContract: (contract: OptionContract) => void;
  onAnalyzeContract: (contract: OptionContract) => void;
  onSimulateContract: (contract: OptionContract) => void;
  onTradeContract: (contract: OptionContract) => void;
}

export const OptionsChainTable: React.FC<OptionsChainTableProps> = ({
  chainData,
  onSelectContract,
  onAnalyzeContract,
  onSimulateContract,
  onTradeContract,
}) => {
  const [tabType, setTabType] = useState<'ALL' | 'CALLS' | 'PUTS'>('ALL');
  const [strikeRange, setStrikeRange] = useState<number>(10); // ATM +/- N strikes

  const spotPrice = chainData.underlyingPrice || (chainData as any).spotPrice || 500;

  const rawCalls: OptionContract[] = useMemo(() => {
    if (Array.isArray(chainData.calls)) return chainData.calls;
    if (chainData.calls && typeof chainData.calls === 'object') return Object.values(chainData.calls);
    return [];
  }, [chainData.calls]);

  const rawPuts: OptionContract[] = useMemo(() => {
    if (Array.isArray(chainData.puts)) return chainData.puts;
    if (chainData.puts && typeof chainData.puts === 'object') return Object.values(chainData.puts);
    return [];
  }, [chainData.puts]);

  // Filter strikes based on range
  const visibleCalls = useMemo(() => {
    const sorted = [...rawCalls].sort((a, b) => a.strike - b.strike);
    if (strikeRange === 0) return sorted;
    // Find closest to spot
    const atmIndex = sorted.findIndex((c) => c.strike >= spotPrice);
    const start = Math.max(0, atmIndex - strikeRange);
    const end = Math.min(sorted.length, atmIndex + strikeRange + 1);
    return sorted.slice(start, end);
  }, [rawCalls, spotPrice, strikeRange]);

  const visiblePuts = useMemo(() => {
    const sorted = [...rawPuts].sort((a, b) => a.strike - b.strike);
    if (strikeRange === 0) return sorted;
    const atmIndex = sorted.findIndex((c) => c.strike >= spotPrice);
    const start = Math.max(0, atmIndex - strikeRange);
    const end = Math.min(sorted.length, atmIndex + strikeRange + 1);
    return sorted.slice(start, end);
  }, [rawPuts, spotPrice, strikeRange]);

  return (
    <div className="space-y-4">
      {/* Chain Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0F0F0F] rounded-xl border border-[#222]">
        {/* Calls / Puts Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#161616] rounded-lg border border-[#2A2A2A]">
          <button
            onClick={() => setTabType('ALL')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              tabType === 'ALL'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Split View (Both)
          </button>
          <button
            onClick={() => setTabType('CALLS')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              tabType === 'CALLS'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calls Only
          </button>
          <button
            onClick={() => setTabType('PUTS')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              tabType === 'PUTS'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Puts Only
          </button>
        </div>

        {/* Strike Range Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="font-semibold text-slate-400">Strikes:</span>
          <select
            value={strikeRange}
            onChange={(e) => setStrikeRange(parseInt(e.target.value, 10))}
            className="px-2.5 py-1 bg-[#161616] border border-[#2E2E2E] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
          >
            <option value={5}>ATM &plusmn; 5 Strikes</option>
            <option value={10}>ATM &plusmn; 10 Strikes</option>
            <option value={15}>ATM &plusmn; 15 Strikes</option>
            <option value={0}>All Strikes</option>
          </select>
        </div>
      </div>

      {/* Options Chain Tables */}
      <div className="space-y-4">
        {/* CALLS TABLE */}
        {(tabType === 'ALL' || tabType === 'CALLS') && (
          <div className="bg-[#0D0D0D] border border-[#242424] rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-emerald-950/30 to-[#141414] px-4 py-2.5 border-b border-[#242424] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Call Options Chain ({chainData.expiration} &bull; {chainData.dte} DTE)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Underlying: ${spotPrice.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-[10px] uppercase font-bold text-slate-400 border-b border-[#222]">
                  <tr>
                    <th className="py-2.5 px-3">Strike</th>
                    <th className="py-2.5 px-3">Bid</th>
                    <th className="py-2.5 px-3">Ask</th>
                    <th className="py-2.5 px-3">Mid</th>
                    <th className="py-2.5 px-3">IV</th>
                    <th className="py-2.5 px-3">Delta</th>
                    <th className="py-2.5 px-3">Theta</th>
                    <th className="py-2.5 px-3">Volume</th>
                    <th className="py-2.5 px-3">Open Int.</th>
                    <th className="py-2.5 px-3">Breakeven</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181818] font-mono text-xs">
                  {visibleCalls.map((contract) => {
                    const isITM = contract.inTheMoney;
                    const isATM = contract.atTheMoney;

                    return (
                      <tr
                        key={contract.symbol}
                        onClick={() => onSelectContract(contract)}
                        className={`hover:bg-[#181818] cursor-pointer transition-colors ${
                          isATM
                            ? 'bg-[#D4AF37]/10 font-bold'
                            : isITM
                            ? 'bg-emerald-950/15'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-1.5 font-bold text-white">
                          <span className="text-sm text-[#D4AF37]">${contract.strike}</span>
                          {isATM && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 uppercase">
                              ATM
                            </span>
                          )}
                          {isITM && !isATM && (
                            <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-500/20 text-emerald-300">
                              ITM
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-300">${contract.bid.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">${contract.ask.toFixed(2)}</td>
                        <td className="py-2 px-3 font-bold text-white">${contract.mid.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">{(contract.iv * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">
                          {contract.delta.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-rose-400">{contract.theta.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">{contract.volume.toLocaleString()}</td>
                        <td className="py-2 px-3 text-slate-400">
                          {contract.openInterest.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-[#D4AF37]">${contract.breakeven.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAnalyzeContract(contract);
                              }}
                              title="Options Intelligence Analysis"
                              className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#D4AF37] border border-[#333] transition-colors"
                            >
                              <Brain className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSimulateContract(contract);
                              }}
                              title="P/L Simulator"
                              className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sky-400 border border-[#333] transition-colors"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTradeContract(contract);
                              }}
                              title="Trade Order Ticket"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-amber-300 text-black font-bold text-[10px] transition-all"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Trade
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
        )}

        {/* PUTS TABLE */}
        {(tabType === 'ALL' || tabType === 'PUTS') && (
          <div className="bg-[#0D0D0D] border border-[#242424] rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-rose-950/30 to-[#141414] px-4 py-2.5 border-b border-[#242424] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Put Options Chain ({chainData.expiration} &bull; {chainData.dte} DTE)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Underlying: ${spotPrice.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-[10px] uppercase font-bold text-slate-400 border-b border-[#222]">
                  <tr>
                    <th className="py-2.5 px-3">Strike</th>
                    <th className="py-2.5 px-3">Bid</th>
                    <th className="py-2.5 px-3">Ask</th>
                    <th className="py-2.5 px-3">Mid</th>
                    <th className="py-2.5 px-3">IV</th>
                    <th className="py-2.5 px-3">Delta</th>
                    <th className="py-2.5 px-3">Theta</th>
                    <th className="py-2.5 px-3">Volume</th>
                    <th className="py-2.5 px-3">Open Int.</th>
                    <th className="py-2.5 px-3">Breakeven</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181818] font-mono text-xs">
                  {visiblePuts.map((contract) => {
                    const isITM = contract.inTheMoney;
                    const isATM = contract.atTheMoney;

                    return (
                      <tr
                        key={contract.symbol}
                        onClick={() => onSelectContract(contract)}
                        className={`hover:bg-[#181818] cursor-pointer transition-colors ${
                          isATM
                            ? 'bg-[#D4AF37]/10 font-bold'
                            : isITM
                            ? 'bg-rose-950/15'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-1.5 font-bold text-white">
                          <span className="text-sm text-[#D4AF37]">${contract.strike}</span>
                          {isATM && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 uppercase">
                              ATM
                            </span>
                          )}
                          {isITM && !isATM && (
                            <span className="px-1 py-0.2 rounded text-[8px] bg-rose-500/20 text-rose-300">
                              ITM
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-300">${contract.bid.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">${contract.ask.toFixed(2)}</td>
                        <td className="py-2 px-3 font-bold text-white">${contract.mid.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">{(contract.iv * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-rose-400 font-bold">
                          {contract.delta.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-rose-400">{contract.theta.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">{contract.volume.toLocaleString()}</td>
                        <td className="py-2 px-3 text-slate-400">
                          {contract.openInterest.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-[#D4AF37]">${contract.breakeven.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAnalyzeContract(contract);
                              }}
                              title="Options Intelligence Analysis"
                              className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#D4AF37] border border-[#333] transition-colors"
                            >
                              <Brain className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSimulateContract(contract);
                              }}
                              title="P/L Simulator"
                              className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sky-400 border border-[#333] transition-colors"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTradeContract(contract);
                              }}
                              title="Trade Order Ticket"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37] hover:bg-amber-300 text-black font-bold text-[10px] transition-all"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Trade
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
        )}
      </div>
    </div>
  );
};
