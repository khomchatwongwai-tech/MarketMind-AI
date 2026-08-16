import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MassiveWsStatus,
  MassiveWsClientMessage,
  CalculatedMarketSignals,
  MassiveAiInsight,
} from '../types/massiveWs';

export interface UseMassiveWebSocketReturn {
  status: MassiveWsStatus;
  isDelayed: boolean;
  ticker: string;
  livePrice: number;
  liveTrade: {
    price: number;
    size: number;
    time: number;
    formattedTime: string;
  } | null;
  liveAggregate: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap: number;
  } | null;
  signals: CalculatedMarketSignals | null;
  aiInsight: MassiveAiInsight | null;
  isConnected: boolean;
  subscribeTicker: (ticker: string) => void;
  requestAiInsight: () => void;
  reconnect: () => void;
}

export function useMassiveWebSocket(initialTicker: string = 'SPY'): UseMassiveWebSocketReturn {
  const [status, setStatus] = useState<MassiveWsStatus>('CONNECTING');
  const [isDelayed, setIsDelayed] = useState<boolean>(false);
  const [ticker, setTicker] = useState<string>(initialTicker);
  const [livePrice, setLivePrice] = useState<number>(0);
  const [liveTrade, setLiveTrade] = useState<UseMassiveWebSocketReturn['liveTrade']>(null);
  const [liveAggregate, setLiveAggregate] = useState<UseMassiveWebSocketReturn['liveAggregate']>(null);
  const [signals, setSignals] = useState<CalculatedMarketSignals | null>(null);
  const [aiInsight, setAiInsight] = useState<MassiveAiInsight | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/massive`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatus('LIVE');
        // Subscribe only to active ticker (default SPY)
        ws.send(JSON.stringify({ action: 'SUBSCRIBE', ticker }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: MassiveWsClientMessage = JSON.parse(event.data);

          if (msg.type === 'STATUS' && msg.status) {
            setStatus(msg.status);
            if (msg.ticker) setTicker(msg.ticker);
            if (msg.isDelayed !== undefined) setIsDelayed(msg.isDelayed);
          }

          if (msg.type === 'TRADE' && msg.trade) {
            setLiveTrade(msg.trade);
            setLivePrice(msg.trade.price);
            if (msg.signals) {
              setSignals(msg.signals);
              if (msg.signals.isDelayed !== undefined) setIsDelayed(msg.signals.isDelayed);
            }
          }

          if (msg.type === 'AGGREGATE' && msg.aggregate) {
            setLiveAggregate(msg.aggregate);
            setLivePrice(msg.aggregate.close);
            if (msg.signals) {
              setSignals(msg.signals);
              if (msg.signals.isDelayed !== undefined) setIsDelayed(msg.signals.isDelayed);
            }
          }

          if (msg.type === 'SIGNALS' && msg.signals) {
            setSignals(msg.signals);
            setLivePrice(msg.signals.price);
            if (msg.signals.isDelayed !== undefined) setIsDelayed(msg.signals.isDelayed);
          }

          if (msg.type === 'AI_INSIGHT' && msg.aiInsight) {
            setAiInsight(msg.aiInsight);
          }
        } catch (e) {
          console.warn('[useMassiveWebSocket] Error parsing server message:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('[useMassiveWebSocket] WebSocket error:', e);
        setStatus('RECONNECTING');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatus('RECONNECTING');
        // Try reconnecting after 3s
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (err) {
      console.error('[useMassiveWebSocket] Connection exception:', err);
    }
  }, [ticker]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const subscribeTicker = useCallback((newTicker: string) => {
    const clean = (newTicker || 'SPY').toUpperCase().trim();
    setTicker(clean);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'SUBSCRIBE', ticker: clean }));
    }
  }, []);

  const requestAiInsight = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'REQUEST_AI_FEED' }));
    }
  }, []);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  return {
    status,
    isDelayed,
    ticker,
    livePrice,
    liveTrade,
    liveAggregate,
    signals,
    aiInsight,
    isConnected,
    subscribeTicker,
    requestAiInsight,
    reconnect,
  };
}

