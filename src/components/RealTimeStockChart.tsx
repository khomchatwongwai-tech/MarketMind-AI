import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  Time,
  IPriceLine,
  LineStyle,
} from 'lightweight-charts';
import {
  ChartTimeframe,
  ChartCandle,
  IndicatorSettings,
  ChartLevels,
  MarketStructureInfo,
  BreakoutAlert,
  AIChartAnalysisResult,
} from '../types/chart';
import { TickerSymbol } from '../types/market';
import { fetchCandles, requestAIChartAnalysis } from '../services/candleDataService';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  evaluateMarketStructure,
  checkRealTimeBreakouts,
} from '../services/technicalIndicators';
import { useMassiveWebSocket } from '../hooks/useMassiveWebSocket';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Clock,
  Radio,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  X,
  Volume2,
  Zap,
  Info,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface RealTimeStockChartProps {
  ticker: TickerSymbol;
  isLiveSimulation?: boolean;
}

const TIMEFRAMES: Array<{ label: string; value: ChartTimeframe }> = [
  { label: '1M', value: '1m' },
  { label: '2M', value: '2m' },
  { label: '5M', value: '5m' },
  { label: '15M', value: '15m' },
  { label: '30M', value: '30m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

export const RealTimeStockChart: React.FC<RealTimeStockChartProps> = ({
  ticker,
  isLiveSimulation = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Series refs
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Price lines (S/R overlays)
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const currentPriceLineRef = useRef<IPriceLine | null>(null);

  // State
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('5m');
  const [extendedHours, setExtendedHours] = useState<boolean>(true);
  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [levels, setLevels] = useState<ChartLevels>({});
  const [marketStatus, setMarketStatus] = useState<'LIVE' | 'DELAYED' | 'DISCONNECTED' | 'UNAVAILABLE'>('LIVE');
  const [lastUpdateStr, setLastUpdateStr] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  // Current quote display
  const [livePrice, setLivePrice] = useState<number>(512.48);
  const [liveChange, setLiveChange] = useState<number>(4.2);
  const [liveChangePercent, setLiveChangePercent] = useState<number>(0.82);

  // Hover Crosshair Tooltip
  const [hoverData, setHoverData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
  } | null>(null);

  // Indicators toggle state
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    vwap: true,
    ema9: true,
    ema20: true,
    ema50: false,
    ema200: false,
    sma20: false,
    sma50: false,
    sma200: false,
    bollinger: false,
    rsi: true,
    macd: false,
    volume: true,
    supportResistance: true,
  });
  const [showIndicatorMenu, setShowIndicatorMenu] = useState<boolean>(false);

  // Real-time Breakout Alerts
  const [breakoutAlert, setBreakoutAlert] = useState<BreakoutAlert | null>(null);
  const prevPriceRef = useRef<number>(512.48);

  // AI Chart Analysis modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIChartAnalysisResult | null>(null);

  // Calculate Market Structure & Multi-Timeframe Alignment
  const marketStructure: MarketStructureInfo = useMemo(() => {
    return evaluateMarketStructure(candles, timeframe, levels);
  }, [candles, timeframe, levels]);

  // Secondary sub-indicators (RSI & MACD) calculated from candles
  const rsiValues = useMemo(() => calculateRSI(candles, 14), [candles]);
  const currentRsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1].value : 50;

  const macdValues = useMemo(() => calculateMACD(candles), [candles]);
  const currentMacd = macdValues.histogram.length > 0 ? macdValues.histogram[macdValues.histogram.length - 1].value : 0;

  // 1. Initialize Lightweight Chart instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#131518' },
        textColor: '#94a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(45, 49, 57, 0.4)', style: 1 },
        horzLines: { color: 'rgba(45, 49, 57, 0.4)', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: 3,
          labelBackgroundColor: '#4f46e5',
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: 3,
          labelBackgroundColor: '#4f46e5',
        },
      },
      rightPriceScale: {
        borderColor: '#2d3139',
        scaleMargins: {
          top: 0.08,
          bottom: 0.22, // leave bottom space for volume bars
        },
      },
      timeScale: {
        borderColor: '#2d3139',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 8,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });
    candleSeriesRef.current = candleSeries as any;

    // Add Volume Histogram Series (underneath)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay scale
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.78, // volume takes bottom 22%
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries as any;

    // Add Indicator Line Series
    vwapSeriesRef.current = chart.addSeries(LineSeries, {
      color: '#06b6d4', // Cyan
      lineWidth: 2,
      title: 'VWAP',
    }) as any;

    ema9SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#3b82f6', // Blue
      lineWidth: 1,
      title: 'EMA 9',
    }) as any;

    ema20SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#eab308', // Yellow
      lineWidth: 1,
      title: 'EMA 20',
    }) as any;

    ema50SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#f97316', // Orange
      lineWidth: 1,
      title: 'EMA 50',
    }) as any;

    ema200SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#a855f7', // Purple
      lineWidth: 2,
      title: 'EMA 200',
    }) as any;

    sma20SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#10b981',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'SMA 20',
    }) as any;

    sma50SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#6366f1',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'SMA 50',
    }) as any;

    sma200SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#ec4899',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'SMA 200',
    }) as any;

    bbUpperSeriesRef.current = chart.addSeries(LineSeries, {
      color: 'rgba(99, 102, 241, 0.6)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Upper',
    }) as any;

    bbMiddleSeriesRef.current = chart.addSeries(LineSeries, {
      color: 'rgba(99, 102, 241, 0.3)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      title: 'BB Mid',
    }) as any;

    bbLowerSeriesRef.current = chart.addSeries(LineSeries, {
      color: 'rgba(99, 102, 241, 0.6)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Lower',
    }) as any;

    // Crosshair move listener for tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData || !candleSeriesRef.current) {
        setHoverData(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeriesRef.current) as any;
      if (candleData && typeof candleData.open === 'number') {
        const date = new Date((param.time as number) * 1000);
        const timeStr = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/New_York',
        }) + ' ET';

        const change = Number((candleData.close - candleData.open).toFixed(2));
        const changePercent = Number(((change / candleData.open) * 100).toFixed(2));

        const volData = volumeSeriesRef.current ? (param.seriesData.get(volumeSeriesRef.current) as any) : null;

        setHoverData({
          time: timeStr,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData?.value || 0,
          change,
          changePercent,
        });
      }
    });

    // Responsive resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width: Math.max(width, 300) });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // 2. Fetch Candles for selected ticker and timeframe
  const loadCandleData = useCallback(async () => {
    setIsLoading(true);
    try {
      setConnectionMessage(null);
      const res = await fetchCandles(ticker, timeframe, extendedHours);
      if (res && res.candles && res.candles.length > 0) {
        setCandles(res.candles);
        setLevels(res.levels || {});
        setLivePrice(res.price);
        setLiveChange(res.change);
        setLiveChangePercent(res.changePercent);
        prevPriceRef.current = res.price;
        setMarketStatus('LIVE');
        setLastUpdateStr(res.lastSyncTime || new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' }) + ' ET');
      } else {
        setMarketStatus('DELAYED');
      }
    } catch (err) {
      console.warn('Candle fetch error:', err);
      setMarketStatus('DELAYED');
      setConnectionMessage('Reconnecting to market data...');
    } finally {
      setIsLoading(false);
    }
  }, [ticker, timeframe, extendedHours]);

  useEffect(() => {
    loadCandleData();
  }, [loadCandleData]);

  // 3. Render and Synchronize Indicators & Data onto Chart Series
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    // Convert candle data for Lightweight Chart
    const formattedCandles: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    // Volume histogram data with high-volume highlighting
    const avgVol = candles.slice(-20).reduce((acc, c) => acc + c.volume, 0) / 20;
    const formattedVolume: HistogramData<Time>[] = candles.map((c) => {
      const isUp = c.close >= c.open;
      const isSpike = c.volume > avgVol * 1.8;
      return {
        time: c.time as Time,
        value: c.volume,
        color: isSpike
          ? isUp
            ? 'rgba(16, 185, 129, 0.85)' // Bright green spike
            : 'rgba(244, 63, 94, 0.85)' // Bright red spike
          : isUp
          ? 'rgba(16, 185, 129, 0.35)'
          : 'rgba(244, 63, 94, 0.35)',
      };
    });

    candleSeriesRef.current.setData(formattedCandles);

    if (volumeSeriesRef.current) {
      if (indicators.volume) {
        volumeSeriesRef.current.setData(formattedVolume);
      } else {
        volumeSeriesRef.current.setData([]);
      }
    }

    // Apply VWAP
    if (vwapSeriesRef.current) {
      if (indicators.vwap) {
        const vwapData = calculateVWAP(candles).map((v) => ({
          time: v.time as Time,
          value: v.value,
        }));
        vwapSeriesRef.current.setData(vwapData);
      } else {
        vwapSeriesRef.current.setData([]);
      }
    }

    // Apply EMA 9
    if (ema9SeriesRef.current) {
      if (indicators.ema9) {
        const ema9Data = calculateEMA(candles, 9).map((e) => ({
          time: e.time as Time,
          value: e.value,
        }));
        ema9SeriesRef.current.setData(ema9Data);
      } else {
        ema9SeriesRef.current.setData([]);
      }
    }

    // Apply EMA 20
    if (ema20SeriesRef.current) {
      if (indicators.ema20) {
        const ema20Data = calculateEMA(candles, 20).map((e) => ({
          time: e.time as Time,
          value: e.value,
        }));
        ema20SeriesRef.current.setData(ema20Data);
      } else {
        ema20SeriesRef.current.setData([]);
      }
    }

    // Apply EMA 50
    if (ema50SeriesRef.current) {
      if (indicators.ema50) {
        const ema50Data = calculateEMA(candles, 50).map((e) => ({
          time: e.time as Time,
          value: e.value,
        }));
        ema50SeriesRef.current.setData(ema50Data);
      } else {
        ema50SeriesRef.current.setData([]);
      }
    }

    // Apply EMA 200
    if (ema200SeriesRef.current) {
      if (indicators.ema200) {
        const ema200Data = calculateEMA(candles, 200).map((e) => ({
          time: e.time as Time,
          value: e.value,
        }));
        ema200SeriesRef.current.setData(ema200Data);
      } else {
        ema200SeriesRef.current.setData([]);
      }
    }

    // Apply SMA 20
    if (sma20SeriesRef.current) {
      if (indicators.sma20) {
        const sma20Data = calculateSMA(candles, 20).map((s) => ({
          time: s.time as Time,
          value: s.value,
        }));
        sma20SeriesRef.current.setData(sma20Data);
      } else {
        sma20SeriesRef.current.setData([]);
      }
    }

    // Apply SMA 50
    if (sma50SeriesRef.current) {
      if (indicators.sma50) {
        const sma50Data = calculateSMA(candles, 50).map((s) => ({
          time: s.time as Time,
          value: s.value,
        }));
        sma50SeriesRef.current.setData(sma50Data);
      } else {
        sma50SeriesRef.current.setData([]);
      }
    }

    // Apply SMA 200
    if (sma200SeriesRef.current) {
      if (indicators.sma200) {
        const sma200Data = calculateSMA(candles, 200).map((s) => ({
          time: s.time as Time,
          value: s.value,
        }));
        sma200SeriesRef.current.setData(sma200Data);
      } else {
        sma200SeriesRef.current.setData([]);
      }
    }

    // Apply Bollinger Bands
    if (bbUpperSeriesRef.current && bbMiddleSeriesRef.current && bbLowerSeriesRef.current) {
      if (indicators.bollinger) {
        const bb = calculateBollingerBands(candles, 20, 2);
        bbUpperSeriesRef.current.setData(bb.upper.map((b) => ({ time: b.time as Time, value: b.value })));
        bbMiddleSeriesRef.current.setData(bb.middle.map((b) => ({ time: b.time as Time, value: b.value })));
        bbLowerSeriesRef.current.setData(bb.lower.map((b) => ({ time: b.time as Time, value: b.value })));
      } else {
        bbUpperSeriesRef.current.setData([]);
        bbMiddleSeriesRef.current.setData([]);
        bbLowerSeriesRef.current.setData([]);
      }
    }

    // Support and Resistance Price Lines Overlay
    priceLinesRef.current.forEach((pl) => candleSeriesRef.current?.removePriceLine(pl));
    priceLinesRef.current = [];

    if (indicators.supportResistance && candleSeriesRef.current) {
      // R1 & R2
      if (levels.r1) {
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: levels.r1,
            color: 'rgba(244, 63, 94, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `R1 $${levels.r1.toFixed(2)}`,
          })
        );
      }
      if (levels.r2) {
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: levels.r2,
            color: 'rgba(244, 63, 94, 0.5)',
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: true,
            title: `R2 $${levels.r2.toFixed(2)}`,
          })
        );
      }

      // S1 & S2
      if (levels.s1) {
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: levels.s1,
            color: 'rgba(16, 185, 129, 0.8)',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `S1 $${levels.s1.toFixed(2)}`,
          })
        );
      }
      if (levels.s2) {
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: levels.s2,
            color: 'rgba(16, 185, 129, 0.5)',
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: true,
            title: `S2 $${levels.s2.toFixed(2)}`,
          })
        );
      }

      // PDH & PDL
      if (levels.pdh) {
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: levels.pdh,
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: 1,
            axisLabelVisible: true,
            title: `PDH $${levels.pdh.toFixed(2)}`,
          })
        );
      }
      if (levels.pdl) {
        priceLinesRef.current.push(
          candleSeriesRef.current.createPriceLine({
            price: levels.pdl,
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: 1,
            axisLabelVisible: true,
            title: `PDL $${levels.pdl.toFixed(2)}`,
          })
        );
      }
    }

    // Update Current Price Line
    if (currentPriceLineRef.current && candleSeriesRef.current) {
      candleSeriesRef.current.removePriceLine(currentPriceLineRef.current);
    }
    if (candleSeriesRef.current && livePrice > 0) {
      currentPriceLineRef.current = candleSeriesRef.current.createPriceLine({
        price: livePrice,
        color: '#6366f1',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${ticker} $${livePrice.toFixed(2)}`,
      });
    }
  }, [candles, indicators, levels, livePrice, ticker]);

  // Hook into Massive WebSocket Streaming Engine
  const {
    status: massiveWsStatus,
    isDelayed: massiveIsDelayed,
    signals: massiveSignals,
    liveTrade: massiveLiveTrade,
    liveAggregate: massiveLiveAggregate,
  } = useMassiveWebSocket(ticker);

  // Derive explicit display status according to user specification
  const currentStreamStatus: 'LIVE' | 'DELAYED DATA' | 'RECONNECTING' | 'DISCONNECTED' | 'LIVE DATA UNAVAILABLE' =
    massiveIsDelayed || massiveWsStatus === 'DELAYED DATA'
      ? 'DELAYED DATA'
      : massiveWsStatus === 'LIVE'
      ? 'LIVE'
      : massiveWsStatus === 'RECONNECTING' || massiveWsStatus === 'CONNECTING' || massiveWsStatus === 'AUTHENTICATING'
      ? 'RECONNECTING'
      : massiveWsStatus === 'DISCONNECTED'
      ? 'DISCONNECTED'
      : marketStatus === 'LIVE'
      ? 'LIVE'
      : 'LIVE DATA UNAVAILABLE';

  // Sync incoming Massive WebSocket live trades/aggregates directly to chart
  useEffect(() => {
    if (massiveSignals && massiveSignals.price) {
      const p = massiveSignals.price;
      setLivePrice(p);
      const openRef = candles.length > 0 ? candles[0].open : p;
      const chg = p - openRef;
      setLiveChange(Number(chg.toFixed(2)));
      setLiveChangePercent(Number(((chg / openRef) * 100).toFixed(2)));
      setLastUpdateStr(massiveSignals.lastUpdated);
      setMarketStatus('LIVE');

      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const last = { ...prevCandles[prevCandles.length - 1] };
        last.high = Math.max(last.high, p);
        last.low = Math.min(last.low, p);
        last.close = p;
        if (massiveLiveTrade) {
          last.volume += massiveLiveTrade.size;
        }

        const updated = [...prevCandles.slice(0, -1), last];

        if (candleSeriesRef.current) {
          candleSeriesRef.current.update({
            time: last.time as Time,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
          });
        }
        if (volumeSeriesRef.current && indicators.volume) {
          volumeSeriesRef.current.update({
            time: last.time as Time,
            value: last.volume,
            color: last.close >= last.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
          });
        }
        return updated;
      });

      // Check breakout alerts
      const vwapLine = calculateVWAP(candles);
      const vwap = vwapLine.length > 0 ? vwapLine[vwapLine.length - 1].value : p;
      const alert = checkRealTimeBreakouts(
        ticker,
        p,
        prevPriceRef.current,
        levels,
        vwap,
        marketStructure.relativeVolume
      );
      if (alert) setBreakoutAlert(alert);
      prevPriceRef.current = p;
    }
  }, [massiveLiveTrade, massiveLiveAggregate, massiveSignals]);

  // 4. Real-time Live Price Streaming & Candle Aggregation (Fallback Interval)
  useEffect(() => {
    if (!isLiveSimulation || massiveWsStatus === 'LIVE') return;

    const interval = setInterval(async () => {
      // Gentle tick movement
      const jitter = (Math.random() - 0.48) * 0.18;
      const newPrice = Number((livePrice + jitter).toFixed(2));
      const newChange = Number((liveChange + jitter).toFixed(2));
      const newChangePct = Number(((newChange / (livePrice - newChange)) * 100).toFixed(2));

      setLivePrice(newPrice);
      setLiveChange(newChange);
      setLiveChangePercent(newChangePct);
      setLastUpdateStr(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/New_York',
      }) + ' ET');

      // Update latest candle surgically in series
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const last = { ...prevCandles[prevCandles.length - 1] };
        last.high = Math.max(last.high, newPrice);
        last.low = Math.min(last.low, newPrice);
        last.close = newPrice;
        last.volume += Math.floor(100 + Math.random() * 400);

        const updated = [...prevCandles.slice(0, -1), last];

        // Update Lightweight Charts series surgically without full redraw
        if (candleSeriesRef.current) {
          candleSeriesRef.current.update({
            time: last.time as Time,
            open: last.open,
            high: last.high,
            low: last.low,
            close: last.close,
          });
        }
        if (volumeSeriesRef.current && indicators.volume) {
          volumeSeriesRef.current.update({
            time: last.time as Time,
            value: last.volume,
            color: last.close >= last.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
          });
        }

        return updated;
      });

      // Check for real-time breakout alerts
      const vwapLine = calculateVWAP(candles);
      const vwap = vwapLine.length > 0 ? vwapLine[vwapLine.length - 1].value : newPrice;
      const alert = checkRealTimeBreakouts(
        ticker,
        newPrice,
        prevPriceRef.current,
        levels,
        vwap,
        marketStructure.relativeVolume
      );

      if (alert) {
        setBreakoutAlert(alert);
      }
      prevPriceRef.current = newPrice;
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveSimulation, massiveWsStatus, livePrice, liveChange, ticker, levels, marketStructure.relativeVolume, indicators.volume, candles]);

  // Chart Navigation Handlers
  const handleZoomIn = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const delta = (range.to - range.from) * 0.2;
      timeScale.setVisibleLogicalRange({
        from: range.from + delta,
        to: range.to - delta,
      });
    }
  };

  const handleZoomOut = () => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const range = timeScale.getVisibleLogicalRange();
    if (range) {
      const delta = (range.to - range.from) * 0.2;
      timeScale.setVisibleLogicalRange({
        from: Math.max(0, range.from - delta),
        to: range.to + delta,
      });
    }
  };

  const handleFitChart = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const handleResetChart = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().resetTimeScale();
    }
  };

  const handleGoToLatest = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  };

  // AI Chart Analysis Trigger
  const handleTriggerAiAnalysis = async () => {
    setIsAiModalOpen(true);
    setIsAiLoading(true);
    try {
      const vwapLine = calculateVWAP(candles);
      const vwapVal = vwapLine.length > 0 ? vwapLine[vwapLine.length - 1].value : livePrice;
      const ema9Val = calculateEMA(candles, 9).pop()?.value || livePrice;
      const ema20Val = calculateEMA(candles, 20).pop()?.value || livePrice;
      const ema50Val = calculateEMA(candles, 50).pop()?.value || livePrice;
      const ema200Val = calculateEMA(candles, 200).pop()?.value || livePrice;

      const payload = {
        ticker,
        timeframe: timeframe.toUpperCase(),
        currentPrice: livePrice,
        vwap: vwapVal,
        ema9: ema9Val,
        ema20: ema20Val,
        ema50: ema50Val,
        ema200: ema200Val,
        rsi: currentRsi,
        macd: currentMacd,
        volume: candles.length > 0 ? candles[candles.length - 1].volume : 0,
        relativeVolume: marketStructure.relativeVolume,
        supportLevels: [levels.s1 ? `$${levels.s1.toFixed(2)}` : '$508.50', levels.s2 ? `$${levels.s2.toFixed(2)}` : '$506.10'],
        resistanceLevels: [levels.r1 ? `$${levels.r1.toFixed(2)}` : '$513.40', levels.r2 ? `$${levels.r2.toFixed(2)}` : '$515.80'],
        trend: marketStructure.trend,
        marketStructure: marketStructure.structure,
        candles,
      };

      const result = await requestAIChartAnalysis(payload);
      setAiResult(result);
    } catch (err) {
      console.error('Failed to analyze chart:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const isPos = liveChange >= 0;

  return (
    <div className="bg-[#15171a] border border-[#2d3139] rounded-lg p-3 flex flex-col gap-2.5 text-[#e2e8f0] shadow-sm mb-3">
      {/* 1. TOP HEADER CONTROLS: Ticker, Live Badge, Timeframes, Indicators, Zoom & AI Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#23272f] pb-2.5">
        {/* Left: Ticker, Price, Live Status & Timezone */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-black font-mono text-white tracking-tight">
              {ticker}
            </span>
            <span
              className={`text-base md:text-lg font-black font-mono ${
                isPos ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${livePrice.toFixed(2)}
            </span>
            <span
              className={`text-xs font-bold font-mono ${
                isPos ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPos ? '+' : ''}
              {liveChange.toFixed(2)} ({isPos ? '+' : ''}
              {liveChangePercent.toFixed(2)}%)
            </span>
          </div>

          <div className="h-5 w-[1px] bg-[#2d3139] hidden sm:block" />

          {/* Live Status Badge */}
          <div className="flex items-center gap-2">
            {currentStreamStatus === 'LIVE' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                🟢 LIVE
              </span>
            ) : currentStreamStatus === 'DELAYED DATA' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold font-mono rounded" title="Massive plan provides delayed rather than real-time data">
                🟣 DELAYED DATA
              </span>
            ) : currentStreamStatus === 'RECONNECTING' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold font-mono rounded animate-pulse">
                🟡 RECONNECTING
              </span>
            ) : currentStreamStatus === 'DISCONNECTED' ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold font-mono rounded">
                🔴 DISCONNECTED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold font-mono rounded">
                🔴 LIVE DATA UNAVAILABLE
              </span>
            )}

            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              Last update: {lastUpdateStr || 'Connecting...'}
            </span>

            <span className="text-[9px] px-1.5 py-0.2 bg-[#1c1f24] text-slate-400 border border-[#2d3139] rounded font-mono">
              ET — New York
            </span>
          </div>
        </div>

        {/* Right: Timeframe Buttons, Indicators, EXT Hours & AI Analyze Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Timeframe Buttons */}
          <div className="flex items-center bg-[#1c1f24] border border-[#2d3139] rounded p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition ${
                  timeframe === tf.value
                    ? 'bg-[#6366f1] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#252830]'
                }`}
                title={`Switch to ${tf.label} Chart Timeframe`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Extended Hours Toggle */}
          <button
            onClick={() => setExtendedHours(!extendedHours)}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded border transition ${
              extendedHours
                ? 'bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/40'
                : 'bg-[#1c1f24] text-slate-400 border-[#2d3139]'
            }`}
            title="Toggle Extended Hours (Premarket 4:00 AM-9:30 AM & After-Hours 4:00 PM-8:00 PM ET)"
          >
            EXT {extendedHours ? 'ON' : 'OFF'}
          </button>

          {/* Indicators Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorMenu(!showIndicatorMenu)}
              className={`px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1 transition ${
                showIndicatorMenu
                  ? 'bg-[#6366f1] text-white border-[#6366f1]'
                  : 'bg-[#1c1f24] hover:bg-[#252830] text-slate-200 border-[#2d3139]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#818cf8]" />
              <span>Indicators</span>
            </button>

            {/* Indicator Dropdown Modal */}
            {showIndicatorMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-[#1a1d22] border border-[#3b404d] rounded-lg shadow-2xl z-50 p-2.5 text-xs select-none">
                <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-[#2b2f38] text-[10px] font-bold uppercase text-slate-400 font-mono">
                  <span>Chart Overlays & Indicators</span>
                  <button onClick={() => setShowIndicatorMenu(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-cyan-400 font-bold">VWAP (Session)</span>
                    <input
                      type="checkbox"
                      checked={indicators.vwap}
                      onChange={(e) => setIndicators({ ...indicators, vwap: e.target.checked })}
                      className="accent-[#06b6d4] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-blue-400">9 EMA</span>
                    <input
                      type="checkbox"
                      checked={indicators.ema9}
                      onChange={(e) => setIndicators({ ...indicators, ema9: e.target.checked })}
                      className="accent-[#3b82f6] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-yellow-400">20 EMA</span>
                    <input
                      type="checkbox"
                      checked={indicators.ema20}
                      onChange={(e) => setIndicators({ ...indicators, ema20: e.target.checked })}
                      className="accent-[#eab308] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-orange-400">50 EMA</span>
                    <input
                      type="checkbox"
                      checked={indicators.ema50}
                      onChange={(e) => setIndicators({ ...indicators, ema50: e.target.checked })}
                      className="accent-[#f97316] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-purple-400 font-bold">200 EMA</span>
                    <input
                      type="checkbox"
                      checked={indicators.ema200}
                      onChange={(e) => setIndicators({ ...indicators, ema200: e.target.checked })}
                      className="accent-[#a855f7] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-emerald-400">SMA (20, 50, 200)</span>
                    <input
                      type="checkbox"
                      checked={indicators.sma20}
                      onChange={(e) =>
                        setIndicators({
                          ...indicators,
                          sma20: e.target.checked,
                          sma50: e.target.checked,
                          sma200: e.target.checked,
                        })
                      }
                      className="accent-[#10b981] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-indigo-400">Bollinger Bands (20, 2)</span>
                    <input
                      type="checkbox"
                      checked={indicators.bollinger}
                      onChange={(e) => setIndicators({ ...indicators, bollinger: e.target.checked })}
                      className="accent-[#6366f1] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-slate-300">Volume Histogram</span>
                    <input
                      type="checkbox"
                      checked={indicators.volume}
                      onChange={(e) => setIndicators({ ...indicators, volume: e.target.checked })}
                      className="accent-slate-400 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 hover:bg-[#23272f] rounded cursor-pointer">
                    <span className="text-rose-400 font-bold">S/R Zones (R1-R2, S1-S2, PDH/PDL)</span>
                    <input
                      type="checkbox"
                      checked={indicators.supportResistance}
                      onChange={(e) => setIndicators({ ...indicators, supportResistance: e.target.checked })}
                      className="accent-[#f43f5e] rounded"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Zoom & Nav buttons */}
          <div className="hidden sm:flex items-center bg-[#1c1f24] border border-[#2d3139] rounded">
            <button onClick={handleZoomIn} className="p-1 hover:text-white text-slate-400" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomOut} className="p-1 hover:text-white text-slate-400 border-l border-[#2d3139]" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleFitChart} className="p-1 hover:text-white text-slate-400 border-l border-[#2d3139]" title="Fit Chart Content">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleGoToLatest} className="p-1 hover:text-white text-slate-400 border-l border-[#2d3139]" title="Scroll to Latest Candle">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ANALYZE CHART AI Button */}
          <button
            onClick={handleTriggerAiAnalysis}
            className="px-3 py-1 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white font-bold text-xs rounded shadow flex items-center gap-1.5 transition"
            title="Send structured candlestick & indicator data to Gemini AI Analyst"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ANALYZE CHART</span>
          </button>
        </div>
      </div>

      {/* 2. MARKET STRUCTURE & MULTI-TIMEFRAME ALIGNMENT SUMMARY BAR */}
      <div className="bg-[#121316] border border-[#23272f] rounded p-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: 5M Market Structure info */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-black uppercase text-[#818cf8] bg-[#6366f1]/15 px-1.5 py-0.5 rounded border border-[#6366f1]/30">
              {timeframe.toUpperCase()} MARKET STRUCTURE
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Trend:</span>
            <span
              className={`font-mono font-bold ${
                marketStructure.trend === 'Uptrend' || marketStructure.trend === 'Breakout'
                  ? 'text-emerald-400'
                  : marketStructure.trend === 'Downtrend' || marketStructure.trend === 'Breakdown'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {marketStructure.trend}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Structure:</span>
            <span className="font-mono font-semibold text-slate-200">{marketStructure.structure}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Price vs VWAP:</span>
            <span
              className={`font-mono font-bold ${
                marketStructure.priceVsVwap === 'Above'
                  ? 'text-emerald-400'
                  : marketStructure.priceVsVwap === 'Below'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {marketStructure.priceVsVwap}
            </span>
          </div>

          <div className="flex items-center gap-1.5 hidden lg:flex">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Momentum:</span>
            <span className="font-mono font-bold text-emerald-400">{marketStructure.momentum}</span>
          </div>

          <div className="flex items-center gap-1.5 hidden xl:flex">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Volume:</span>
            <span className="font-mono font-bold text-slate-200">
              {marketStructure.volumeCondition} ({marketStructure.relativeVolume}x)
            </span>
          </div>
        </div>

        {/* Right: Multi-Timeframe Alignment Score */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">Multi-Timeframe Alignment:</span>
          <span className="font-mono font-bold text-emerald-400 text-xs px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded">
            {marketStructure.overallAlignmentScore}% {marketStructure.overallBias}
          </span>
          <div className="hidden 2xl:flex items-center gap-1">
            {marketStructure.multiTimeframeAlignment.slice(0, 5).map((m) => (
              <span
                key={m.timeframe}
                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  m.bias === 'Bullish'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : m.bias === 'Bearish'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {m.timeframe}:{m.bias.slice(0, 4)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. REAL-TIME BREAKOUT ALERT BANNER (If Active) */}
      {breakoutAlert && (
        <div
          className={`p-2 rounded border flex items-center justify-between text-xs font-mono animate-fadeIn ${
            breakoutAlert.severity === 'BULLISH'
              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
              : breakoutAlert.severity === 'BEARISH'
              ? 'bg-rose-950/50 border-rose-500/60 text-rose-300'
              : 'bg-amber-950/50 border-amber-500/60 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 animate-bounce" />
            <div>
              <span className="font-black tracking-wider uppercase mr-2">[{breakoutAlert.title}]</span>
              <span>{breakoutAlert.message}</span>
            </div>
          </div>
          <button
            onClick={() => setBreakoutAlert(null)}
            className="text-slate-400 hover:text-white ml-2"
            title="Dismiss Alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. HOVER CROSSHAIR HUD TOOLTIP BAR */}
      <div className="bg-[#181a1f] border border-[#2d3139] px-3 py-1.5 rounded flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-mono">
        {hoverData ? (
          <div className="flex flex-wrap items-center gap-x-4 text-[11px]">
            <span className="text-slate-400 font-semibold">{hoverData.time}</span>
            <span>
              O: <strong className="text-white">${hoverData.open.toFixed(2)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">${hoverData.high.toFixed(2)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">${hoverData.low.toFixed(2)}</strong>
            </span>
            <span>
              C: <strong className="text-white">${hoverData.close.toFixed(2)}</strong>
            </span>
            <span>
              Vol:{' '}
              <strong className="text-slate-200">
                {hoverData.volume > 1000000
                  ? `${(hoverData.volume / 1000000).toFixed(2)}M`
                  : hoverData.volume.toLocaleString()}
              </strong>
            </span>
            <span
              className={`font-bold ${hoverData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {hoverData.change >= 0 ? '+' : ''}
              {hoverData.change.toFixed(2)} ({hoverData.changePercent.toFixed(2)}%)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Activity className="w-3.5 h-3.5 text-[#6366f1]" />
            <span>Hover cursor across candles to inspect OHLCV, session levels & VWAP</span>
          </div>
        )}

        {/* VWAP & Indicator Quick Legend */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#06b6d4]"></span>
            VWAP
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]"></span>
            EMA 9
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#eab308]"></span>
            EMA 20
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#f43f5e]"></span>
            Resistance
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
            Support
          </span>
        </div>
      </div>

      {/* 5. MAIN TRADINGVIEW CANDLESTICK CHART CONTAINER */}
      <div className="relative w-full overflow-hidden rounded border border-[#2d3139] bg-[#131518]">
        {isLoading && (
          <div className="absolute inset-0 bg-[#131518]/70 backdrop-blur-xs flex flex-col items-center justify-center z-20">
            <div className="w-7 h-7 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs font-mono font-bold text-slate-300">
              Loading {ticker} {timeframe.toUpperCase()} Candles...
            </span>
          </div>
        )}

        {/* Chart canvas mounted here */}
        <div ref={chartContainerRef} className="w-full" style={{ height: '480px' }} />
      </div>

      {/* 6. SUB-INDICATORS STRIP: RSI (14) & MACD Quick Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-[#121316] border border-[#23272f] rounded p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">RSI (14):</span>
            <span
              className={`font-black ${
                currentRsi > 70
                  ? 'text-rose-400'
                  : currentRsi < 30
                  ? 'text-emerald-400'
                  : 'text-slate-200'
              }`}
            >
              {currentRsi.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              ({currentRsi > 70 ? 'Overbought' : currentRsi < 30 ? 'Oversold' : 'Neutral Momentum'})
            </span>
          </div>
          {/* Visual RSI bar */}
          <div className="w-32 h-1.5 bg-[#23272f] rounded-full overflow-hidden relative">
            <div
              className={`h-full ${
                currentRsi > 70 ? 'bg-rose-500' : currentRsi < 30 ? 'bg-emerald-500' : 'bg-[#6366f1]'
              }`}
              style={{ width: `${currentRsi}%` }}
            />
          </div>
        </div>

        <div className="bg-[#121316] border border-[#23272f] rounded p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">MACD (12,26,9):</span>
            <span
              className={`font-black ${
                currentMacd >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {currentMacd >= 0 ? '+' : ''}
              {currentMacd.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              ({currentMacd >= 0 ? 'Bullish Histogram' : 'Bearish Momentum'})
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {marketStructure.vwapConditionText}
          </span>
        </div>
      </div>

      {/* 7. AI CHART ANALYSIS MODAL / DRAWER */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-[#16181d] border border-[#3b404d] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 md:p-6 text-[#e2e8f0]">
            <div className="flex justify-between items-start border-b border-[#2b2f38] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#6366f1]/20 border border-[#6366f1]/40 rounded-lg">
                  <Sparkles className="w-5 h-5 text-[#818cf8]" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                    {ticker} {timeframe.toUpperCase()} AI Chart Analysis
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Structured Institutional Quantitative Breakdown
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 bg-[#1f2228] hover:bg-[#2b2f38] rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-[#6366f1] border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-sm font-mono text-slate-300">
                  Synthesizing OHLC candles, VWAP, EMA stack & S/R zones...
                </span>
              </div>
            ) : aiResult ? (
              <div className="space-y-4">
                {/* AI Narrative */}
                <div className="p-3.5 bg-[#1c1f24] border-l-3 border-[#6366f1] rounded-r text-xs md:text-sm text-slate-200 leading-relaxed italic">
                  &ldquo;{aiResult.aiExplanation}&rdquo;
                </div>

                {/* Key Signals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Bullish Signals */}
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
                    <div className="text-xs font-bold uppercase text-emerald-400 mb-2 flex items-center gap-1.5 font-mono">
                      <TrendingUp className="w-4 h-4" /> Bullish Signals
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {aiResult.bullishSignals?.map((sig, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bearish Signals */}
                  <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg">
                    <div className="text-xs font-bold uppercase text-rose-400 mb-2 flex items-center gap-1.5 font-mono">
                      <TrendingDown className="w-4 h-4" /> Bearish Signals / Risks
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {aiResult.bearishSignals?.map((sig, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Levels & Triggers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-[#1c1f24] border border-[#2d3139] rounded">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Breakout Trigger</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">{aiResult.breakoutLevel}</div>
                  </div>
                  <div className="p-2 bg-[#1c1f24] border border-[#2d3139] rounded">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Breakdown Trigger</div>
                    <div className="text-xs font-black text-rose-400 mt-0.5">{aiResult.breakdownLevel}</div>
                  </div>
                  <div className="p-2 bg-[#1c1f24] border border-[#2d3139] rounded">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Momentum</div>
                    <div className="text-xs font-black text-[#818cf8] mt-0.5">{aiResult.momentum}</div>
                  </div>
                  <div className="p-2 bg-[#1c1f24] border border-[#2d3139] rounded">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Volume Conf.</div>
                    <div className="text-xs font-black text-amber-400 mt-0.5">{aiResult.volumeConfirmation}</div>
                  </div>
                </div>

                {/* Risk & Execution Disclaimer */}
                <div className="p-2.5 bg-[#14161a] border border-[#2d3139] rounded text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    Risk Profile: <strong className="text-amber-400">{aiResult.risk}</strong>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Calculated via {aiResult.source || 'MarketMind Quant Engine'}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mt-4 pt-3 border-t border-[#2b2f38] flex justify-end">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-1.5 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] text-xs font-semibold rounded text-white"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
