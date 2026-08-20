import {
  NormalizedInstrument,
  UniversalAssetClass,
  ProviderSymbolMap,
  TradingSessionType,
} from '../../types/instrument.js';
import { InstrumentDirectoryService } from './InstrumentDirectoryService.js';

// ==========================================
// MarketMind AI — Centralized Instrument Resolver
// Standardizes provider mappings and normalizes identifiers
// across Stock, ETF, Index, Option, Crypto, Forex, Future, Mutual Fund, Economic Data.
// ==========================================

export interface ResolvedInstrumentResult {
  instrument: NormalizedInstrument;
  normalizedSymbol: string;
  assetClass: UniversalAssetClass;
  providerSymbols: ProviderSymbolMap;
}

export class InstrumentResolver {
  /**
   * Primary resolver method: Takes any raw user or query symbol and returns a clean,
   * standard NormalizedInstrument with complete multi-provider mapping.
   */
  public static resolve(rawInput: string): ResolvedInstrumentResult {
    const raw = (rawInput || '').trim();
    if (!raw) {
      return this.createFallback(rawInput || 'UNKNOWN', 'STOCK');
    }

    // 1. Direct Catalog Match
    const catalogMatch =
      InstrumentDirectoryService.getById(raw) ||
      InstrumentDirectoryService.getBySymbol(raw);

    if (catalogMatch) {
      return {
        instrument: catalogMatch,
        normalizedSymbol: catalogMatch.symbol,
        assetClass: catalogMatch.assetClass,
        providerSymbols: catalogMatch.providerSymbols,
      };
    }

    // 2. Pattern-based Classification & Symbol Normalization
    const upper = raw.toUpperCase();

    // Option OSI Symbol Pattern: e.g. "O:SPY260821C00515000" or "SPY260821C00515000" or "SPY 260821 C 515"
    if (this.isOptionPattern(upper)) {
      return this.resolveOption(upper);
    }

    // Crypto Pattern: e.g. "BTC/USD", "BTC-USD", "BTCUSD", "ETH-USD", "SOL/USDT", "X:BTCUSD"
    if (this.isCryptoPattern(upper)) {
      return this.resolveCrypto(upper);
    }

    // Forex Pattern: e.g. "EUR/USD", "EURUSD", "EUR_USD", "USD/JPY", "C:EURUSD"
    if (this.isForexPattern(upper)) {
      return this.resolveForex(upper);
    }

    // Futures Pattern: e.g. "/ES", "ES=F", "NQ", "/CL", "CL=F", "GC=F", "ESH26"
    if (this.isFuturesPattern(upper)) {
      return this.resolveFutures(upper);
    }

    // Index Pattern: e.g. "^GSPC", "^IXIC", "^VIX", "SPX", "NDX", "VIX", "I:SPX"
    if (this.isIndexPattern(upper)) {
      return this.resolveIndex(upper);
    }

    // Economic Indicator / Macro Pattern: e.g. "CPI", "FEDFUNDS", "DGS10", "UNRATE", "GDP"
    if (this.isEconomicPattern(upper)) {
      return this.resolveEconomic(upper);
    }

    // Default: Standard Equity / ETF
    return this.resolveEquity(upper);
  }

  // ----------------------------------------------------
  // Asset Class Pattern Detectors
  // ----------------------------------------------------

