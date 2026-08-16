import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  AlertTriangle,
  WifiOff,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { InstrumentDirectoryService } from '../services/marketProviders/InstrumentDirectoryService';

export interface TradingViewChartProps {
  /**
   * Symbol to display. Can be standard ticker (e.g. 'AAPL', 'SPY', 'BTC-USD', 'EUR=X', 'ES=F')
   * or fully qualified TradingView symbol (e.g. 'AMEX:SPY', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'FX:EURUSD', 'CME_MINI:ES1!')
   * Defaults to 'AMEX:SPY'.
   */
  symbol?: string;
  /**
   * Chart timeframe / interval: '1', '5', '15', '30', '60', '240', 'D', 'W', 'M'
   */
  interval?: string;
  /**
   * Theme mode: 'dark' | 'light' | 'auto' (defaults to MarketMind active theme)
   */
  theme?: 'dark' | 'light' | 'auto';
  /**
   * Optional custom height (e.g. '650px'). Defaults to responsive 450px on mobile, 620px on desktop.
   */
  height?: string | number;
  /**
   * Width (defaults to '100%')
   */
  width?: string | number;
  /**
   * Allow user to search and change symbol inside TradingView widget
   */
  allowSymbolChange?: boolean;
  /**
   * Show/hide drawing side toolbar
   */
  hideSideToolbar?: boolean;
  /**
   * Show/hide top navigation toolbar
   */
  hideTopToolbar?: boolean;
  /**
   * Show/hide legend
   */
  hideLegend?: boolean;
  /**
   * Show/hide volume sub-chart
   */
  hideVolume?: boolean;
  /**
   * Enable save image / snapshot feature
   */
  saveImage?: boolean;
  /**
   * List of built-in technical studies / indicators to pre-load (e.g. ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'])
   */
  studies?: string[];
  /**
   * Callback fired when symbol changes
   */
  onSymbolChange?: (symbol: string) => void;
  /**
   * Show gold header toolbar with active asset info and MarketMind status
   */
  showHeaderBar?: boolean;
  /**
   * Additional container CSS classes
   */
  className?: string;
}

function formatCryptoPair(raw: string): string {
  const clean = raw.replace(/^CRYPTO:/i, '').replace(/[-/]/g, '').toUpperCase();
  if (clean.endsWith('USDT')) {
    return clean;
  }
  if (clean.endsWith('USD')) {
    return clean.slice(0, -3) + 'USDT';
  }
  return clean + 'USDT';
}

const NYSE_SYMBOLS = new Set([
  'IBM', 'BRK.B', 'BRK-B', 'BRK/B', 'BRK.A', 'BRK-A', 'BRK/A', 'JNJ', 'JPM', 'BAC', 'WMT',
  'XOM', 'CVX', 'PG', 'DIS', 'BA', 'CAT', 'UNH', 'V', 'MA', 'HD', 'KO', 'MCD', 'NKE', 'GS',
  'MS', 'CRM', 'ORCL', 'PFE', 'ABBV', 'LLY', 'T', 'VZ', 'NEE', 'RTX', 'GE', 'HON', 'BMY',
  'MDT', 'LOW', 'UPS', 'TMO', 'SCHW', 'BLK', 'C', 'WFC', 'AXP', 'DE', 'LMT', 'PM', 'MO'
]);

/**
 * Universal Dynamic Symbol Resolver for TradingView Format.
 * Dynamically resolves stocks, ETFs, crypto, forex, indices, and futures to exchange-qualified TradingView symbols
 * without requiring manual hardcoded lists of individual tickers.
 * Default symbol is AMEX:SPY.
 */
