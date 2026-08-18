import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Calculator,
  ShoppingCart,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Flame,
  Scale,
  Calendar,
  Layers,
  Search,
  Bell,
  Sparkles,
  BookOpen,
  Briefcase,
  Sliders,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  OptionContract,
  OptionChainData,
  ExpirationMeta,
  UnusualOptionFlow,
  OptionsOrderRequest,
  OptionsOrderResult,
  OptionsPositionSummary,
} from '../../types/optionsTrader';
import { MarketMindOptionsDataProvider } from '../../services/options/optionsDataProvider';
import { OptionsChainTable } from './OptionsChainTable';
import { OptionsContractAnalyzerModal } from './OptionsContractAnalyzerModal';
import { OptionsPLSimulator } from './OptionsPLSimulator';
import { OptionsStrategyBuilder } from './OptionsStrategyBuilder';
import { OptionsOrderTicketModal } from './OptionsOrderTicketModal';
import { ZeroDteRiskModal } from './ZeroDteRiskModal';
import { OptionsJournalView } from './OptionsJournalView';
import { OptionsAlertsModal } from './OptionsAlertsModal';

const dataProvider = new MarketMindOptionsDataProvider();

const POPULAR_TICKERS = ['SPY', 'NVDA', 'QQQ', 'TSLA', 'AAPL', 'MSFT', 'AMZN'];

