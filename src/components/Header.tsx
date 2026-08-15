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
  Crown,
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
  onOpenUniversalSearch?: () => void;
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
  onOpenUniversalSearch,
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
      const timer = setTimeout(() => setPriceFlash(null), 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(timer);
    } else if (quote.price < prevPriceRef.current) {
      setPriceFlash('down');
      const timer = setTimeout(() => setPriceFlash(null), 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(timer);
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
    <header className="flex flex-col bg-[#0A0A0A] border border-[#242424] rounded-xl p-3.5 mb-2.5 gap-3.5 select-none text-[#E5E5E5] shadow-2xl">
      {/* Top Row: Brand, Search, Data Source, User Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C1C1C] pb-3">
        {/* Left: Minimal Luxury Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Geometric Gold Logo Emblem */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8C6B18] via-[#D4AF37] to-[#FFE08A] p-[1px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[#0A0A0A] rounded-[7px] flex items-center justify-center">
                <span className="gold-gradient-text font-black text-xs tracking-tighter">M</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-black text-white tracking-wider">MARKETMIND</span>
                <span className="gold-gradient-text text-sm font-black tracking-widest">AI</span>
              </div>
              <span className="text-[8.5px] text-[#9CA3AF] tracking-widest font-mono uppercase mt-0.5">
                Institutional Quant Terminal
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[#242424] hidden sm:block" />

          {/* Real-time Data Source Selector */}
          <div className="flex items-center bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg px-2.5 py-1 text-xs transition">
            <Radio className="w-3 h-3 text-[#22C55E] mr-1.5 animate-pulse" />
            <select
              value={dataSource}
              onChange={(e) => onChangeDataSource(e.target.value as LiveMarketDataSource)}
              className="bg-transparent text-[#E5E5E5] font-mono text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Massive WebSocket (Real-Time Live Feed)" className="bg-[#101010] text-[#E5E5E5]">
                ⚡ Massive WebSocket (Live Stream)
              </option>
              <option value="Yahoo Finance (Real-Time)" className="bg-[#101010] text-[#E5E5E5]">
                📈 Yahoo Finance (Real-Time)
              </option>
              <option value="Google Finance Feed" className="bg-[#101010] text-[#E5E5E5]">
                🌐 Google Finance Gateway
              </option>
              <option value="Robinhood Multi-Feed" className="bg-[#101010] text-[#E5E5E5]">
                📱 Multi-Exchange Stream
              </option>
            </select>
          </div>

          {/* Refresh Rate Selector */}
          <div className="hidden sm:flex items-center bg-[#101010] border border-[#242424] rounded-lg px-2 py-1 text-[11px] text-[#9CA3AF] font-mono">
            <Clock className="w-3 h-3 text-[#D4AF37] mr-1.5" />
            <span>Tick:</span>
            <select
              value={tickSpeed}
              onChange={(e) => onChangeTickSpeed(Number(e.target.value))}
              className="bg-transparent text-[#F2D675] font-bold ml-1 focus:outline-none cursor-pointer"
            >
              <option value={1000} className="bg-[#101010]">1s Ultra</option>
              <option value={3000} className="bg-[#101010]">3s Pro</option>
              <option value={5000} className="bg-[#101010]">5s Std</option>
              <option value={10000} className="bg-[#101010]">10s Eco</option>
            </select>
          </div>
        </div>

        {/* Right: Universal Search & Account Controls */}
        <div className="flex items-center gap-2">
          {onOpenUniversalSearch && (
            <button
              onClick={onOpenUniversalSearch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14161d] hover:bg-[#1a1d26] border border-[#2d313d] hover:border-[#D4AF37]/50 text-xs font-mono text-slate-300 transition shadow-sm"
              title="Open Universal Multi-Asset Search Modal (Press /)"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden xl:inline text-[11px] font-semibold text-slate-200">Cross-Asset Directory</span>
              <kbd className="hidden sm:inline px-1 py-0.2 bg-[#0c0d11] text-[10px] text-[#D4AF37] border border-[#282c37] rounded font-mono">
                /
              </kbd>
            </button>
          )}

          <div className="relative flex items-center">
            <form onSubmit={handleCustomSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search stocks, ETFs, options..."
                value={searchInput}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-[#101010] hover:bg-[#151515] focus:bg-[#101010] border border-[#242424] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-xs text-white pl-8 pr-16 py-1.5 rounded-lg w-52 md:w-64 font-mono transition focus:outline-none placeholder-[#9CA3AF]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-[#151515] hover:bg-[#242424] border border-[#242424] hover:border-[#D4AF37] text-[10px] font-mono font-bold text-[#F2D675] rounded transition"
              >
                ENTER
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#101010] border border-[#242424] rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-2.5 py-1 text-[10px] text-[#9CA3AF] font-mono bg-[#0A0A0A] border-b border-[#1C1C1C]">
                  MATCHING MARKET SYMBOLS
                </div>
                {searchResults.map((res) => (
                  <button
                    key={res.symbol}
                    onClick={() => handleSelectSymbol(res.symbol)}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#151515] flex items-center justify-between text-xs transition border-b border-[#1C1C1C] last:border-0"
                  >
                    <span className="font-mono font-bold text-[#D4AF37]">{res.symbol}</span>
                    <span className="text-[11px] text-[#9CA3AF] truncate max-w-[180px]">{res.name}</span>
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
            className="p-1.5 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 text-[#9CA3AF] hover:text-white rounded-lg transition"
            title="Terminal Interactive Tour"
          >
            <Compass className="w-4 h-4 text-[#D4AF37]" />
          </button>

          {/* Subscription / Plan Badge */}
          <button
            onClick={onOpenSubscription}
            className="px-3 py-1.5 gold-gradient-btn rounded-lg flex items-center gap-1.5 text-xs shadow-md transition"
            title="Manage Subscription & Entitlements"
          >
            <Crown className="w-3.5 h-3.5 text-[#050505]" />
            <span className="hidden sm:inline text-[#050505] font-extrabold uppercase tracking-wide text-[11px]">
              {currentUser.planTier === 'Free' ? 'Upgrade Plan' : `${currentUser.planTier}`}
            </span>
          </button>

          {/* Account Profile Button */}
          <button
            onClick={currentUser.isGuest ? onOpenAuth : onOpenSettings}
            className="px-2.5 py-1.5 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 rounded-lg flex items-center gap-1.5 text-xs text-[#E5E5E5] transition"
            title={currentUser.isGuest ? 'Sign in to Account' : 'Account Profile & Preferences'}
          >
            <User className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden md:inline font-semibold text-[11px] max-w-[100px] truncate">
              {currentUser.isGuest ? 'Sign In' : currentUser.name.split(' ')[0]}
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 text-[#9CA3AF] hover:text-white rounded-lg transition"
            title="Terminal Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Quote & Quantitative Probabilities Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Left: Active Ticker Symbol, Real-Time Price & Session Stats */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <select
                value={selectedTicker}
                onChange={(e) => onSelectTicker(e.target.value as TickerSymbol)}
                className="bg-[#101010] text-2xl md:text-3xl font-black text-white px-2 py-0.5 rounded-lg border border-[#242424] hover:border-[#D4AF37] focus:outline-none cursor-pointer tracking-tight"
              >
                {PRESET_TICKERS.map((t) => (
                  <option key={t} value={t} className="bg-[#101010] text-white">
                    {t}
                  </option>
                ))}
                {!PRESET_TICKERS.includes(selectedTicker) && (
                  <option value={selectedTicker} className="bg-[#101010] text-white">{selectedTicker}</option>
                )}
              </select>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white truncate max-w-[200px]">
                  {quote.name}
                </span>
                <span className="text-[10px] text-[#9CA3AF] font-mono">
                  {quote.exchange || 'US Market'} • <span className="text-[#D4AF37]">{quote.dataSource || 'Live Feed'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-10 w-[1px] bg-[#242424]" />

          {/* Real-Time Price with Flashing Tick */}
          <div className="flex flex-col">
            <div
              className={`text-2xl md:text-3xl font-black font-mono tracking-tight transition-colors duration-300 ${
                priceFlash === 'up'
                  ? 'text-[#22C55E] bg-[#22C55E]/10 px-1 rounded'
                  : priceFlash === 'down'
                  ? 'text-[#EF4444] bg-[#EF4444]/10 px-1 rounded'
                  : isPositive
                  ? 'text-[#22C55E]'
                  : 'text-[#EF4444]'
              }`}
            >
              ${quote.price.toFixed(2)}
            </div>
            <div
              className={`text-xs font-bold font-mono flex items-center gap-1 ${
                isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}
              {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
              {quote.changePercent.toFixed(2)}%)
            </div>
          </div>

          <div className="hidden lg:block h-10 w-[1px] bg-[#242424]" />

          {/* Session Metrics Bar */}
          <div className="hidden xl:grid grid-cols-3 gap-x-4 gap-y-0.5 text-[10px] text-[#9CA3AF] uppercase tracking-wider pl-2 border-l border-[#242424]">
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
              Rel Vol: <span className="text-[#D4AF37] font-mono font-semibold">{quote.relativeVolume}x</span>
            </div>
            <div>
              Latency: <span className="text-[#F2D675] font-mono font-semibold">{quote.latencyMs ?? 35}ms</span>
            </div>
          </div>
        </div>

        {/* Right: Quant Bias, Probabilities Bar & Action Controls */}
        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end">
          {/* Signal Badge & Confidence */}
          <div className="flex flex-col items-end">
            <div
              className={`px-3 py-1 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                bias === 'BULLISH'
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/40'
                  : bias === 'BEARISH'
                  ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40'
                  : 'bg-[#A3A3A3]/10 text-[#A3A3A3] border-[#A3A3A3]/40'
              }`}
            >
              {bias === 'BULLISH' && <TrendingUp className="w-4 h-4" />}
              {bias === 'BEARISH' && <TrendingDown className="w-4 h-4" />}
              {bias === 'NEUTRAL' && <Minus className="w-4 h-4" />}
              {bias} BIAS
            </div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5 uppercase tracking-wider">
              AI Confidence: <span className="font-bold text-[#F2D675] font-mono">{probabilities.aiConfidence}/100</span>
            </div>
          </div>

          {/* Probabilities Multi-Bar */}
          <div className="flex flex-col bg-[#101010] rounded-lg p-2 min-w-[170px] border border-[#242424]">
            <div className="flex justify-between text-[10px] mb-1 font-mono font-bold">
              <span className="text-[#22C55E]">BULL: {probabilities.bullish}%</span>
              <span className="text-[#A3A3A3]">NEUT: {probabilities.neutral}%</span>
              <span className="text-[#EF4444]">BEAR: {probabilities.bearish}%</span>
            </div>
            <div className="h-2 w-full bg-[#1C1C1C] rounded-full overflow-hidden flex">
              <div
                className="bg-[#22C55E] h-full transition-all duration-500"
                style={{ width: `${probabilities.bullish}%` }}
                title={`Bullish: ${probabilities.bullish}%`}
              />
              <div
                className="bg-[#A3A3A3] h-full transition-all duration-500"
                style={{ width: `${probabilities.neutral}%` }}
                title={`Neutral: ${probabilities.neutral}%`}
              />
              <div
                className="bg-[#EF4444] h-full transition-all duration-500"
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
                className="px-3 py-1.5 gold-gradient-btn text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#050505]" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            )}

            <button
              onClick={() => onOpenReport('morning')}
              title="Generate Morning Intelligence Report"
              className="px-2.5 py-1.5 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 text-xs font-semibold rounded-lg flex items-center gap-1 text-[#E5E5E5] hover:text-white transition"
            >
              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Morning Report</span>
            </button>

            <button
              onClick={onOpenAlerts}
              className="relative p-2 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 rounded-lg text-[#9CA3AF] hover:text-white transition"
              title="Real-time Market Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white font-bold text-[9px] rounded-full flex items-center justify-center shadow-sm">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={onToggleLive}
              className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                isLive
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/40 hover:bg-[#22C55E]/20'
                  : 'bg-[#101010] text-[#9CA3AF] border-[#242424] hover:bg-[#151515]'
              }`}
              title={isLive ? `Live Market Movement Stream Active (${tickSpeed / 1000}s)` : 'Stream Paused'}
            >
              {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onManualRefresh}
              className="p-2 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 rounded-lg text-[#9CA3AF] hover:text-white transition"
              title="Force Real-Time Sync from Yahoo Finance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-[#D4AF37]' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


