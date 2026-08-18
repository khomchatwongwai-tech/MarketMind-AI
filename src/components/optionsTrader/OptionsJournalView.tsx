import React, { useState } from 'react';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RotateCcw,
  Scale,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import {
  OptionsPaperAccount,
  OptionsJournalEntry,
  OptionsPositionSummary,
} from '../../types/optionsTrader';
import { optionsPaperTradingService } from '../../services/options/optionsPaperTradingService';

interface OptionsJournalViewProps {
  onOpenOrderTicketForPosition?: (pos: OptionsPositionSummary) => void;
}

export const OptionsJournalView: React.FC<OptionsJournalViewProps> = ({
  onOpenOrderTicketForPosition,
}) => {
  const [account, setAccount] = useState<OptionsPaperAccount>(() =>
    optionsPaperTradingService.getAccount()
  );
  const [filterTicker, setFilterTicker] = useState<string>('ALL');

  const refreshAccount = () => {
    setAccount(optionsPaperTradingService.getAccount());
  };

  const handleReset = () => {
    if (window.confirm('Reset virtual paper trading balance back to $100,000 and clear history?')) {
      const reset = optionsPaperTradingService.resetAccount(100000);
      setAccount(reset);
    }
  };

  const handleClosePosition = (pos: OptionsPositionSummary) => {
    const orderReq = {
      orderId: `ord-close-${Date.now()}`,
      idempotencyKey: `idem-close-${Date.now()}`,
      brokerId: 'paper',
      underlyingSymbol: pos.underlying,
      strategyName: `Close ${pos.strategyName || pos.symbol}`,
      legs: [
        {
          contractSymbol: pos.symbol,
          underlyingSymbol: pos.underlying,
          type: pos.type,
          strike: pos.strike,
          expiration: pos.expiration,
          action: 'SELL_TO_CLOSE' as const,
          quantity: pos.quantity,
          currentMid: pos.currentPrice,
        },
      ],
      orderType: 'LIMIT' as const,
      limitPrice: pos.currentPrice,
      timeInForce: 'DAY' as const,
      estimatedCost: pos.marketValue,
      userConfirmed: true,
      confirmedTimestamp: new Date().toISOString(),
      isPaper: true,
    };

    optionsPaperTradingService.submitPaperOrder(orderReq);
    refreshAccount();
  };

  const totalTrades = account.winCount + account.lossCount;
  const winRate = totalTrades > 0 ? Number(((account.winCount / totalTrades) * 100).toFixed(1)) : 0;

  const filteredJournal = account.journalEntries.filter((j) => {
    if (filterTicker !== 'ALL' && j.underlying !== filterTicker) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Account Performance Summary Banner */}
      <div className="bg-[#0F0F0F] border border-[#262626] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                MarketMind Paper Trading & AI Journal™
              </div>
              <h2 className="text-xl font-black text-white">Virtual Account Performance</h2>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to $100k
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Equity</div>
            <div className="text-lg font-black font-mono text-white mt-0.5">
              ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[9px] text-slate-400">Virtual Portfolio</div>
          </div>

          <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <div className="text-[10px] font-bold uppercase text-slate-400">Buying Power</div>
            <div className="text-lg font-black font-mono text-[#D4AF37] mt-0.5">
              ${account.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[9px] text-slate-400">Available Cash</div>
          </div>

          <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <div className="text-[10px] font-bold uppercase text-slate-400">Realized P/L</div>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                account.totalRealizedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {account.totalRealizedPL >= 0 ? '+' : ''}${account.totalRealizedPL.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-400">{account.winCount}W &bull; {account.lossCount}L</div>
          </div>

          <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <div className="text-[10px] font-bold uppercase text-slate-400">Unrealized P/L</div>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                account.totalUnrealizedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {account.totalUnrealizedPL >= 0 ? '+' : ''}${account.totalUnrealizedPL.toFixed(2)}
            </div>
            <div className="text-[9px] text-slate-400">{account.positions.length} Open Positions</div>
          </div>

          <div className="p-3 bg-[#141414] rounded-xl border border-[#262626]">
            <div className="text-[10px] font-bold uppercase text-slate-400">Win Rate</div>
            <div className="text-lg font-black font-mono text-[#D4AF37] mt-0.5">
              {winRate}%
            </div>
            <div className="text-[9px] text-slate-400">{totalTrades} Total Closed</div>
          </div>
        </div>
      </div>

      {/* Open Paper Positions */}
      <div className="bg-[#0F0F0F] border border-[#262626] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            Active Open Paper Positions ({account.positions.length})
          </div>
          <span className="text-[10px] text-slate-400">Auto-calculated live Greeks & P/L</span>
        </div>

        {account.positions.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-xl border border-[#222] text-xs text-slate-400">
            No active open paper options positions. Open an order from the Options Chain to test strategies risk-free.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#0A0A0A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-[10px] uppercase font-bold text-slate-400 border-b border-[#222]">
                <tr>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Avg Entry</th>
                  <th className="py-2.5 px-3">Current Mid</th>
                  <th className="py-2.5 px-3">Market Value</th>
                  <th className="py-2.5 px-3">Unrealized P/L</th>
                  <th className="py-2.5 px-3">Greeks (&Delta; / &Theta;)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181818] font-mono text-xs">
                {account.positions.map((pos) => {
                  const isProfit = pos.unrealizedPLDollar >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-[#141414] transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{pos.underlying}</span>
                          <span className="text-[#D4AF37]">${pos.strike}</span>
                          <span className={pos.type === 'CALL' ? 'text-emerald-400' : 'text-rose-400'}>
                            {pos.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {pos.expiration} ({pos.dte} DTE)
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-white font-bold">{pos.quantity}x</td>
                      <td className="py-2.5 px-3 text-slate-300">${pos.avgEntryPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-white font-bold">${pos.currentPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-white">${pos.marketValue.toFixed(2)}</td>
                      <td className={`py-2.5 px-3 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${pos.unrealizedPLDollar.toFixed(2)} ({isProfit ? '+' : ''}
                        {pos.unrealizedPLPercent.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        &Delta; {pos.delta.toFixed(2)} &bull; &Theta; {pos.theta.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => handleClosePosition(pos)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
                        >
                          Close Position
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Trade Journal */}
      <div className="bg-[#0F0F0F] border border-[#262626] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            AI Trade Log & Journal Records ({filteredJournal.length})
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Filter Symbol:</span>
            <select
              value={filterTicker}
              onChange={(e) => setFilterTicker(e.target.value)}
              className="px-2.5 py-1 bg-[#161616] border border-[#2E2E2E] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="ALL">All Tickers</option>
              <option value="SPY">SPY</option>
              <option value="QQQ">QQQ</option>
              <option value="NVDA">NVDA</option>
              <option value="TSLA">TSLA</option>
            </select>
          </div>
        </div>

        {filteredJournal.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] rounded-xl border border-[#222] text-xs text-slate-400">
            No closed trade journal records match the selected criteria.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJournal.map((entry) => {
              const isWin = entry.status === 'CLOSED_WIN';

              return (
                <div
                  key={entry.id}
                  className="p-4 bg-[#141414] rounded-xl border border-[#242424] space-y-2.5 hover:border-[#333] transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isWin ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </span>
                      <span className="text-sm font-bold text-white">{entry.contract}</span>
                      <span className="text-xs text-slate-400 font-mono">({entry.strategy})</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-slate-400">
                        Entry: ${entry.entryPrice.toFixed(2)} &rarr; Exit: ${entry.exitPrice.toFixed(2)}
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          entry.pnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {entry.pnlDollar >= 0 ? '+' : ''}${entry.pnlDollar.toFixed(2)} (
                        {entry.pnlDollar >= 0 ? '+' : ''}{entry.pnlPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Trade Thesis & Greeks */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="sm:col-span-2 p-2.5 bg-[#181818] rounded-lg border border-[#2A2A2A] text-slate-300">
                      <strong className="text-slate-400 uppercase text-[9px] block mb-0.5">
                        Trade Thesis & Reflection
                      </strong>
                      {entry.thesis}
                    </div>

                    <div className="p-2.5 bg-[#181818] rounded-lg border border-[#2A2A2A] text-[10px] text-slate-400 space-y-0.5 font-mono">
                      <div>
                        Score: <strong className="text-[#D4AF37]">{entry.marketMindScore}/100</strong>
                      </div>
                      <div>
                        IV at Entry: <strong>{(entry.ivAtEntry * 100).toFixed(1)}%</strong>
                      </div>
                      <div>
                        Entry Greeks: &Delta; {entry.greeksAtEntry.delta.toFixed(2)} &bull; &Theta;{' '}
                        {entry.greeksAtEntry.theta.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Logged: {entry.timestamp}</span>
                    <span>{entry.notes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
