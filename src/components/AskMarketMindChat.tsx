import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  User,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Target,
  Clock,
  Radio,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { ComprehensiveMarketData } from '../services/marketDataService';
import { MarketAnalysisResponse, WhyMovingResponse } from '../services/geminiMarketService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  timestamp: string;
  structuredAnalysis?: MarketAnalysisResponse | null;
  whyMoving?: WhyMovingResponse | null;
  source?: string;
}

interface AskMarketMindChatProps {
  data: ComprehensiveMarketData;
  initialQuestion?: string;
}

export const AskMarketMindChat: React.FC<AskMarketMindChatProps> = ({ data, initialQuestion }) => {
  const { t, aiLanguage, language } = useI18n();
  const ticker = data.quote.ticker;
  const [mode, setMode] = useState<'beginner' | 'advanced'>('advanced');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am **MarketMind AI**, your real-time intelligent market assistant powered by Gemini.

I am actively tracking verified live market data for **${ticker}**:
- **Price**: $${data.quote.price.toFixed(2)} (${data.quote.change >= 0 ? '+' : ''}${data.quote.change.toFixed(2)} / ${data.quote.changePercent >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}%)
- **Intraday VWAP**: $${data.technicals.vwap.toFixed(2)} (${data.quote.price >= data.technicals.vwap ? 'Price is ABOVE VWAP' : 'Price is BELOW VWAP'})
- **Key Levels**: Support S1 $${data.supportResistance.s1.toFixed(2)} &bull; Resistance R1 $${data.supportResistance.r1.toFixed(2)}
- **Probabilities**: ${data.probabilities.bullish}% Bullish | ${data.probabilities.bearish}% Bearish | ${data.probabilities.neutral}% Neutral
- **Options Flow**: ${data.options.sentiment} (Put/Call: ${data.options.putCallRatio.toFixed(2)})

Ask me any question below, or use the quick buttons above to trigger a structured institutional breakdown!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET',
      source: 'MarketMind Assistant',
    },
  ]);

  const [input, setInput] = useState(initialQuestion || '');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    `Why is ${ticker} moving today?`,
    `Is ${ticker} currently bullish, bearish, or neutral?`,
    `What is the strongest resistance and support for ${ticker}?`,
    `Is ${ticker} above or below VWAP, and what does that mean?`,
    `What would confirm a bullish breakout for ${ticker}?`,
    `What would confirm a bearish breakdown?`,
    `What does the options flow and Put/Call ratio mean?`,
    `What are today's biggest market risks and catalysts?`,
    `Explain today's market setup in simple terms.`,
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external trigger if initialQuestion passed
  const initialTriggerRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialQuestion && initialQuestion !== initialTriggerRef.current) {
      initialTriggerRef.current = initialQuestion;
      if (initialQuestion.toLowerCase().includes('analyze')) {
        handleTriggerStructuredAnalysis();
      } else if (initialQuestion.toLowerCase().includes('why is')) {
        handleTriggerWhyMoving();
      } else {
        handleSend(initialQuestion);
      }
    }
  }, [initialQuestion]);

  const handleSend = async (questionText?: string) => {
    const query = (questionText || input).trim();
    if (!query || isLoading) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET';
    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: timeNow,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context memory
      const historyPayload = messages
        .filter((m) => m.text)
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text || '',
        }));

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          ticker,
          mode,
          language: aiLanguage || language || 'en',
          conversationHistory: historyPayload,
          marketData: data,
        }),
      });

      const json = await res.json();
      const aiResponseText = json.answer || 'Market analysis completed.';

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: aiResponseText,
        timestamp: json.timestamp || timeNow,
        source: json.source || 'MarketMind AI Engine',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: `**MarketMind Resilient Baseline**: ${ticker} is trading at $${data.quote.price.toFixed(2)} (${data.quote.price >= data.technicals.vwap ? 'Above' : 'Below'} VWAP $${data.technicals.vwap.toFixed(2)}). Key support sits at $${data.supportResistance.s1.toFixed(2)} and resistance at $${data.supportResistance.r1.toFixed(2)}. Risk level is ${data.probabilities.riskLevel}.`,
        timestamp: timeNow,
        source: 'MarketMind Local Engine',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Structured "ASK GEMINI TO ANALYZE" handler
  const handleTriggerStructuredAnalysis = async () => {
    if (isLoading) return;
    setActiveAction('analyze');
    setIsLoading(true);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET';
    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: `Analyze ${ticker} right now (${mode === 'beginner' ? 'Beginner Mode' : 'Advanced Institutional Mode'}).`,
      timestamp: timeNow,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          mode,
          timeframe: '5m',
          language: aiLanguage || language || 'en',
          marketData: data,
        }),
      });

      const result: MarketAnalysisResponse = await res.json();
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        structuredAnalysis: result,
        timestamp: result.timestamp || timeNow,
        source: result.source || 'Gemini 3.7 Flash Institutional Engine',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      handleSend(`Provide a complete market analysis breakdown for ${ticker}.`);
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  // Special "Why Is It Moving?" handler
  const handleTriggerWhyMoving = async () => {
    if (isLoading) return;
    setActiveAction('why-moving');
    setIsLoading(true);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET';
    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: `Why is ${ticker} moving right now?`,
      timestamp: timeNow,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai/why-moving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          mode,
          language: aiLanguage || language || 'en',
          marketData: data,
        }),
      });

      const result: WhyMovingResponse = await res.json();
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        whyMoving: result,
        timestamp: result.timestamp || timeNow,
        source: result.source || 'Gemini 3.7 Flash Driver Synthesis',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      handleSend(`Why is ${ticker} moving right now? Explain the top catalysts.`);
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Conversation cleared. I am monitoring live data for **${ticker}** ($${data.quote.price.toFixed(2)}). Ask me any question or click a prompt above.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET',
        source: 'MarketMind Assistant',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] min-h-[600px] bg-[#15171a] border border-[#2d3139] rounded-lg overflow-hidden select-none text-[#e2e8f0]">
      {/* Top Header Bar */}
      <div className="p-3 bg-[#1c1f24] border-b border-[#2d3139] flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#818cf8]">
            <BotMessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                MarketMind AI Assistant
              </h3>
              <span className="text-[9px] px-2 py-0.5 bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40 rounded-full font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3.7 Flash
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span className="text-white font-bold">{ticker}: ${data.quote.price.toFixed(2)}</span>
              <span>&bull;</span>
              <span>VWAP: ${data.technicals.vwap.toFixed(2)}</span>
              <span>&bull;</span>
              <span className="text-emerald-400">Bull {data.probabilities.bullish}%</span>
              <span>&bull;</span>
              <span className="text-slate-400">Data timestamp: {data.quote.timestamp || 'Live'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Beginner vs Advanced Mode Toggle */}
          <div className="flex items-center bg-[#15171a] p-0.5 rounded border border-[#2d3139] text-[10px] font-semibold">
            <button
              onClick={() => setMode('beginner')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                mode === 'beginner'
                  ? 'bg-[#6366f1] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Beginner Mode: Plain-English, intuitive explanations"
            >
              <BookOpen className="w-3 h-3" />
              Beginner
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                mode === 'advanced'
                  ? 'bg-[#6366f1] text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Advanced Mode: Quantitative market structure and order flow"
            >
              <SlidersHorizontal className="w-3 h-3" />
              Advanced
            </button>
          </div>

          {/* Quick Action Button: "ASK GEMINI TO ANALYZE" */}
          <button
            onClick={handleTriggerStructuredAnalysis}
            disabled={isLoading}
            className="px-2.5 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-[11px] font-bold rounded flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            title="Generate a full structured institutional market analysis"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Ask Gemini to Analyze</span>
          </button>

          {/* Quick Action Button: "Why Is It Moving?" */}
          <button
            onClick={handleTriggerWhyMoving}
            disabled={isLoading}
            className="px-2.5 py-1.5 bg-[#252830] hover:bg-[#2e323d] border border-[#6366f1]/40 text-slate-200 hover:text-white text-[11px] font-bold rounded flex items-center gap-1.5 transition disabled:opacity-50"
            title="Synthesize the top catalysts and market drivers"
          >
            <Radio className="w-3 h-3 text-[#818cf8]" />
            <span>Why Is It Moving?</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#2d3139] rounded transition"
            title="Clear Conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Questions Pills Bar */}
      <div className="p-2 bg-[#121316] border-b border-[#2d3139] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0 pl-1">
          Suggested:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#1c1f24] hover:bg-[#252830] border border-[#2d3139] hover:border-[#6366f1] text-[11px] font-medium text-slate-300 hover:text-white rounded whitespace-nowrap transition disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';

          return (
            <div key={m.id} className={`flex gap-2.5 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                  isAi
                    ? 'bg-[#6366f1]/20 border-[#6366f1]/40 text-[#818cf8]'
                    : 'bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]'
                }`}
              >
                {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3.5 rounded-lg max-w-[90%] md:max-w-[80%] leading-relaxed ${
                  isAi
                    ? 'bg-[#1c1f24] border border-[#2d3139] text-slate-200 shadow-sm'
                    : 'bg-[#6366f1] text-white font-medium'
                }`}
              >
                {/* Header Metadata */}
                <div className="flex justify-between items-center text-[9px] text-slate-400 mb-1.5 pb-1 border-b border-[#2d3139]/60">
                  <span className="font-bold uppercase tracking-wider text-slate-300">
                    {isAi ? m.source || 'MarketMind AI Assistant' : 'You (Trader)'}
                  </span>
                  <span className="font-mono">{m.timestamp}</span>
                </div>

                {/* 1. STRUCTURED MARKET ANALYSIS CARD */}
                {m.structuredAnalysis ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded font-mono font-black uppercase border ${
                            m.structuredAnalysis.bias === 'bullish'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : m.structuredAnalysis.bias === 'bearish'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {m.structuredAnalysis.bias.toUpperCase()} BIAS
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {m.structuredAnalysis.confidenceExplanation}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase font-mono font-bold text-slate-400 px-1.5 py-0.5 bg-[#121316] rounded border border-[#2d3139]">
                        Risk: {m.structuredAnalysis.risk}
                      </span>
                    </div>

                    <p className="text-xs text-white leading-relaxed font-sans bg-[#121316]/60 p-2.5 rounded border border-[#2d3139]">
                      {m.structuredAnalysis.summary}
                    </p>

                    {/* Factors Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                        <div className="font-bold text-emerald-400 uppercase text-[9px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Bullish Factors
                        </div>
                        <ul className="space-y-1 list-disc pl-3.5 text-slate-200">
                          {m.structuredAnalysis.bullishFactors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/40 space-y-1">
                        <div className="font-bold text-rose-400 uppercase text-[9px] flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Bearish Risks
                        </div>
                        <ul className="space-y-1 list-disc pl-3.5 text-slate-200">
                          {m.structuredAnalysis.bearishFactors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Support & Resistance Pills */}
                    <div className="p-2 bg-[#121316] rounded border border-[#2d3139] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-emerald-400 font-bold uppercase">Support:</span>
                        {m.structuredAnalysis.support.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.2 bg-emerald-900/30 text-emerald-300 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-rose-400 font-bold uppercase">Resistance:</span>
                        {m.structuredAnalysis.resistance.map((r, i) => (
                          <span key={i} className="px-1.5 py-0.2 bg-rose-900/30 text-rose-300 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Confirmation & Invalidation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 bg-[#121316] rounded border-l-2 border-emerald-500">
                        <span className="font-bold text-emerald-400 uppercase block mb-0.5">Confirmation Trigger:</span>
                        <span className="text-slate-300">{m.structuredAnalysis.confirmation}</span>
                      </div>
                      <div className="p-2 bg-[#121316] rounded border-l-2 border-rose-500">
                        <span className="font-bold text-rose-400 uppercase block mb-0.5">Invalidation Trigger:</span>
                        <span className="text-slate-300">{m.structuredAnalysis.invalidation}</span>
                      </div>
                    </div>

                    {/* What to Watch Next */}
                    <div className="p-2 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded flex items-center gap-2 text-[11px] text-slate-200">
                      <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <div>
                        <strong className="text-white">Watch Next:</strong> {m.structuredAnalysis.watchNext}
                      </div>
                    </div>
                  </div>
                ) : m.whyMoving ? (
                  /* 2. SPECIAL "WHY IS IT MOVING" DRIVER CARD */
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Radio className="w-4 h-4 text-[#818cf8] animate-pulse" />
                      <span>{m.whyMoving.headline}</span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed italic bg-[#121316] p-2.5 rounded border border-[#2d3139]">
                      &ldquo;{m.whyMoving.summary}&rdquo;
                    </p>

                    <div className="space-y-1.5">
                      {m.whyMoving.drivers.map((d, i) => (
                        <div
                          key={i}
                          className="p-2 bg-[#121316] rounded border border-[#2d3139] flex items-start gap-2 text-[11px]"
                        >
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 ${
                              d.impact === 'Bullish'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : d.impact === 'Bearish'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {d.impact}
                          </span>
                          <div>
                            <span className="font-bold text-white mr-1.5">{d.category}:</span>
                            <span className="text-slate-300">{d.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Key Levels Footer */}
                    <div className="p-2 bg-[#1c1f24] rounded border border-[#2d3139] flex justify-between items-center text-[10px] font-mono">
                      <span>Support: <strong className="text-emerald-400">{m.whyMoving.keyLevels.support}</strong></span>
                      <span>VWAP: <strong className="text-white">{m.whyMoving.keyLevels.vwap}</strong></span>
                      <span>Resistance: <strong className="text-rose-400">{m.whyMoving.keyLevels.resistance}</strong></span>
                    </div>
                  </div>
                ) : (
                  /* 3. STANDARD CONVERSATIONAL TEXT RESPONSE */
                  <div className="whitespace-pre-line font-sans leading-relaxed text-xs">
                    {m.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="p-3.5 rounded-lg bg-[#1c1f24] border border-[#2d3139] text-slate-300 text-xs flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-ping" />
              <span>
                {activeAction === 'analyze'
                  ? `Gemini AI analyzing structured technicals, order flow & support/resistance for ${ticker}...`
                  : activeAction === 'why-moving'
                  ? `Gemini AI synthesizing multi-factor catalysts, macro yields & sector breadth for ${ticker}...`
                  : `Gemini AI processing market context and generating probabilistic response...`}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-[#1c1f24] border-t border-[#2d3139] flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${ticker}'s setup, VWAP hold, support/resistance, macro risks, or options flow...`}
          className="flex-1 bg-[#15171a] border border-[#2d3139] focus:border-[#6366f1] rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>

      {/* Required Financial Risk & Informational Disclaimer */}
      <div className="px-3 py-1.5 bg-[#121316] border-t border-[#2d3139] text-[9.5px] text-slate-400 text-center flex items-center justify-center gap-1">
        <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
        <span>
          Gemini-powered market analysis is provided for informational and educational purposes. Market predictions may be incorrect and should not be treated as guaranteed financial advice.
        </span>
      </div>
    </div>
  );
};
