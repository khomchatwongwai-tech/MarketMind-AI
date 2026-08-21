import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Bell,
  FileText,
  Play,
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
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { MarketQuote, Probabilities, TickerSymbol } from '../types/market';
import { UserProfile } from '../types/user';
import { searchMarketSymbols } from '../services/marketDataService';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { AppConfig } from '../config/environment';
import { ActiveTab } from './Navigation';
import { isFiniteMarketNumber, formatPrice, formatPercent, formatVolume } from '../utils/formatters';

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
  onOpenReportIssue?: () => void;
  tickSpeed: number;
  onChangeTickSpeed: (speed: number) => void;
  isLoadingLive?: boolean;
  currentUser: UserProfile;
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
  onOpenSettings: () => void;
  onOpenTour: () => void;
  activeTab?: ActiveTab;
  onNavigateTab?: (tab: ActiveTab) => void;
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
  onOpenUniversalSearch,
  onOpenReportIssue,
  tickSpeed,
  onChangeTickSpeed,
  isLoadingLive = false,
  currentUser,
  onOpenAuth,
  onOpenSubscription,
  onOpenSettings,
  onOpenTour,
  activeTab = 'overview',
  onNavigateTab,
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

  const isPositive = isFiniteMarketNumber(quote.change) && quote.change >= 0;
  const hasProbabilities = [
    probabilities.bullish,
    probabilities.bearish,
    probabilities.neutral,
  ].every(isFiniteMarketNumber);
  const bias = !hasProbabilities
    ? 'UNAVAILABLE'
    : probabilities.bullish >= probabilities.bearish && probabilities.bullish >= probabilities.neutral
      ? 'BULLISH'
      : probabilities.bearish >= probabilities.bullish && probabilities.bearish >= probabilities.neutral
      ? 'BEARISH'
      : 'NEUTRAL';

  // Sub-tabs for stock context (matching mobile reference design)
  const subTabs: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'technicals', label: 'Chart' },
    { id: 'news', label: 'News' },
    { id: 'options', label: 'Options' },
    { id: 'breadth_intermarket', label: 'Flows' },
  ];

  return (
    <header className="flex flex-col bg-[#0A0A0A] border border-[#242424] rounded-xl p-3 md:p-3.5 mb-2.5 gap-3 md:gap-3.5 select-none text-[#E5E5E5] shadow-2xl">
      {/* PERSISTENT DEMO MODE BANNER (When Simulation / Demo Mode is Active) */}
      {AppConfig.isDemoMode && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-lg px-3 py-1.5 text-center text-amber-300 text-xs font-mono font-bold flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded">
              DEMO
            </span>
            <span># DEMO — SIMULATED MARKET DATA</span>
          </div>
          <span className="text-[11px] text-amber-200/80 font-normal">
            Sandbox mode active. Switch data source to Yahoo/Google for verified live quotes.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MOBILE TOP CONTROLS (md:hidden) */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:hidden gap-2.5">
        {/* Row 1: Brand Wordmark + Live Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8C6B18] via-[#D4AF37] to-[#FFE08A] p-[1px] shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-[#0A0A0A] rounded-[7px] flex items-center justify-center">
                <span className="gold-gradient-text font-black text-xs">M</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-xs font-black text-white tracking-wider">MARKETMIND</span>
                <span className="gold-gradient-text text-xs font-black tracking-widest">AI</span>
              </div>
              <span className="text-[7.5px] text-[#9CA3AF] tracking-widest font-mono uppercase mt-0.5">
                INSTITUTIONAL QUANT TERMINAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1 px-2 py-1 bg-[#101010] border border-[#242424] rounded-lg text-[10px] font-mono ${isLive ? 'text-[#22C55E]' : 'text-rose-400'}`}>
              <Radio className={`w-2.5 h-2.5 ${isLive ? 'animate-pulse' : ''}`} />
              <span>{isLive ? 'LIVE' : 'UNAVAILABLE'}</span>
            </div>
            <button
              onClick={onToggleLive}
              className={`p-1.5 rounded-lg border text-xs ${
                isLive
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40'
                  : 'bg-[#101010] text-[#9CA3AF] border-[#242424]'
              }`}
              title="Refresh live market data"
            >
              {isLive ? <RefreshCw className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={onManualRefresh}
              className="p-1.5 bg-[#101010] border border-[#242424] rounded-lg text-[#9CA3AF]"
              title="Manual Refresh"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingLive ? 'animate-spin text-[#D4AF37]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Row 2: Universal Search Bar */}
        <div className="flex items-center gap-2">
          {onOpenUniversalSearch && (
            <button
              onClick={onOpenUniversalSearch}
              className="p-2 rounded-lg bg-[#121212] border border-[#242424] text-[#D4AF37] hover:bg-[#181818]"
              title="Universal Search"
            >
              <Globe className="w-4 h-4" />
            </button>
          )}

          <div className="relative flex-1">
            <form onSubmit={handleCustomSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search stocks, ETFs, options..."
                value={searchInput}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[#101010] border border-[#242424] focus:border-[#D4AF37] text-xs text-white pl-8 pr-16 py-2 rounded-lg font-mono placeholder-[#6B7280] focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[#181818] border border-[#2D2D2D] text-[10px] font-mono font-bold text-[#F2D675] rounded"
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
                    className="w-full text-left px-3 py-2 hover:bg-[#151515] flex items-center justify-between text-xs transition border-b border-[#1C1C1C] last:border-0"
                  >
                    <span className="font-mono font-bold text-[#D4AF37]">{res.symbol}</span>
                    <span className="text-[11px] text-[#9CA3AF] truncate max-w-[180px]">{res.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Language Selector Row */}
        <LanguageSelector variant="mobile-row" />
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP TOP ROW (hidden on mobile, md:flex) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3 border-b border-[#1C1C1C] pb-3">
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

          {/* Server-selected verified provider */}
          <div className="flex items-center bg-[#101010] border border-[#242424] hover:border-[rgba(212,175,55,0.4)] rounded-lg px-2.5 py-1 text-xs transition">
            <Radio className={`w-3 h-3 mr-1.5 ${isLive ? 'text-[#22C55E] animate-pulse' : 'text-rose-400'}`} />
            <span className="text-[#E5E5E5] font-mono text-[11px] font-semibold">
              {quote.dataSource || 'Verified provider unavailable'}
            </span>
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

          {/* Day / Night Visual Theme Switcher */}
          <ThemeToggle variant="dropdown" />

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

          {/* Report Data Issue Feedback Button */}
          {onOpenReportIssue && (
            <button
              onClick={onOpenReportIssue}
              className="p-1.5 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-amber-500/50 text-[#9CA3AF] hover:text-amber-300 rounded-lg transition"
              title="Report Data / Quality Issue"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 text-[#9CA3AF] hover:text-white rounded-lg transition"
            title="Terminal Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUB-TABS BAR (Overview, Chart, News, Options, Flows) */}
      {/* ========================================================================= */}
      {onNavigateTab && (
        <div className="flex items-center gap-1 border-b border-[#1C1C1C] overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
          {subTabs.map((st) => {
            const isSubActive =
              activeTab === st.id ||
              (st.id === 'overview' && activeTab === 'overview') ||
              (st.id === 'technicals' && (activeTab === 'technicals' || activeTab === 'support_resistance'));
            return (
              <button
                key={st.id}
                onClick={() => onNavigateTab(st.id)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  isSubActive
                    ? 'text-[#F2D675] font-bold border-b-2 border-[#D4AF37] bg-[#121212]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN QUOTE & QUANT STATS ROW (Clean Responsive Layout) */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4">
        {/* Left: Active Ticker Symbol, Real-Time Price & Session Stats */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-start gap-3 md:gap-6">
          {/* Ticker & Name */}
          <div className="flex items-center gap-2">
            <select
              value={selectedTicker}
              onChange={(e) => onSelectTicker(e.target.value as TickerSymbol)}
              className="bg-[#101010] text-xl md:text-3xl font-black text-white px-2 py-0.5 rounded-lg border border-[#242424] hover:border-[#D4AF37] focus:outline-none cursor-pointer tracking-tight font-mono"
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
              <span className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                {quote.name}
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {quote.exchange || 'Exchange unavailable'} • <span className="text-[#D4AF37]">{quote.dataSource || 'Provider unavailable'}</span>
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-10 w-[1px] bg-[#242424]" />

          {/* Real-Time Price & Day Change on Mobile & Desktop */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
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
                {formatPrice(quote.price, 2, 'Unavailable')}
              </div>
              <div
                className={`text-xs font-bold font-mono flex items-center gap-1 ${
                  isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isFiniteMarketNumber(quote.change) ? `${isPositive ? '+' : ''}${quote.change.toFixed(2)}` : 'N/A'} (
                {formatPercent(quote.changePercent, 2, true, 'N/A')})
              </div>
            </div>

            {/* Mobile Session Stats (Right of Price on Mobile: High, Low, Vol) */}
            <div className="flex flex-col items-end sm:hidden text-[10px] font-mono text-[#9CA3AF] space-y-0.5">
              <div>
                High: <span className="text-white font-bold">{isFiniteMarketNumber(quote.dayHigh) ? `$${quote.dayHigh.toFixed(2)}` : 'N/A'}</span>
              </div>
              <div>
                Low: <span className="text-white font-bold">{isFiniteMarketNumber(quote.dayLow) ? `$${quote.dayLow.toFixed(2)}` : 'N/A'}</span>
              </div>
              <div>
                {t('market.volume')}:{' '}
                <span className="text-white font-bold">
                  {formatVolume(quote.volume)}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block h-10 w-[1px] bg-[#242424]" />

          {/* Desktop Session Metrics Bar */}
          <div className="hidden sm:grid xl:grid grid-cols-3 gap-x-4 gap-y-0.5 text-[10px] text-[#9CA3AF] uppercase tracking-wider pl-2 border-l border-[#242424]">
            <div>
              {t('market.dayHigh')}: <span className="text-white font-mono font-semibold">{isFiniteMarketNumber(quote.dayHigh) ? `$${quote.dayHigh.toFixed(2)}` : 'N/A'}</span>
            </div>
            <div>
              {t('market.dayLow')}: <span className="text-white font-mono font-semibold">{isFiniteMarketNumber(quote.dayLow) ? `$${quote.dayLow.toFixed(2)}` : 'N/A'}</span>
            </div>
            <div>
              {t('market.prevClose')}: <span className="text-white font-mono font-semibold">{isFiniteMarketNumber(quote.previousClose) ? `$${quote.previousClose.toFixed(2)}` : 'N/A'}</span>
            </div>
            <div>
              {t('market.volume')}:{' '}
              <span className="text-white font-mono font-semibold">
                {formatVolume(quote.volume)}
              </span>
            </div>
            <div>
              Rel {t('market.volume')}: <span className="text-[#D4AF37] font-mono font-semibold">{isFiniteMarketNumber(quote.relativeVolume) ? `${quote.relativeVolume}x` : 'N/A'}</span>
            </div>
            <div>
              {t('market.latency')}: <span className="text-[#F2D675] font-mono font-semibold">{isFiniteMarketNumber(quote.latencyMs) ? `${quote.latencyMs}ms` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right: Quant Bias, Probabilities Bar & Action Controls */}
        <div className="w-full lg:w-auto flex flex-wrap items-center gap-2.5 justify-between lg:justify-end">
          {/* Signal Badge & Confidence */}
          <div className="flex items-center lg:flex-col lg:items-end gap-2 lg:gap-0">
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 border ${
                bias === 'BULLISH'
                  ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/40'
                  : bias === 'BEARISH'
                  ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40'
                  : 'bg-[#A3A3A3]/10 text-[#A3A3A3] border-[#A3A3A3]/40'
              }`}
            >
              {bias === 'BULLISH' && <TrendingUp className="w-3.5 h-3.5" />}
              {bias === 'BEARISH' && <TrendingDown className="w-3.5 h-3.5" />}
              {bias === 'NEUTRAL' && <Minus className="w-3.5 h-3.5" />}
              {bias === 'UNAVAILABLE' && <AlertTriangle className="w-3.5 h-3.5" />}
              {bias === 'UNAVAILABLE' ? t('market.biasUnavailable') : `${bias} BIAS`}
            </div>
            <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-mono">
              AI: <span className="font-bold text-[#F2D675]">{isFiniteMarketNumber(probabilities.aiConfidence) ? `${probabilities.aiConfidence}%` : 'N/A'}</span>
            </div>
          </div>

          {/* Probabilities Multi-Bar */}
          <div className="flex flex-col bg-[#101010] rounded-lg p-1.5 md:p-2 min-w-[140px] md:min-w-[170px] border border-[#242424]">
            <div className="flex justify-between text-[9px] md:text-[10px] mb-1 font-mono font-bold">
              <span className="text-[#22C55E]">{t('common.bull')}: {isFiniteMarketNumber(probabilities.bullish) ? `${probabilities.bullish}%` : 'N/A'}</span>
              <span className="text-[#A3A3A3]">{t('common.neut')}: {isFiniteMarketNumber(probabilities.neutral) ? `${probabilities.neutral}%` : 'N/A'}</span>
              <span className="text-[#EF4444]">{t('common.bear')}: {isFiniteMarketNumber(probabilities.bearish) ? `${probabilities.bearish}%` : 'N/A'}</span>
            </div>
            <div className="h-1.5 md:h-2 w-full bg-[#1C1C1C] rounded-full overflow-hidden flex">
              <div
                className="bg-[#22C55E] h-full transition-all duration-500"
                style={{ width: `${isFiniteMarketNumber(probabilities.bullish) ? probabilities.bullish : 0}%` }}
                title={isFiniteMarketNumber(probabilities.bullish) ? `Bullish: ${probabilities.bullish}%` : 'Bullish probability unavailable'}
              />
              <div
                className="bg-[#A3A3A3] h-full transition-all duration-500"
                style={{ width: `${isFiniteMarketNumber(probabilities.neutral) ? probabilities.neutral : 0}%` }}
                title={isFiniteMarketNumber(probabilities.neutral) ? `Neutral: ${probabilities.neutral}%` : 'Neutral probability unavailable'}
              />
              <div
                className="bg-[#EF4444] h-full transition-all duration-500"
                style={{ width: `${isFiniteMarketNumber(probabilities.bearish) ? probabilities.bearish : 0}%` }}
                title={isFiniteMarketNumber(probabilities.bearish) ? `Bearish: ${probabilities.bearish}%` : 'Bearish probability unavailable'}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                title="Ask MarketMind AI Assistant"
                className="px-2.5 md:px-3 py-1.5 gold-gradient-btn text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#050505]" />
                <span className="text-[11px] text-[#050505]">{t('nav.askAi')}</span>
              </button>
            )}

            <button
              onClick={() => onOpenReport('morning')}
              title="Generate Morning Intelligence Report"
              className="hidden sm:flex px-2.5 py-1.5 bg-[#101010] hover:bg-[#151515] border border-[#242424] hover:border-[#D4AF37]/50 text-xs font-semibold rounded-lg items-center gap-1 text-[#E5E5E5] hover:text-white transition"
            >
              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">{t('nav.morningReport')}</span>
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
          </div>
        </div>
      </div>
    </header>
  );
};