  public static isCryptoPattern(sym: string): boolean {
    if (sym.startsWith('X:') || sym.includes('BINANCE:') || sym.includes('COINBASE:')) return true;
    const clean = sym.replace(/[/_-]/g, '');
    const cryptoBases = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'BNB', 'DOT', 'NEAR', 'SUI'];
    return cryptoBases.some(
      (b) => clean.startsWith(b) && (clean.endsWith('USD') || clean.endsWith('USDT') || clean.endsWith('USDC') || clean.endsWith('EUR'))
    );
  }

  public static isForexPattern(sym: string): boolean {
    if (sym.startsWith('C:') || sym.includes('=X') || sym.includes('OANDA:')) return true;
    const clean = sym.replace(/[/_-]/g, '');
    const majors = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
    return majors.includes(clean);
  }

  public static isFuturesPattern(sym: string): boolean {
    if (sym.startsWith('/') || sym.endsWith('=F') || sym.startsWith('CME:')) return true;
    const roots = ['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC', 'SI', 'NG', 'ZB', 'ZN', 'ZF', 'ZT'];
    const clean = sym.replace('/', '').replace('=F', '');
    return roots.some((r) => clean === r || (clean.startsWith(r) && clean.length <= 5));
  }

  public static isIndexPattern(sym: string): boolean {
    if (sym.startsWith('^') || sym.startsWith('I:')) return true;
    const indices = ['SPX', 'NDX', 'DJI', 'RUT', 'VIX', 'TNX'];
    return indices.includes(sym);
  }

  public static isOptionPattern(sym: string): boolean {
    if (sym.startsWith('O:')) return true;
    // OSI format: AAPL260821C00220000 (6-digit date + C/P + 8-digit price)
    return /[A-Z]{1,6}\d{6}[CP]\d{8}/.test(sym.replace(/\s+/g, ''));
  }

  public static isEconomicPattern(sym: string): boolean {
    const macros = ['CPI', 'CORECPI', 'PPI', 'PCE', 'UNRATE', 'FEDFUNDS', 'DGS10', 'DGS2', 'GDP', 'PAYEMS'];
    return macros.includes(sym);
  }

  // ----------------------------------------------------
  // Resolvers by Asset Class
  // ----------------------------------------------------

  private static resolveCrypto(raw: string): ResolvedInstrumentResult {
    let clean = raw.replace(/^X:/, '').replace(/BINANCE:/, '').replace(/COINBASE:/, '');
    let base = 'BTC';
    let quote = 'USD';

    if (clean.includes('/')) {
      const parts = clean.split('/');
      base = parts[0];
      quote = parts[1];
    } else if (clean.includes('-')) {
      const parts = clean.split('-');
      base = parts[0];
      quote = parts[1];
    } else if (clean.endsWith('USDT')) {
      base = clean.replace('USDT', '');
      quote = 'USDT';
    } else if (clean.endsWith('USD')) {
      base = clean.replace('USD', '');
      quote = 'USD';
    }

    const displaySymbol = `${base}/${quote}`;
    const standardSymbol = `${base}-${quote}`;
    const instrumentId = `inst_crypto_${base.toLowerCase()}_${quote.toLowerCase()}`;

    const providerSymbols: ProviderSymbolMap = {
      massive: `X:${base}${quote === 'USD' ? 'USD' : quote}`,
      finnhub: `BINANCE:${base}${quote === 'USD' ? 'USDT' : quote}`,
      alpaca: `${base}${quote}`,
      yahoo: `${base}-${quote}`,
    };

    const instrument: NormalizedInstrument = {
      instrumentId,
      symbol: standardSymbol,
      displaySymbol,
      name: `${base} / ${quote} Spot Pair`,
      assetClass: 'CRYPTO',
      instrumentType: 'Cryptocurrency Spot Pair',
      exchange: 'Aggregated Crypto Exchanges',
      country: 'Global',
      currency: quote,
      providerSymbol: providerSymbols.massive || standardSymbol,
      providerSymbols,
      baseCurrency: base,
      quoteCurrency: quote,
      marketTimezone: 'UTC',
      tradingSession: 'CONTINUOUS_24_7',
      activeStatus: 'ACTIVE',
      primaryProvider: 'massive',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: standardSymbol, assetClass: 'CRYPTO', providerSymbols };
  }

  private static resolveForex(raw: string): ResolvedInstrumentResult {
    let clean = raw.replace(/^C:/, '').replace('=X', '').replace('OANDA:', '').replace(/[/_-]/g, '');
    const base = clean.substring(0, 3);
    const quote = clean.substring(3, 6);
    const displaySymbol = `${base}/${quote}`;
    const standardSymbol = `${base}/${quote}`;
    const instrumentId = `inst_forex_${base.toLowerCase()}_${quote.toLowerCase()}`;

    const providerSymbols: ProviderSymbolMap = {
      massive: `C:${base}${quote}`,
      finnhub: `OANDA:${base}_${quote}`,
      alpaca: `${base}/${quote}`,
      yahoo: `${base}${quote}=X`,
    };

    const instrument: NormalizedInstrument = {
      instrumentId,
      symbol: standardSymbol,
      displaySymbol,
      name: `${base}/${quote} Currency Pair`,
      assetClass: 'FOREX',
      instrumentType: 'Foreign Exchange Major Pair',
      exchange: 'Interbank FX',
      country: 'Global',
      currency: quote,
      providerSymbol: providerSymbols.massive || standardSymbol,
      providerSymbols,
      baseCurrency: base,
      quoteCurrency: quote,
      marketTimezone: 'America/New_York',
      tradingSession: 'REGULAR_24_5',
      activeStatus: 'ACTIVE',
      primaryProvider: 'massive',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: standardSymbol, assetClass: 'FOREX', providerSymbols };
  }

  private static resolveFutures(raw: string): ResolvedInstrumentResult {
    let clean = raw.replace(/^\//, '').replace('=F', '').replace(/^CME:/, '');
    const root = clean.substring(0, 2);
    const displaySymbol = `/${clean}`;
    const standardSymbol = clean;
    const instrumentId = `inst_futures_${clean.toLowerCase()}`;

    const providerSymbols: ProviderSymbolMap = {
      massive: `CME:${clean}`,
      cme: `/${clean}`,
      yahoo: `${clean}=F`,
    };

    const instrument: NormalizedInstrument = {
      instrumentId,
      symbol: standardSymbol,
      displaySymbol,
      name: `CME ${root} Futures Contract`,
      assetClass: 'FUTURES',
      instrumentType: 'Standardized Futures Contract',
      exchange: 'CME',
      exchangeMIC: 'XCME',
      country: 'United States',
      currency: 'USD',
      providerSymbol: providerSymbols.yahoo || standardSymbol,
      providerSymbols,
      marketTimezone: 'America/Chicago',
      tradingSession: 'US_FUTURES_CME',
      activeStatus: 'ACTIVE',
      primaryProvider: 'cme',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: standardSymbol, assetClass: 'FUTURES', providerSymbols };
  }

  private static resolveIndex(raw: string): ResolvedInstrumentResult {
    let clean = raw.replace(/^\^/, '').replace(/^I:/, '');
    const displaySymbol = `^${clean}`;
    const standardSymbol = clean;
    const instrumentId = `inst_index_${clean.toLowerCase()}`;

    const providerSymbols: ProviderSymbolMap = {
      massive: `I:${clean}`,
      yahoo: `^${clean}`,
      finnhub: clean,
    };

    const instrument: NormalizedInstrument = {
      instrumentId,
      symbol: standardSymbol,
      displaySymbol,
      name: `${clean} Benchmark Index`,
      assetClass: 'INDEX',
      instrumentType: 'Market Benchmark Index',
      exchange: 'CBOE/S&P/Nasdaq',
      country: 'United States',
      currency: 'USD',
      providerSymbol: providerSymbols.massive || standardSymbol,
      providerSymbols,
      marketTimezone: 'America/New_York',
      tradingSession: 'US_EQUITIES_REGULAR',
      activeStatus: 'ACTIVE',
      primaryProvider: 'massive',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: standardSymbol, assetClass: 'INDEX', providerSymbols };
  }

  private static resolveOption(raw: string): ResolvedInstrumentResult {
    const cleanOSI = raw.replace(/^O:/, '').replace(/\s+/g, '');
    const instrumentId = `inst_opt_${cleanOSI.toLowerCase()}`;

    const providerSymbols: ProviderSymbolMap = {
      massive: `O:${cleanOSI}`,
      yahoo: cleanOSI,
      alpaca: cleanOSI,
    };

    const instrument: NormalizedInstrument = {
      instrumentId,
      symbol: cleanOSI,
      displaySymbol: cleanOSI,
      name: `Option Contract ${cleanOSI}`,
      assetClass: 'OPTION',
      instrumentType: 'Vanilla Equity / Index Option',
      exchange: 'OPRA / OCC',
      exchangeMIC: 'XCBO',
      country: 'United States',
      currency: 'USD',
      providerSymbol: providerSymbols.massive || cleanOSI,
      providerSymbols,
      marketTimezone: 'America/New_York',
      tradingSession: 'US_EQUITIES_REGULAR',
      activeStatus: 'ACTIVE',
      primaryProvider: 'massive',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: cleanOSI, assetClass: 'OPTION', providerSymbols };
  }

  private static resolveEconomic(raw: string): ResolvedInstrumentResult {
    const clean = raw.toUpperCase();
    const instrumentId = `inst_econ_${clean.toLowerCase()}`;

    const providerSymbols: ProviderSymbolMap = {
      fred: clean,
      finnhub: clean,
    };

    const instrument: NormalizedInstrument = {
      instrumentId,
      symbol: clean,
      displaySymbol: clean,
      name: `${clean} Macroeconomic Indicator`,
      assetClass: 'ECONOMIC_INDICATOR',
      instrumentType: 'Economic Data Series',
      exchange: 'Federal Reserve / BLS',
      country: 'United States',
      currency: 'USD',
      providerSymbol: clean,
      providerSymbols,
      marketTimezone: 'America/New_York',
      tradingSession: 'MACRO_SCHEDULED',
      activeStatus: 'ACTIVE',
      primaryProvider: 'fred',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: clean, assetClass: 'ECONOMIC_INDICATOR', providerSymbols };
  }

  private static resolveEquity(raw: string): ResolvedInstrumentResult {
    const clean = raw.toUpperCase();
    const instrumentId = `inst_stock_${clean.toLowerCase()}`;

    const providerSymbols: ProviderSymbolMap = {
      massive: clean,
      finnhub: clean,
      alpaca: clean,
      benzinga: clean,
      yahoo: clean,
    };

    const instrument: NormalizedInstrument = {
      instrumentId,
      symbol: clean,
      displaySymbol: clean,
      name: `${clean} Equity`,
      assetClass: 'STOCK',
      instrumentType: 'Common Stock',
      exchange: 'US Equities',
      country: 'United States',
      currency: 'USD',
      providerSymbol: clean,
      providerSymbols,
      marketTimezone: 'America/New_York',
      tradingSession: 'US_EQUITIES_EXTENDED',
      activeStatus: 'ACTIVE',
      primaryProvider: 'massive',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: clean, assetClass: 'STOCK', providerSymbols };
  }

  private static createFallback(symbol: string, assetClass: UniversalAssetClass): ResolvedInstrumentResult {
    const instrument: NormalizedInstrument = {
      instrumentId: `inst_${symbol.toLowerCase()}`,
      symbol,
      displaySymbol: symbol,
      name: symbol,
      assetClass,
      instrumentType: 'Standard Instrument',
      exchange: 'US Exchanges',
      country: 'United States',
      currency: 'USD',
      providerSymbol: symbol,
      providerSymbols: { massive: symbol, yahoo: symbol },
      marketTimezone: 'America/New_York',
      tradingSession: 'US_EQUITIES_REGULAR',
      activeStatus: 'ACTIVE',
      primaryProvider: 'massive',
      realTimeStatus: 'REAL_TIME',
      feedDelayMinutes: 0,
      isEntitled: true,
      lastUpdated: new Date().toISOString(),
    };

    return { instrument, normalizedSymbol: symbol, assetClass, providerSymbols: { massive: symbol, yahoo: symbol } };
  }
}