export const OptionsTraderView: React.FC = () => {
  const [selectedTicker, setSelectedTicker] = useState<string>('SPY');
  const [tickerInput, setTickerInput] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<
    'CHAIN' | 'STRATEGY' | 'SIMULATOR' | 'FLOW' | 'PORTFOLIO' | 'PAPER_JOURNAL'
  >('CHAIN');

  // Expiration selection
  const [expirations, setExpirations] = useState<ExpirationMeta[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string>('');

  // Chain Data
  const [chainData, setChainData] = useState<OptionChainData | null>(null);
  const [isLoadingChain, setIsLoadingChain] = useState<boolean>(true);

  // Unusual Flow Data
  const [unusualFlow, setUnusualFlow] = useState<UnusualOptionFlow[]>([]);
  const [flowSentimentFilter, setFlowSentimentFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH'>('ALL');

  // Selected Contract for deep operations
  const [selectedContract, setSelectedContract] = useState<OptionContract | null>(null);

  // Modals state
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState<boolean>(false);
  const [is0DteWarningOpen, setIs0DteWarningOpen] = useState<boolean>(false);
  const [isOrderTicketOpen, setIsOrderTicketOpen] = useState<boolean>(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [pendingOrderRequest, setPendingOrderRequest] = useState<Partial<OptionsOrderRequest> | null>(null);

  // Load Expiration dates when ticker changes
  useEffect(() => {
    let isMounted = true;
    dataProvider.getExpirations(selectedTicker).then((dates) => {
      if (isMounted) {
        setExpirations(dates);
        if (dates.length > 0) {
          setSelectedExpiration(dates[0].date);
        }
      }
    });

    dataProvider.getUnusualOptionsFlow(selectedTicker).then((flow) => {
      if (isMounted) {
        setUnusualFlow(flow);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTicker]);

  // Load Chain Data when Expiration changes
  useEffect(() => {
    if (!selectedExpiration) return;

    let isMounted = true;
    setIsLoadingChain(true);

    dataProvider
      .getOptionChain(selectedTicker, selectedExpiration)
      .then((chain) => {
        if (isMounted) {
          setChainData(chain);
          // Set default selected contract (ATM call)
          const callList = Array.isArray(chain.calls) ? chain.calls : Object.values(chain.calls);
          const atmCall = callList.find((c) => c.atTheMoney) || callList[Math.floor(callList.length / 2)];
          setSelectedContract(atmCall || null);
          setIsLoadingChain(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching chain data', err);
        if (isMounted) setIsLoadingChain(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTicker, selectedExpiration]);

  const handleTickerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      setSelectedTicker(tickerInput.trim().toUpperCase());
      setTickerInput('');
    }
  };

  const handleAnalyzeContract = (contract: OptionContract) => {
    setSelectedContract(contract);
    setIsAnalyzerOpen(true);
  };

  const handleSimulateContract = (contract: OptionContract) => {
    setSelectedContract(contract);
    setActiveSubTab('SIMULATOR');
  };

  const handleTradeContract = (contract: OptionContract) => {
    setSelectedContract(contract);
    if (contract.dte === 0) {
      setIs0DteWarningOpen(true);
    } else {
      setPendingOrderRequest(null);
      setIsOrderTicketOpen(true);
    }
  };

  const handleAcknowledge0DTE = () => {
    setIs0DteWarningOpen(false);
    setPendingOrderRequest(null);
    setIsOrderTicketOpen(true);
  };

  const handleOpenOrderTicketFromStrategy = (req: Partial<OptionsOrderRequest>) => {
    setPendingOrderRequest(req);
    setIsOrderTicketOpen(true);
  };

  const filteredFlow = useMemo(() => {
    if (flowSentimentFilter === 'ALL') return unusualFlow;
    return unusualFlow.filter((f) => f.sentiment === flowSentimentFilter);
  }, [unusualFlow, flowSentimentFilter]);

  const spotPrice = chainData?.underlyingPrice || (chainData as any)?.spotPrice || 552.40;
  const expectedMove =
    (chainData as any)?.expectedMoveDollar ||
    chainData?.expectedMoves?.oneDay ||
    chainData?.expectedMoves?.oneWeek ||
    3.8;

  return (
    <div className="min-h-screen bg-[#070707] text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Bar with Symbol Search, Live Quote & KPI Strip */}
      <div className="bg-[#0D0D0D] border border-[#222] rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Ticker Display */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-amber-500/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#D4AF37]">
                  MarketMind Options Trader™
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#181818] text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE OPRA STREAM
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 mt-0.5">
                <span>{selectedTicker}</span>
                <span className="text-[#D4AF37] font-mono">${spotPrice.toFixed(2)}</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  +1.42 (+0.26%)
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Tickers & Search Input */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-[#262626]">
              {POPULAR_TICKERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTicker(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                    selectedTicker === t
                      ? 'bg-[#D4AF37] text-black shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#1E1E1E]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleTickerSearch} className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter Symbol..."
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  className="w-28 sm:w-36 h-8 pl-8 pr-2.5 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </form>

            <button
              onClick={() => setIsAlertsModalOpen(true)}
              className="p-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#2A2A2A] text-[#D4AF37] transition-colors"
              title="Options Alerts Desk"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Derivatives Intelligence Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#1C1C1C]">
          <div className="p-2.5 bg-[#121212] rounded-xl border border-[#222]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Implied Volatility (IV)
            </div>
            <div className="text-sm font-black font-mono text-white mt-0.5">
              {chainData?.overallIV ? `${chainData.overallIV}%` : '18.4%'}
            </div>
            <div className="text-[8px] text-emerald-400">Moderate Vol Regime</div>
          </div>

          <div className="p-2.5 bg-[#121212] rounded-xl border border-[#222]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              IV Rank & Percentile
            </div>
            <div className="text-sm font-black font-mono text-[#D4AF37] mt-0.5">
              {chainData?.ivRank || 48}% <span className="text-[10px] text-slate-400">({chainData?.ivPercentile || 52}%)</span>
            </div>
            <div className="text-[8px] text-slate-400">30-Day Range</div>
          </div>

          <div className="p-2.5 bg-[#121212] rounded-xl border border-[#222]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Expected Move (Next Exp)
            </div>
            <div className="text-sm font-black font-mono text-amber-300 mt-0.5">
              &plusmn;${expectedMove.toFixed(2)}
            </div>
            <div className="text-[8px] text-slate-400 font-mono">
              ${(spotPrice - expectedMove).toFixed(1)} - ${(spotPrice + expectedMove).toFixed(1)}
            </div>
          </div>

          <div className="p-2.5 bg-[#121212] rounded-xl border border-[#222]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Put / Call Ratio
            </div>
            <div className="text-sm font-black font-mono text-white mt-0.5">
              {chainData?.putCallRatio.toFixed(2) || '0.78'}
            </div>
            <div className="text-[8px] text-emerald-400 font-bold">Bullish Flow Bias</div>
          </div>

          <div className="p-2.5 bg-[#121212] rounded-xl border border-[#222]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              24h Options Volume
            </div>
            <div className="text-sm font-black font-mono text-white mt-0.5">
              {chainData?.totalVolume.toLocaleString() || '1,428,500'}
            </div>
            <div className="text-[8px] text-slate-400">
              OI: {chainData?.totalOpenInterest.toLocaleString() || '3,890,200'}
            </div>
          </div>

          <div className="p-2.5 bg-[#121212] rounded-xl border border-[#222]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Risk Guardian™</span>
              <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-amber-500/20 text-amber-300">
                MODERATE
              </span>
            </div>
            <div className="text-sm font-black font-mono text-white mt-0.5">
              64 <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[8px] text-slate-400">Normal Market Profile</div>
          </div>
        </div>

        {/* Expiration Dates Strip */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Expiration Date Cycles</span>
            <span className="text-slate-500 text-[9px]">Select expiration cycle to update chain</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {expirations.map((exp) => {
              const isSelected = selectedExpiration === exp.date;
              return (
                <button
                  key={exp.date}
                  onClick={() => setSelectedExpiration(exp.date)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#D4AF37] to-amber-400 text-black shadow-md shadow-[#D4AF37]/25'
                      : 'bg-[#141414] hover:bg-[#1E1E1E] text-slate-300 border border-[#262626]'
                  }`}
                >
                  <span>{exp.formattedDate}</span>
                  {exp.is0DTE && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] font-sans font-bold ${
                        isSelected
                          ? 'bg-black text-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      0DTE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0D0D0D] border border-[#222] rounded-2xl">
        <button
          onClick={() => setActiveSubTab('CHAIN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'CHAIN'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Options Chain
        </button>

        <button
          onClick={() => setActiveSubTab('STRATEGY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'STRATEGY'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Strategy Builder & AI Assistant
        </button>

        <button
          onClick={() => setActiveSubTab('SIMULATOR')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'SIMULATOR'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          P/L Simulator & Payoff Chart
        </button>

        <button
          onClick={() => setActiveSubTab('FLOW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'FLOW'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Activity className="w-4 h-4" />
          Unusual Options Flow
        </button>

        <button
          onClick={() => setActiveSubTab('PAPER_JOURNAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'PAPER_JOURNAL'
              ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Paper Trader & AI Journal
        </button>
      </div>

      {/* 3. Tab Body Views */}
      {activeSubTab === 'CHAIN' && (
        <>
          {isLoadingChain || !chainData ? (
            <div className="flex flex-col items-center justify-center py-24 bg-[#0D0D0D] rounded-2xl border border-[#222] gap-3">
              <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-400">
                Loading real-time Black-Scholes Greeks and options chains for {selectedTicker}...
              </span>
            </div>
          ) : (
            <OptionsChainTable
              chainData={chainData}
              onSelectContract={(c) => setSelectedContract(c)}
              onAnalyzeContract={handleAnalyzeContract}
              onSimulateContract={handleSimulateContract}
              onTradeContract={handleTradeContract}
            />
          )}
        </>
      )}

      {activeSubTab === 'STRATEGY' && (
        <OptionsStrategyBuilder
          underlying={selectedTicker}
          spotPrice={spotPrice}
          selectedExpiration={selectedExpiration}
          onOpenOrderTicket={handleOpenOrderTicketFromStrategy}
          onOpenSimulatorForContract={handleSimulateContract}
        />
      )}

      {activeSubTab === 'SIMULATOR' && (
        <>
          {selectedContract ? (
            <OptionsPLSimulator
              contract={selectedContract}
              spotPrice={spotPrice}
              onOpenOrderTicket={handleTradeContract}
              onOpenStrategyBuilder={() => setActiveSubTab('STRATEGY')}
            />
          ) : (
            <div className="p-12 text-center bg-[#0D0D0D] rounded-2xl border border-[#222] text-slate-400 text-xs">
              Select a contract from the Options Chain first to launch the interactive P/L Simulator.
            </div>
          )}
        </>
      )}

      {activeSubTab === 'FLOW' && (
        <div className="bg-[#0D0D0D] border border-[#242424] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Institutional Unusual Options Flow & Sweeps
              </h3>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[#141414] rounded-lg border border-[#262626] text-xs">
              <button
                onClick={() => setFlowSentimentFilter('ALL')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  flowSentimentFilter === 'ALL'
                    ? 'bg-[#D4AF37] text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setFlowSentimentFilter('BULLISH')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  flowSentimentFilter === 'BULLISH'
                    ? 'bg-emerald-500 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bullish Only
              </button>
              <button
                onClick={() => setFlowSentimentFilter('BEARISH')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  flowSentimentFilter === 'BEARISH'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bearish Only
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#0A0A0A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] text-[10px] uppercase font-bold text-slate-400 border-b border-[#222]">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Contract</th>
                  <th className="py-2.5 px-3">Order Type</th>
                  <th className="py-2.5 px-3">Premium ($)</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Fill Price</th>
                  <th className="py-2.5 px-3">Sentiment</th>
                  <th className="py-2.5 px-3">Vol / OI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181818] font-mono text-xs">
                {filteredFlow.map((flow) => {
                  const isBull = flow.sentiment === 'BULLISH';
                  return (
                    <tr key={flow.id} className="hover:bg-[#141414] transition-colors">
                      <td className="py-2.5 px-3 text-slate-400">{flow.timestamp}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{flow.symbol}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-bold text-white">{flow.expiration}</span>{' '}
                        <span className="text-[#D4AF37] font-bold">${flow.strike}</span>{' '}
                        <span className={flow.type === 'CALL' ? 'text-emerald-400' : 'text-rose-400'}>
                          {flow.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C1C1C] text-slate-300 border border-[#333]">
                          {flow.orderType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        ${flow.premium.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{flow.volume.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-slate-300">${flow.price.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                            isBull
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {flow.sentiment}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#D4AF37] font-bold">
                        {(flow.volume / Math.max(1, flow.openInterest)).toFixed(2)}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'PAPER_JOURNAL' && <OptionsJournalView />}

      {/* Modals Suite */}
      {selectedContract && (
        <OptionsContractAnalyzerModal
          contract={selectedContract}
          spotPrice={spotPrice}
          isOpen={isAnalyzerOpen}
          onClose={() => setIsAnalyzerOpen(false)}
          onOpenSimulator={handleSimulateContract}
          onOpenStrategyBuilder={() => setActiveSubTab('STRATEGY')}
          onOpenOrderTicket={handleTradeContract}
        />
      )}

      {selectedContract && (
        <ZeroDteRiskModal
          contract={selectedContract}
          isOpen={is0DteWarningOpen}
          onClose={() => setIs0DteWarningOpen(false)}
          onAcknowledge={handleAcknowledge0DTE}
        />
      )}

      <OptionsOrderTicketModal
        contract={selectedContract || undefined}
        initialOrderRequest={pendingOrderRequest || undefined}
        isOpen={isOrderTicketOpen}
        onClose={() => setIsOrderTicketOpen(false)}
        onOrderCompleted={(res) => {
          console.log('Order submitted successfully:', res);
        }}
      />

      <OptionsAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        defaultSymbol={selectedTicker}
      />
    </div>
  );
};
