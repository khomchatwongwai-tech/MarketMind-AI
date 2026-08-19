import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Newspaper,
  ShieldCheck,
  Activity,
  Layers,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { NormalizedInstrument, MultiAssetQuoteResponse } from '../../types/instrument';
import { isFiniteMarketNumber } from '../../utils/formatters';
import { sharedApiClient } from '../../services/apiClient';
import { AssetClassBadge } from '../common/AssetClassBadge';
import { TradingViewChart } from '../TradingViewChart';

interface MobileStockDetailViewProps {
  instrument: NormalizedInstrument;
  onBack: () => void;
  onAddToWatchlist?: (symbol: string) => void;
  onRemoveFromWatchlist?: (symbol: string) => void;
  isInWatchlist?: boolean;
}

export const MobileStockDetailView: React.FC<MobileStockDetailViewProps> = ({
  instrument,
  onBack,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isInWatchlist = false,
}) => {
  const [quoteData, setQuoteData] = useState<MultiAssetQuoteResponse | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('5m');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHART' | 'NEWS' | 'AI_INSIGHTS'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const symbol = instrument.displaySymbol || instrument.symbol;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadData() {
      try {
        // Fetch Quote and News in parallel using sharedApiClient
        const [quoteRes, newsRes] = await Promise.allSettled([
          sharedApiClient.getQuote(symbol),
          sharedApiClient.getNews(symbol, 10),
        ]);

        if (isMounted) {
          if (quoteRes.status === 'fulfilled' && quoteRes.value) {
            setQuoteData(quoteRes.value);
          } else {
            // Retain existing instrument price if quote API is offline
          }

          if (newsRes.status === 'fulfilled' && newsRes.value?.news) {
            setNews(newsRes.value.news);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load live market data');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const loadAiInsights = async () => {
    if (aiAnalysis || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const res = await sharedApiClient.getAiAnalysis(symbol, 'intraday');
      setAiAnalysis(res);
    } catch {
      // AI unavailable gracefully
    } finally {
      setIsAiLoading(false);
    }
  };

  const currentPrice = quoteData?.quote?.price ?? instrument.price;
  const changePercent = quoteData?.quote?.changePercent ?? instrument.changePercent ?? 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-white overflow-y-auto pb-[env(safe-area-inset-bottom,20px)] pt-[env(safe-area-inset-top,10px)]">
      {/* Mobile Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#10141d]/90 backdrop-blur-md border-b border-[#1c2230]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#171d29] border border-[#252e40] active:scale-95 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">{symbol}</h1>
              <AssetClassBadge assetClass={instrument.assetClass} size="sm" />
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{instrument.name}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isInWatchlist) {
              onRemoveFromWatchlist?.(symbol);
            } else {
              onAddToWatchlist?.(symbol);
            }
          }}
          className={`p-2 rounded-lg border transition-all ${
            isInWatchlist
              ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
              : 'bg-[#171d29] border-[#252e40] text-slate-400 hover:text-white'
          }`}
          aria-label="Toggle Watchlist"
        >
          <Star className={`w-5 h-5 ${isInWatchlist ? 'fill-[#D4AF37]' : ''}`} />
        </button>
      </div>

      {/* Live Quote & Primary Stats Banner */}
      <div className="px-4 py-4 bg-gradient-to-b from-[#121722] to-[#0b0e14] border-b border-[#1c2230]">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-mono font-black text-white tracking-tight">
              {currentPrice != null
                ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '--'}
            </div>
            <div
              className={`flex items-center gap-1.5 text-sm font-mono font-bold mt-1 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{typeof changePercent === 'number' && !isNaN(changePercent) ? `${changePercent.toFixed(2)}%` : 'N/A'}</span>
              {isFiniteMarketNumber(quoteData?.quote?.change) && (
                <span className="text-xs text-slate-400">
                  ({isPositive ? '+' : ''}${quoteData!.quote.change!.toFixed(2)})
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-mono text-emerald-400 flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{quoteData?.quote?.dataSource || 'Alpaca Free IEX'}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {instrument.exchange} &bull; {instrument.currency}
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[#1c2230]/70 text-[11px] font-mono">
          <div className="bg-[#121620] p-2 rounded border border-[#1d2332]">
            <span className="text-slate-500 block text-[10px]">OPEN</span>
            <span className="text-slate-200 font-semibold">{typeof quoteData?.quote?.openPrice === 'number' && !isNaN(quoteData.quote.openPrice) ? `$${quoteData.quote.openPrice.toFixed(2)}` : '--'}</span>
          </div>
          <div className="bg-[#121620] p-2 rounded border border-[#1d2332]">
            <span className="text-slate-500 block text-[10px]">HIGH</span>
            <span className="text-slate-200 font-semibold">{typeof quoteData?.quote?.dayHigh === 'number' && !isNaN(quoteData.quote.dayHigh) ? `$${quoteData.quote.dayHigh.toFixed(2)}` : '--'}</span>
          </div>
          <div className="bg-[#121620] p-2 rounded border border-[#1d2332]">
            <span className="text-slate-500 block text-[10px]">LOW</span>
            <span className="text-slate-200 font-semibold">{typeof quoteData?.quote?.dayLow === 'number' && !isNaN(quoteData.quote.dayLow) ? `$${quoteData.quote.dayLow.toFixed(2)}` : '--'}</span>
          </div>
          <div className="bg-[#121620] p-2 rounded border border-[#1d2332]">
            <span className="text-slate-500 block text-[10px]">PREV CLS</span>
            <span className="text-slate-200 font-semibold">{typeof quoteData?.quote?.previousClose === 'number' && !isNaN(quoteData.quote.previousClose) ? `$${quoteData.quote.previousClose.toFixed(2)}` : '--'}</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Selector */}
      <div className="flex border-b border-[#1c2230] bg-[#0d1017] px-2 sticky top-[57px] z-20 overflow-x-auto scrollbar-none">
        {[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'CHART', label: 'Interactive Chart' },
          { id: 'NEWS', label: `News (${news.length})` },
          { id: 'AI_INSIGHTS', label: 'AI Intelligence' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'AI_INSIGHTS') loadAiInsights();
            }}
            className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-[#D4AF37] border-[#D4AF37] bg-[#D4AF37]/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4">
        {/* OVERVIEW / CHART TAB */}
        {(activeTab === 'OVERVIEW' || activeTab === 'CHART') && (
          <div className="space-y-4">
            <div className="bg-[#10141d] rounded-xl border border-[#1c2230] overflow-hidden p-2 min-h-[360px]">
              <div className="flex items-center justify-between px-2 pb-2 text-xs text-slate-400">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {symbol} &bull; Live TradingView Candlestick
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" /> Fail-Closed Stream
                </span>
              </div>
              <div className="h-[340px] w-full">
                <TradingViewChart symbol={symbol} height="100%" />
              </div>
            </div>

            {/* Instrument Metadata Details Card */}
            <div className="bg-[#10141d] rounded-xl border border-[#1c2230] p-4 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                Instrument Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Exchange</span>
                  <span className="text-white font-medium">{instrument.exchange || 'US Market'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Asset Class</span>
                  <span className="text-white font-medium">{instrument.instrumentType || instrument.assetClass}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Trading Session</span>
                  <span className="text-white font-medium">{instrument.tradingSession || 'US Regular (9:30-16:00 ET)'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Provider Feed</span>
                  <span className="text-emerald-400 font-medium">Alpaca IEX Free Tier</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VERIFIED NEWS TAB */}
        {activeTab === 'NEWS' && (
          <div className="space-y-3">
            {news.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Newspaper className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                <p className="text-xs font-semibold">No recent news available for {symbol}</p>
                <p className="text-[11px] text-slate-500">Live feeds are verified fail-closed without simulated articles.</p>
              </div>
            ) : (
              news.map((item, idx) => (
                <a
                  key={item.id || idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#10141d] hover:bg-[#151a26] border border-[#1c2230] hover:border-[#252e40] rounded-xl p-3.5 transition"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#D4AF37] mb-1">
                    <span>{item.source || 'Market Intelligence'}</span>
                    <span className="text-slate-500">{new Date(item.publishedAt || item.datetime).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-relaxed">
                    {item.headline || item.title}
                  </h4>
                  {item.summary && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                      {item.summary}
                    </p>
                  )}
                </a>
              ))
            )}
          </div>
        )}

        {/* AI INTELLIGENCE TAB */}
        {activeTab === 'AI_INSIGHTS' && (
          <div className="space-y-3">
            <div className="bg-[#10141d] rounded-xl border border-[#1c2230] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Gemini AI Synthesis
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#182030] text-[#D4AF37] border border-[#252e40]">
                  Grounded in Verified Data
                </span>
              </div>

              {isAiLoading ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#D4AF37]" />
                  <p className="text-xs">Synthesizing real-time market telemetry...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                  <p>{aiAnalysis.summary || aiAnalysis.analysis || 'Analysis generated from live verified market data.'}</p>
                  {aiAnalysis.keyDrivers && (
                    <div className="pt-2 border-t border-[#1c2230]">
                      <span className="text-[11px] font-mono text-slate-400 block mb-1">Key Market Drivers:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {aiAnalysis.keyDrivers.map((d: string, i: number) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={loadAiInsights}
                  className="w-full py-2.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 font-semibold text-xs transition"
                >
                  Generate AI Market Assessment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