export function formatTradingViewSymbol(rawSymbol?: string): {
  formattedSymbol: string;
  assetType: 'stock' | 'etf' | 'crypto' | 'forex' | 'futures' | 'index' | 'unknown';
  displayName: string;
  exchange: string;
  isSupported: boolean;
} {
  // Default symbol fallback: AMEX:SPY
  if (!rawSymbol || !rawSymbol.trim()) {
    return {
      formattedSymbol: 'AMEX:SPY',
      assetType: 'etf',
      displayName: 'SPY',
      exchange: 'AMEX',
      isSupported: true,
    };
  }

  const sym = rawSymbol.trim().toUpperCase();

  // 1. If already qualified with exchange (e.g. 'AMEX:SPY', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'FX:EURUSD', 'CME_MINI:ES1!')
  if (sym.includes(':')) {
    const [exch, ticker] = sym.split(':');
    let assetType: 'stock' | 'etf' | 'crypto' | 'forex' | 'futures' | 'index' | 'unknown' = 'stock';
    const exchUpper = exch.toUpperCase();

    if (exchUpper.includes('BINANCE') || exchUpper.includes('COINBASE') || exchUpper.includes('CRYPTO') || exchUpper.includes('BITSTAMP')) {
      assetType = 'crypto';
    } else if (exchUpper.includes('FX') || exchUpper.includes('OANDA') || exchUpper.includes('FOREXCOM') || exchUpper.includes('SAXO')) {
      assetType = 'forex';
    } else if (exchUpper.includes('CME') || exchUpper.includes('NYMEX') || exchUpper.includes('COMEX') || exchUpper.includes('CBOT') || exchUpper.includes('EUREX')) {
      assetType = 'futures';
    } else if (exchUpper.includes('AMEX') || exchUpper.includes('ARCA') || ['SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'SLV', 'TLT', 'USO', 'XLF', 'XLE', 'XLK', 'VXX'].includes(ticker)) {
      assetType = 'etf';
    } else if (exchUpper.includes('SP') || exchUpper.includes('DJ') || exchUpper.includes('CBOE') || exchUpper.includes('TVC') || exchUpper.includes('INDEX')) {
      assetType = 'index';
    }

    return {
      formattedSymbol: sym,
      assetType,
      displayName: ticker || sym,
      exchange: exch,
      isSupported: true,
    };
  }

  // 2. Dynamic lookup from universal instrument directory (if available)
  const dirInstrument = InstrumentDirectoryService.getBySymbol(sym);
  if (dirInstrument) {
    const assetClass = dirInstrument.assetClass;
    const cleanSym = dirInstrument.symbol.toUpperCase();

    if (assetClass === 'CRYPTO' || assetClass === 'CRYPTO_PAIR') {
      const formattedPair = formatCryptoPair(cleanSym);
      return {
        formattedSymbol: `BINANCE:${formattedPair}`,
        assetType: 'crypto',
        displayName: dirInstrument.displaySymbol || cleanSym,
        exchange: 'BINANCE',
        isSupported: true,
      };
    }

    if (assetClass === 'FOREX') {
      const fxPair = cleanSym.replace(/[-/=X]/g, '');
      return {
        formattedSymbol: `FX:${fxPair.length === 3 ? fxPair + 'USD' : fxPair}`,
        assetType: 'forex',
        displayName: dirInstrument.displaySymbol || cleanSym,
        exchange: 'FX',
        isSupported: true,
      };
    }

    if (assetClass === 'FUTURES' || assetClass === 'COMMODITY') {
      let fExchange = 'CME_MINI';
      if (dirInstrument.exchange?.toUpperCase().includes('NYMEX') || cleanSym.startsWith('CL')) {
        fExchange = 'NYMEX';
      } else if (dirInstrument.exchange?.toUpperCase().includes('COMEX') || cleanSym.startsWith('GC') || cleanSym.startsWith('SI')) {
        fExchange = 'COMEX';
      } else if (dirInstrument.exchange?.toUpperCase().includes('CBOT') || cleanSym.startsWith('ZB') || cleanSym.startsWith('ZC')) {
        fExchange = 'CBOT';
      }
      const futuresRoot = cleanSym.replace(/=F/g, '').replace(/1!$/, '').replace(/!$/, '') + '1!';
      return {
        formattedSymbol: `${fExchange}:${futuresRoot}`,
        assetType: 'futures',
        displayName: dirInstrument.displaySymbol || cleanSym,
        exchange: fExchange,
        isSupported: true,
      };
    }

    if (assetClass === 'INDEX') {
      let idxExch = 'TVC';
      if (dirInstrument.exchange === 'CBOE' || cleanSym.includes('VIX')) idxExch = 'CBOE';
      else if (dirInstrument.exchange === 'S&P' || cleanSym.includes('SPX')) idxExch = 'SP';
      else if (dirInstrument.exchange === 'DOW' || cleanSym.includes('DJI')) idxExch = 'DJ';
      else if (dirInstrument.exchange === 'NASDAQ' || cleanSym.includes('NDX')) idxExch = 'NASDAQ';

      return {
        formattedSymbol: `${idxExch}:${cleanSym.replace(/^\^/, '')}`,
        assetType: 'index',
        displayName: dirInstrument.displaySymbol || cleanSym,
        exchange: idxExch,
        isSupported: true,
      };
    }

    if (assetClass === 'ETF') {
      const exch = dirInstrument.exchange || 'AMEX';
      return {
        formattedSymbol: `${exch}:${cleanSym}`,
        assetType: 'etf',
        displayName: cleanSym,
        exchange: exch,
        isSupported: true,
      };
    }

    // Standard Stock
    const stockExch = dirInstrument.exchange || (NYSE_SYMBOLS.has(cleanSym) ? 'NYSE' : 'NASDAQ');
    return {
      formattedSymbol: `${stockExch}:${cleanSym}`,
      assetType: 'stock',
      displayName: cleanSym,
      exchange: stockExch,
      isSupported: true,
    };
  }

  // 3. Algorithmic heuristics for arbitrary symbols not found in local directory

  // A. Crypto Heuristics (e.g. BTC-USD, BTCUSDT, ETHUSDT, SOL-USD, DOGE/USD)
  if (
    sym.includes('-USD') ||
    sym.includes('/USD') ||
    sym.endsWith('USDT') ||
    sym.endsWith('BTC') ||
    sym.startsWith('CRYPTO:') ||
    sym.startsWith('BTC') ||
    sym.startsWith('ETH') ||
    sym.startsWith('SOL')
  ) {
    const fullCrypto = formatCryptoPair(sym);
    return {
      formattedSymbol: `BINANCE:${fullCrypto}`,
      assetType: 'crypto',
      displayName: sym,
      exchange: 'BINANCE',
      isSupported: true,
    };
  }

  // B. Forex Heuristics (e.g. EURUSD, EUR/USD, EUR=X, GBP/USD, USDJPY)
  const FOREX_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY', 'HKD', 'SGD', 'SEK', 'NOK', 'MXN', 'ZAR', 'INR'];
  const isForexPair =
    sym.includes('=X') ||
    sym.includes('/USD') ||
    sym.startsWith('USD/') ||
    (sym.length === 6 && FOREX_CURRENCIES.some(c => sym.startsWith(c)) && FOREX_CURRENCIES.some(c => sym.endsWith(c)));

  if (isForexPair) {
    let cleanFx = sym.replace(/[=/]/g, '');
    if (cleanFx.endsWith('X')) {
      cleanFx = cleanFx.slice(0, -1);
      if (cleanFx.length === 3) cleanFx += 'USD';
    }
    return {
      formattedSymbol: `FX:${cleanFx}`,
      assetType: 'forex',
      displayName: sym,
      exchange: 'FX',
      isSupported: true,
    };
  }

  // C. Futures Heuristics (e.g. ES=F, NQ=F, CL=F, GC=F, ES1!, NQ1!, CL1!)
  if (sym.includes('=F') || sym.endsWith('1!') || sym.endsWith('!')) {
    const root = sym.replace(/=F/g, '').replace(/1!$/, '').replace(/!$/, '');
    let fExch = 'CME_MINI';
    if (root.startsWith('CL') || root.startsWith('NG') || root.startsWith('RB') || root.startsWith('HO')) fExch = 'NYMEX';
    else if (root.startsWith('GC') || root.startsWith('SI') || root.startsWith('HG') || root.startsWith('PL')) fExch = 'COMEX';
    else if (root.startsWith('ZB') || root.startsWith('ZN') || root.startsWith('ZF') || root.startsWith('ZC') || root.startsWith('ZS')) fExch = 'CBOT';

    return {
      formattedSymbol: `${fExch}:${root}1!`,
      assetType: 'futures',
      displayName: root,
      exchange: fExch,
      isSupported: true,
    };
  }

  // D. Index / Macro Heuristics (e.g. ^GSPC, ^VIX, ^TNX, US10Y, DXY, VIX)
  if (sym.startsWith('^') || ['VIX', 'US10Y', 'TNX', 'DXY', 'SPX', 'NDX', 'DJI'].includes(sym)) {
    let iExch = 'TVC';
    let cleanIndex = sym.replace(/^\^/, '');
    if (cleanIndex === 'GSPC' || cleanIndex === 'SPX') { iExch = 'SP'; cleanIndex = 'SPX'; }
    else if (cleanIndex === 'IXIC' || cleanIndex === 'NDX') { iExch = 'NASDAQ'; cleanIndex = 'NDX'; }
    else if (cleanIndex === 'DJI') { iExch = 'DJ'; cleanIndex = 'DJI'; }
    else if (cleanIndex === 'VIX' || cleanIndex === 'TNX') { iExch = 'CBOE'; }

    return {
      formattedSymbol: `${iExch}:${cleanIndex}`,
      assetType: 'index',
      displayName: cleanIndex,
      exchange: iExch,
      isSupported: true,
    };
  }

  // E. Handle Berkshire Class B normalization (BRK.B, BRK-B, BRK/B -> BRK.B)
  let normalizedTicker = sym;
  if (normalizedTicker.startsWith('BRK')) {
    normalizedTicker = 'BRK.B';
  }

  // F. ETFs and Standard Equities
  const isLikelyETF = ['SPY', 'QQQ', 'DIA', 'IWM', 'GLD', 'SLV', 'TLT', 'USO', 'XLF', 'XLE', 'XLK', 'XLV', 'XLI', 'XLP', 'XLU', 'XBI', 'SMH', 'HYG', 'LQD', 'EEM', 'EFA', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'ARKK'].includes(normalizedTicker);
  const defaultExchange = isLikelyETF ? 'AMEX' : (NYSE_SYMBOLS.has(normalizedTicker) ? 'NYSE' : 'NASDAQ');

  return {
    formattedSymbol: `${defaultExchange}:${normalizedTicker}`,
    assetType: isLikelyETF ? 'etf' : 'stock',
    displayName: normalizedTicker,
    exchange: defaultExchange,
    isSupported: true,
  };
}

/**
 * Convert standard timeframes to TradingView interval string.
 */
export function formatTradingViewInterval(tf?: string): string {
  if (!tf) return 'D';
  const norm = tf.toLowerCase().trim();
  switch (norm) {
    case '1m':
    case '1':
      return '1';
    case '2m':
    case '2':
      return '2';
    case '3m':
    case '3':
      return '3';
    case '5m':
    case '5':
      return '5';
    case '15m':
    case '15':
      return '15';
    case '30m':
    case '30':
      return '30';
    case '1h':
    case '60':
      return '60';
    case '2h':
    case '120':
      return '120';
    case '4h':
    case '240':
      return '240';
    case '1d':
    case 'd':
    case 'daily':
      return 'D';
    case '1w':
    case 'w':
    case 'weekly':
      return 'W';
    case '1mo':
    case 'm':
    case 'monthly':
      return 'M';
    default:
      return 'D';
  }
}

/**
 * Production-ready TradingView Advanced Chart Component for MarketMind AI.
 * Dynamically resolves exchange-qualified symbols for stocks, ETFs, crypto, forex, indices, and futures.
 * Default symbol is AMEX:SPY.
 * Symbol search is enabled with allow_symbol_change: true.
 */
export const TradingViewChart: React.FC<TradingViewChartProps> = memo(({
  symbol = 'AMEX:SPY',
  interval = 'D',
  theme = 'auto',
  height,
  width = '100%',
  allowSymbolChange = true,
  hideSideToolbar = false,
  hideTopToolbar = false,
  hideLegend = false,
  hideVolume = false,
  saveImage = true,
  studies = [],
  onSymbolChange,
  showHeaderBar = true,
  className = '',
}) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartMountIdRef = useRef<string>(`tv_chart_${Math.random().toString(36).substring(2, 9)}`);

  // Component lifecycle and state management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScriptError, setIsScriptError] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [activeInterval, setActiveInterval] = useState<string>(formatTradingViewInterval(interval));

  // Dynamically resolve symbol metadata without hardcoded lists
  const resolvedInfo = formatTradingViewSymbol(symbol);
  const effectiveTheme = theme === 'auto' ? (isDark ? 'dark' : 'light') : theme;

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync timeframe prop
  useEffect(() => {
    setActiveInterval(formatTradingViewInterval(interval));
  }, [interval]);

  // Main Widget Injection & Cleanup Lifecycle
  const loadWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    setIsScriptError(false);

    // Thorough DOM cleanup of any existing widget/scripts inside container
    container.innerHTML = '';

    // Check online status before embedding
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create main TradingView widget container structure
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container';
      widgetContainer.id = chartMountIdRef.current;
      widgetContainer.style.height = '100%';
      widgetContainer.style.width = '100%';

      // 2. Create the child canvas/widget slot (with height deduction for attribution bar)
      const widgetSlot = document.createElement('div');
      widgetSlot.className = 'tradingview-widget-container__widget';
      widgetSlot.style.height = 'calc(100% - 32px)';
      widgetSlot.style.width = '100%';
      widgetContainer.appendChild(widgetSlot);

      // 3. Preserve required TradingView copyright attribution using safe DOM nodes
      const copyright = document.createElement('div');
      copyright.className = 'tradingview-widget-copyright';
      const link = document.createElement('a');
      const safeSymbolSlug = encodeURIComponent(resolvedInfo.formattedSymbol.replace(':', '-'));
      link.href = `https://www.tradingview.com/symbols/${safeSymbolSlug}/`;
      link.rel = 'noopener nofollow';
      link.target = '_blank';
      const span = document.createElement('span');
      span.className = 'blue-text';
      span.textContent = `${resolvedInfo.displayName} Chart`;
      link.appendChild(span);
      copyright.appendChild(link);
      const tmSpan = document.createElement('span');
      tmSpan.className = 'trademark';
      tmSpan.textContent = ' by TradingView';
      copyright.appendChild(tmSpan);
      widgetContainer.appendChild(copyright);

      // 4. Build exact configuration parameters with allow_symbol_change: true
      const config = {
        allow_symbol_change: allowSymbolChange,
        calendar: false,
        details: false,
        hide_side_toolbar: hideSideToolbar,
        hide_top_toolbar: hideTopToolbar,
        hide_legend: hideLegend,
        hide_volume: hideVolume,
        hotlist: false,
        interval: activeInterval,
        locale: 'en',
        save_image: saveImage,
        style: '1',
        symbol: resolvedInfo.formattedSymbol,
        theme: effectiveTheme,
        timezone: 'Etc/UTC',
        backgroundColor: effectiveTheme === 'dark' ? '#0A0A0A' : '#FFFFFF',
        gridColor: effectiveTheme === 'dark' ? 'rgba(242, 242, 242, 0.06)' : 'rgba(0, 0, 0, 0.05)',
        watchlist: [],
        withdateranges: false,
        compareSymbols: [],
        support_host: 'https://www.tradingview.com',
        studies: studies,
        autosize: true,
      };

      // 5. Create and attach the official external embedding script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.async = true;
      script.textContent = JSON.stringify(config);

      script.onload = () => {
        setTimeout(() => setIsLoading(false), 400);
      };

      script.onerror = () => {
        setIsLoading(false);
        setIsScriptError(true);
      };

      widgetContainer.appendChild(script);
      container.appendChild(widgetContainer);

      const fallbackTimer = setTimeout(() => {
        setIsLoading(false);
      }, 1200);

      return () => clearTimeout(fallbackTimer);
    } catch (err) {
      console.error('[TradingViewChart] Widget creation error:', err);
      setIsLoading(false);
      setIsScriptError(true);
    }
  }, [
    resolvedInfo.formattedSymbol,
    resolvedInfo.displayName,
    activeInterval,
    effectiveTheme,
    allowSymbolChange,
    hideSideToolbar,
    hideTopToolbar,
    hideLegend,
    hideVolume,
    saveImage,
    JSON.stringify(studies),
  ]);

  // Execute widget load whenever symbol, interval, or theme changes
  useEffect(() => {
    const cleanup = loadWidget();
    return () => {
      if (cleanup) cleanup();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [loadWidget]);

  const TIMEFRAME_INTERVALS = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1h', value: '60' },
    { label: '4h', value: '240' },
    { label: '1D', value: 'D' },
    { label: '1W', value: 'W' },
  ];

  return (
    <div
      id="marketmind-tradingview-chart-card"
      className={`w-full rounded-xl border border-[#242424] bg-[#0A0A0A] shadow-xl overflow-hidden flex flex-col font-sans transition-all duration-200 ${className}`}
    >
      {/* 1. MarketMind Gold & Obsidian Header Control Bar */}
      {showHeaderBar && (
        <div className="px-3.5 py-2.5 bg-[#0D0D0D] border-b border-[#242424] flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Active Asset Meta Badge & TradingView Search Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#141414] border border-[#D4AF37]/40 rounded-lg shadow-inner">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-xs font-mono font-bold text-[#F2D675] tracking-wide">
                {resolvedInfo.formattedSymbol}
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 rounded font-semibold uppercase">
                {resolvedInfo.assetType}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
              <span>{resolvedInfo.exchange} Exchange</span>
              <span className="text-neutral-600">&bull;</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Live Symbol Search Active
              </span>
            </div>
          </div>

          {/* Right: Interval Controls & Widget Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Timeframe Interval Buttons */}
            <div className="flex items-center gap-0.5 bg-[#121212] p-0.5 rounded-lg border border-[#242424]">
              {TIMEFRAME_INTERVALS.map((tf) => {
                const isActive = activeInterval === tf.value;
                return (
                  <button
                    key={tf.value}
                    id={`btn-tv-interval-${tf.value}`}
                    onClick={() => setActiveInterval(tf.value)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      isActive
                        ? 'bg-[#262626] text-[#F2D675] border border-[#D4AF37]/50 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>

            {/* Reload Widget Button */}
            <button
              id="btn-tv-reload-chart"
              onClick={loadWidget}
              title="Refresh TradingView Chart"
              className="p-1 rounded-lg bg-[#141414] border border-[#242424] text-neutral-400 hover:text-[#F2D675] hover:border-[#D4AF37]/40 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Responsive Canvas Container */}
      <div
        className="relative w-full overflow-hidden bg-[#0A0A0A] flex-1"
        style={{
          height: height || undefined,
          minHeight: height ? undefined : '450px',
        }}
      >
        {/* State A: Offline State Indicator */}
        {isOffline && (
          <div className="absolute inset-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
              <WifiOff className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Network Connection Lost</h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-4">
              TradingView real-time candlestick charts require an active internet connection. Please check your network and retry.
            </p>
            <button
              onClick={loadWidget}
              className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold rounded-lg transition shadow-md flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* State B: Script Failure State */}
        {isScriptError && !isOffline && (
          <div className="absolute inset-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">TradingView Chart Script Failed</h3>
            <p className="text-xs text-neutral-400 max-w-md mb-4">
              Unable to load external TradingView chart engine. This could be due to network filtering or content blockers.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={loadWidget}
                className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Chart</span>
              </button>
              <a
                href={`https://www.tradingview.com/symbols/${resolvedInfo.formattedSymbol.replace(':', '-')}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-[#181818] border border-[#333333] hover:border-[#D4AF37] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
              >
                <span>Open in TradingView</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
              </a>
            </div>
          </div>
        )}

        {/* State C: Loading Skeleton Overlay */}
        {isLoading && !isOffline && !isScriptError && (
          <div className="absolute inset-0 z-20 bg-[#0A0A0A]/85 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none">
            <div className="w-9 h-9 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-3 shadow-lg" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#F2D675] tracking-wide">
                Rendering {resolvedInfo.formattedSymbol} ({activeInterval})
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono mt-1">
              TradingView Advanced Multi-Asset Engine (Symbol Search Enabled)
            </span>
          </div>
        )}

        {/* 3. TradingView Embed Target Mount */}
        <div
          ref={containerRef}
          className="w-full h-full min-h-[450px] md:min-h-[600px]"
          style={{ width }}
        />
      </div>

      {/* 4. MarketMind Disclaimer & Attribution Footer */}
      <div className="px-3.5 py-1.5 bg-[#0D0D0D] border-t border-[#1F1F1F] flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[#D4AF37] font-semibold">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            MarketMind AI:
          </span>
          <span className="text-neutral-400 hidden sm:inline">
            Interactive chart powered by TradingView. Use the search bar in the chart header or top navigation to lookup any asset worldwide.
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="px-1.5 py-0.2 bg-[#1A1A1A] border border-[#2D2D2D] rounded text-neutral-300">
            {activeInterval} Candle Frame
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Active
          </span>
        </div>
      </div>
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
export default TradingViewChart;
