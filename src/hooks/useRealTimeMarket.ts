import { useState, useEffect, useMemo, useRef } from 'react';
import { RealTimeMarketStore } from '../services/realtime/RealTimeMarketStore';
import { NormalizedQuote, ProviderConnectionStatus, RealTimeDiagnosticsInfo, RealTimeDataMode } from '../types/realtime';
import { MarketSessionEngine } from '../services/realtime/MarketSessionEngine';

export function useRealTimeQuote(symbol: string, consumerIdPrefix: string = 'component') {
  const store = useMemo(() => RealTimeMarketStore.getInstance(), []);
  const cleanSymbol = (symbol || '').toUpperCase().trim();
  const consumerId = useMemo(() => `${consumerIdPrefix}_${Math.random().toString(36).substring(2, 8)}`, [consumerIdPrefix]);

  const [quote, setQuote] = useState<NormalizedQuote | null>(() => (cleanSymbol ? store.getQuote(cleanSymbol) : null));
  const [flash, setFlash] = useState<'UP' | 'DOWN' | null>(() => (cleanSymbol ? store.getPriceFlash(cleanSymbol) : null));

  useEffect(() => {
    if (!cleanSymbol) return;

    // Fetch initial
    setQuote(store.getQuote(cleanSymbol));
    setFlash(store.getPriceFlash(cleanSymbol));

    const unsubscribe = store.subscribeSymbol(cleanSymbol, consumerId, () => {
      setQuote(store.getQuote(cleanSymbol));
      setFlash(store.getPriceFlash(cleanSymbol));
    });

    return () => {
      unsubscribe();
    };
  }, [store, cleanSymbol, consumerId]);

  return {
    quote,
    price: quote?.price,
    flash,
    mode: quote?.mode || 'UNAVAILABLE',
    marketStatus: quote?.marketStatus,
    stale: quote?.stale ?? false,
    timestamp: quote?.timestamp,
  };
}

export function useRealTimeWatchlist(symbols: string[], consumerIdPrefix: string = 'watchlist') {
  const store = useMemo(() => RealTimeMarketStore.getInstance(), []);
  const consumerId = useMemo(() => `${consumerIdPrefix}_${Math.random().toString(36).substring(2, 8)}`, [consumerIdPrefix]);

  const [tickVersion, setTickVersion] = useState(0);

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    const unsubs = symbols.map((sym) =>
      store.subscribeSymbol(sym, consumerId, () => {
        setTickVersion((v) => v + 1);
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [store, symbols, consumerId]);

  const quotes = useMemo(() => {
    const map: Record<string, NormalizedQuote | null> = {};
    symbols.forEach((sym) => {
      map[sym.toUpperCase()] = store.getQuote(sym);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, symbols, tickVersion]);

  const flashes = useMemo(() => {
    const map: Record<string, 'UP' | 'DOWN' | null> = {};
    symbols.forEach((sym) => {
      map[sym.toUpperCase()] = store.getPriceFlash(sym);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, symbols, tickVersion]);

  return { quotes, flashes };
}

export function useRealTimeDiagnostics() {
  const store = useMemo(() => RealTimeMarketStore.getInstance(), []);
  const [diagnostics, setDiagnostics] = useState<RealTimeDiagnosticsInfo>(() => store.getDiagnostics());
  const [status, setStatus] = useState<ProviderConnectionStatus>(() => store.getStatus());
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const unsub = store.subscribeDiagnostics((diag) => {
      setDiagnostics(diag);
      setStatus(store.getStatus());
    });
    return () => unsub();
  }, [store]);

  const runTest = async (symbol: string = 'BTC-USD') => {
    setIsTesting(true);
    try {
      const result = await store.getManager().runDiagnosticsTest(symbol);
      setDiagnostics(store.getDiagnostics());
      return result;
    } finally {
      setIsTesting(false);
    }
  };

  return {
    diagnostics,
    status,
    isTesting,
    runTest,
  };
}

export function useRealTimeStatus(symbol: string = 'SPY') {
  const store = useMemo(() => RealTimeMarketStore.getInstance(), []);
  const [status, setStatus] = useState<ProviderConnectionStatus>(() => store.getStatus());
  const quote = store.getQuote(symbol);

  useEffect(() => {
    const unsub = store.subscribeGlobal(() => {
      setStatus(store.getStatus());
    });
    return () => unsub();
  }, [store]);

  const session = MarketSessionEngine.getSessionForSymbol(symbol);

  let displayMode: RealTimeDataMode = 'UNAVAILABLE';
  if (status === 'CONNECTED' || status === 'DEGRADED') {
    displayMode = session.isOpen ? 'REAL_TIME' : 'CLOSED';
  } else if (quote) {
    displayMode = quote.mode;
  }

  return {
    status,
    displayMode,
    session,
    isOpen: session.isOpen,
  };
}
