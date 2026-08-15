import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Bell,
  FileText,
  Play,
  Pause,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Zap,
  Globe,
  Radio,
  Clock,
  Layers,
  User,
  Settings,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { MarketQuote, Probabilities, TickerSymbol, LiveMarketDataSource } from '../types/market';
import { UserProfile } from '../types/user';
import { searchMarketSymbols } from '../services/marketDataService';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  quote: MarketQuote;
  probabilities: Probabilities;
  selectedTicker: TickerSymbol;
  onSelectTicker: (ticker: TickerSymbol) => void;
  isLive: boolean;
  onToggleLive: () => void;
  onManualRefresh: () => void;
  unreadAlertCount: number;
  onOpenReport: (type: 'morning' | 'eod') => void;
  onOpenAlerts: () => void;
  onOpenChat?: () => void;
  dataSource: LiveMarketDataSource;
  onChangeDataSource: (source: LiveMarketDataSource) => void;
  tickSpeed: number;
  onChangeTickSpeed: (speed: number) => void;
  isLoadingLive?: boolean;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
  onOpenSettings: () => void;
  onOpenTour: () => void;
}

const PRESET_TICKERS: TickerSymbol[] = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN', 'META', 'AMD', 'IWM', 'COIN', 'PLTR'];

export const Header: React.FC<HeaderProps> = ({
  quote,
  probabilities,
  selectedTicker,
  onSelectTicker,
  isLive,
  onToggleLive,
  onManualRefresh,
  unreadAlertCount,
  onOpenReport,
  onOpenAlerts,
  onOpenChat,
  dataSource,
  onChangeDataSource,
  tickSpeed,
  onChangeTickSpeed,
  isLoadingLive = false,
  currentUser,
  onOpenAuth,
  onOpenSubscription,
  onOpenSettings,
  onOpenTour,
}) => {
  const { t } = useI18n();
  const [searchInput, setSearchInput] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string }>>([]);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(quote.price);

  // Price flash animation trigger on real-time price change
  useEffect(() => {
    if (quote.price > prevPriceRef.current) {
      setPriceFlash('up');
      const t = setTimeout(() => setPriceFlash(null), 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(t);
    } else if (quote.price < prevPriceRef.current) {
      setPriceFlash('down');
      const t = setTimeout(() => setPriceFlash(null), 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(t);
    }
  }, [quote.price]);

  // Live search debounce
  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchMarketSymbols(searchInput.trim());
      setSearchResults(results.slice(0, 6));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSelectSymbol = (sym: string) => {
    onSelectTicker(sym.toUpperCase() as TickerSymbol);
    setSearchInput('');
    setIsSearchOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectTicker(searchInput.trim().toUpperCase() as TickerSymbol);
      setSearchInput('');
      setIsSearchOpen(false);
    }
  };

  const isPositive = quote.change >= 0;
  const bias =
    probabilities.bullish >= probabilities.bearish && probabilities.bullish >= probabilities.neutral
      ? 'BULLISH'
      : probabilities.bearish >= probabilities.bullish && probabilities.bearish >= probabilities.neutral
      ? 'BEARISH'
      : 'NEUTRAL';

  return (
    <header className="flex flex-col bg-[#15171a] border border-[#2d3139] rounded-lg p-3 mb-2 gap-3 select-none text-[#e2e8f0]">
      {/* Top Row: Brand, Symbol Search, Live Provider Select & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23272f] pb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-[#6366f1] tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#818cf8]" />
              MarketMind AI
            </span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 rounded font-mono font-bold">
              QUANT ENGINE
            </span>
          </div>

          {/* Real-time Data Source Selector */}
          <div className="flex items-center bg-[#1c1f24] border border-[#2d3139] rounded px-2 py-1 text-xs">
            <Radio className="w-3 h-3 text-emerald-400 mr-1.5 animate-pulse" />
            <select
              value={dataSource}
              onChange={(e) => onChangeDataSource(e.target.value as LiveMarketDataSource)}
              className="bg-transparent text-slate-200 font-mono text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Massive WebSocket (Real-Time Live Feed)">🚀 Massive WebSocket (Live Stream)</option>
              <option value="Yahoo Finance (Real-Time)">⚡ Yahoo Finance (Live)</option>
              <option value="Google Finance Feed">🌐 Google Finance Feed</option>
              <option value="Robinhood Multi-Feed">📱 Robinhood Stream</option>
            </select>
          </div>

          {/* Refresh Rate Selector */}
          <div className="hidden sm:flex items-center bg-[#1c1f24] border border-[#2d3139] rounded px-2 py-1 text-[11px] text-slate-300 font-mono">
            <Clock className="w-3 h-3 text-slate-400 mr-1.5" />
            <span>Rate:</span>
            <select
              value={tickSpeed}
              onChange={(e) => onChangeTickSpeed(Number(e.target.value))}
              className="bg-transparent text-emerald-400 font-bold ml-1 focus:outline-none cursor-pointer"
            >
              <option value={1000}>1s Ultra</option>
              <option value={3000}>3s Fast</option>
              <option value={5000}>5s Normal</option>
              <option value={10000}>10s</option>
            </select>
          </div>
        </div>

        {/* Live Search & Symbol Search Bar and User Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <form onSubmit={handleCustomSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticker (e.g. NVDA, TSLA, PLTR)..."
                value={searchInput}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-[#1c1f24] hover:bg-[#23272f] focus:bg-[#1c1f24] border border-[#2d3139] focus:border-[#6366f1] text-xs text-white pl-8 pr-16 py-1 rounded w-52 md:w-64 font-mono transition focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#6366f1]/20 hover:bg-[#6366f1]/40 border border-[#6366f1]/50 text-[10px] font-bold text-[#a5b4fc] rounded"
              >
                ENTER
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d22] border border-[#3b404d] rounded-md shadow-2xl z-50 overflow-hidden">
                <div className="px-2.5 py-1 text-[10px] text-slate-400 font-mono bg-[#14161a] border-b border-[#2b2f38]">
                  YAHOO / GOOGLE SYMBOLS MATCH
                </div>
                {searchResults.map((res) => (
                  <button
                    key={res.symbol}
                    onClick={() => handleSelectSymbol(res.symbol)}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#282d37] flex items-center justify-between text-xs transition border-b border-[#23272f] last:border-0"
                  >
                    <span className="font-mono font-bold text-emerald-400">{res.symbol}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px]">{res.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <LanguageSelector />

          {/* Quick Tour Button */}
          <button
            onClick={onOpenTour}
            className="p-1.5 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] text-slate-300 hover:text-white rounded transition"
            title="Terminal Interactive Tour"
          >
            <Compass className="w-3.5 h-3.5 text-[#818cf8]" />
          </button>

          {/* Upgrade Plan Button */}
          <button
            onClick={onOpenSubscription}
            className="px-2.5 py-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white text-[11px] font-bold rounded flex items-center gap-1 shadow-sm transition"
            title="View Subscription Plans"
          >
            <CreditCard className="w-3 h-3 text-amber-300" />
            <span className="hidden sm:inline">
              {currentUser.planTier === 'Free' ? 'Upgrade' : `${currentUser.planTier}`}
            </span>
          </button>

          {/* Account Settings / User Button */}
          <button
            onClick={currentUser.isGuest ? onOpenAuth : onOpenSettings}
            className="px-2.5 py-1 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] hover:border-slate-500 rounded flex items-center gap-1.5 text-xs text-slate-200 transition"
            title={currentUser.isGuest ? 'Sign in to Account' : 'Account Settings'}
          >
            <User className="w-3.5 h-3.5 text-[#818cf8]" />
            <span className="hidden md:inline font-semibold text-[11px] max-w-[100px] truncate">
              {currentUser.isGuest ? 'Sign In' : currentUser.name.split(' ')[0]}
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] text-slate-300 hover:text-white rounded transition"
            title="Terminal Settings & API Keys"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Quote & Probabilities Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Left: Current Active Ticker, Price & Stats */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <select
                value={selectedTicker}
                onChange={(e) => onSelectTicker(e.target.value as TickerSymbol)}
                className="bg-[#1c1f24] text-2xl md:text-3xl font-black text-white px-2 py-0.5 rounded border border-[#2d3139] hover:border-[#6366f1] focus:outline-none cursor-pointer"
              >
                {PRESET_TICKERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                {!PRESET_TICKERS.includes(selectedTicker) && (
                  <option value={selectedTicker}>{selectedTicker}</option>
                )}
              </select>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
                  {quote.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {quote.exchange || 'US Market'} • {quote.dataSource || 'Live Feed'}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-10 w-[1px] bg-[#2d3139]" />

          {/* Real-Time Price with Flashing Tick */}
          <div className="flex flex-col">
            <div
              className={`text-2xl md:text-3xl font-black font-mono tracking-tight transition-colors duration-300 ${
                priceFlash === 'up'
                  ? 'text-emerald-300 bg-emerald-950/60 px-1 rounded'
                  : priceFlash === 'down'
                  ? 'text-rose-300 bg-rose-950/60 px-1 rounded'
                  : isPositive
                  ? 'text-[#10b981]'
                  : 'text-[#f43f5e]'
              }`}
            >
              ${quote.price.toFixed(2)}
            </div>
            <div
              className={`text-xs font-bold font-mono flex items-center gap-1 ${
                isPositive ? 'text-[#10b981]' : 'text-[#f43f5e]'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}
              {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
              {quote.changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="hidden lg:block h-10 w-[1px] bg-[#2d3139]" />

          {/* Session Stats */}
          <div className="hidden xl:grid grid-cols-3 gap-x-4 gap-y-0.5 text-[10px] text-slate-400 uppercase tracking-wider pl-2 border-l border-[#2d3139]">
            <div>
              Day High: <span className="text-white font-mono font-semibold">${quote.dayHigh.toFixed(2)}</span>
            </div>
            <div>
              Day Low: <span className="text-white font-mono font-semibold">${quote.dayLow.toFixed(2)}</span>
            </div>
            <div>
              Prev Close: <span className="text-white font-mono font-semibold">${quote.previousClose.toFixed(2)}</span>
            </div>
            <div>
              Vol:{' '}
              <span className="text-white font-mono font-semibold">
                {quote.volume > 1000000 ? `${(quote.volume / 1000000).toFixed(1)}M` : quote.volume.toLocaleString()}
              </span>
            </div>
            <div>
              Rel Vol: <span className="text-emerald-400 font-mono font-semibold">{quote.relativeVolume}x</span>
            </div>
            <div>
              Latency: <span className="text-amber-400 font-mono font-semibold">{quote.latencyMs ?? 35}ms</span>
            </div>
          </div>
        </div>

        {/* Right: Quant Bias, Probability Bar & Controls */}
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
          {/* Signal Badge & Confidence */}
          <div className="flex flex-col items-end">
            <div
              className={`px-3 py-1 rounded text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                bias === 'BULLISH'
                  ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                  : bias === 'BEARISH'
                  ? 'bg-[#f43f5e]/15 text-[#f43f5e] border-[#f43f5e]/40'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
              }`}
            >
              {bias === 'BULLISH' && <TrendingUp className="w-4 h-4" />}
              {bias === 'BEARISH' && <TrendingDown className="w-4 h-4" />}
              {bias === 'NEUTRAL' && <Minus className="w-4 h-4" />}
              {bias} BIAS
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
              AI Confidence: <span className="font-bold text-white font-mono">{probabilities.aiConfidence}/100</span>
            </div>
          </div>

          {/* Probabilities Multi-Bar */}
          <div className="flex flex-col bg-[#1c1f24] rounded-lg p-2 min-w-[170px] border border-[#2d3139]">
            <div className="flex justify-between text-[10px] mb-1 font-mono font-bold">
              <span className="text-emerald-400">BULL: {probabilities.bullish}%</span>
              <span className="text-slate-400">NEUT: {probabilities.neutral}%</span>
              <span className="text-rose-400">BEAR: {probabilities.bearish}%</span>
            </div>
            <div className="h-2 w-full bg-[#2d3139] rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${probabilities.bullish}%` }}
                title={`Bullish: ${probabilities.bullish}%`}
              />
              <div
                className="bg-slate-500 h-full transition-all duration-500"
                style={{ width: `${probabilities.neutral}%` }}
                title={`Neutral: ${probabilities.neutral}%`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${probabilities.bearish}%` }}
                title={`Bearish: ${probabilities.bearish}%`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                title="Ask MarketMind AI Assistant"
                className="px-2.5 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            )}

            <button
              onClick={() => onOpenReport('morning')}
              title="Generate Morning Intelligence Report"
              className="px-2.5 py-1.5 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] text-xs font-semibold rounded flex items-center gap-1 text-slate-300 hover:text-white transition"
            >
              <FileText className="w-3.5 h-3.5 text-[#6366f1]" />
              <span className="hidden sm:inline">Morning Report</span>
            </button>

            <button
              onClick={onOpenAlerts}
              className="relative p-2 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] rounded text-slate-300 hover:text-white transition"
              title="Real-time Market Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={onToggleLive}
              className={`p-2 rounded border text-xs font-bold transition flex items-center gap-1 ${
                isLive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title={isLive ? `Live Market Movement Stream Active (${tickSpeed / 1000}s)` : 'Stream Paused'}
            >
              {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onManualRefresh}
              className="p-2 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] rounded text-slate-400 hover:text-white transition"
              title="Force Real-Time Sync from Yahoo Finance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-[#6366f1]' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

