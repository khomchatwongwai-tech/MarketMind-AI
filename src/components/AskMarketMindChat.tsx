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
  Crown,
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
      text: `Welcome to **MarketMind AI Assistant** — your real-time institutional quantitative market intelligence terminal.

I am actively tracking verified live market data for **${ticker}**:
- **Price**: $${data.quote.price.toFixed(2)} (${data.quote.change >= 0 ? '+' : ''}${data.quote.change.toFixed(2)} / ${data.quote.changePercent >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}%)
- **Intraday VWAP**: $${data.technicals.vwap.toFixed(2)} (${data.quote.price >= data.technicals.vwap ? 'Price is ABOVE VWAP' : 'Price is BELOW VWAP'})
- **Key Levels**: Support S1 $${data.supportResistance.s1.toFixed(2)} &bull; Resistance R1 $${data.supportResistance.r1.toFixed(2)}
- **Probabilities**: ${data.probabilities.bullish}% Bullish | ${data.probabilities.bearish}% Bearish | ${data.probabilities.neutral}% Neutral
- **Options Flow**: ${data.options.sentiment} (Put/Call: ${data.options.putCallRatio.toFixed(2)})

Ask any question below or trigger an instant institutional scenario breakdown!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET',
      source: 'MarketMind AI Terminal',
    },
  ]);

  const [input, setInput] = useState(initialQuestion || '');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    `Why is ${ticker} moving today?`,
    `What are the verified news catalysts and SEC filings for ${ticker}?`,
    `What did the latest Federal Reserve & CPI releases report?`,
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
        source: json.source || 'MarketMind Quantitative Engine',
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
        source: result.source || 'Gemini 2.5 Institutional Engine',
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
        source: result.source || 'Gemini 2.5 Driver Synthesis',
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
        text: `Conversation cleared. I am actively monitoring live data for **${ticker}** ($${data.quote.price.toFixed(2)}). Ask any question or select a quick query below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ET',
        source: 'MarketMind AI Terminal',
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] min-h-[600px] bg-[#0A0A0A] border border-[#242424] rounded-xl overflow-hidden select-none text-[#E5E5E5] shadow-2xl">
      {/* Top Header Bar */}
      <div className="p-3.5 bg-[#101010] border-b border-[#1C1C1C] flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#151515] border border-[rgba(212,175,55,0.4)] flex items-center justify-center text-[#D4AF37] shadow-sm">
            <BotMessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                MarketMind AI Assistant
              </h3>
              <span className="text-[9px] px-2 py-0.5 bg-[#151515] text-[#F2D675] border border-[#D4AF37]/40 rounded-md font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
                Gemini 2.5 Active
              </span>
            </div>
            <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5 flex items-center gap-2">
              <span className="text-white font-bold">{ticker}: ${data.quote.price.toFixed(2)}</span>
              <span>&bull;</span>
              <span>VWAP: ${data.technicals.vwap.toFixed(2)}</span>
              <span>&bull;</span>
              <span className={data.probabilities.bullish >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                {data.probabilities.bullish}% Bullish
              </span>
              <span>&bull;</span>
              <span className="text-[#9CA3AF]">Data: {data.quote.timestamp || 'Live'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Beginner vs Advanced Mode Toggle */}
          <div className="flex items-center bg-[#050505] p-0.5 rounded-lg border border-[#242424] text-[10px] font-semibold">
            <button
              onClick={() => setMode('beginner')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                mode === 'beginner'
                  ? 'bg-[#151515] text-[#F2D675] border border-[#D4AF37]/50 shadow-sm font-bold'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
              title="Beginner Mode: Plain-English, intuitive explanations"
            >
              <BookOpen className="w-3 h-3" />
              Beginner
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                mode === 'advanced'
                  ? 'bg-[#151515] text-[#F2D675] border border-[#D4AF37]/50 shadow-sm font-bold'
                  : 'text-[#9CA3AF] hover:text-white'
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
            className="px-3 py-1.5 bg-[#151515] hover:bg-[#202020] border border-[#D4AF37]/50 text-[#F2D675] hover:text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            title="Generate a full structured institutional market analysis"
          >
            <Zap className="w-3 h-3 text-[#D4AF37]" />
            <span>Ask AI to Analyze</span>
          </button>

          {/* Quick Action Button: "Why Is It Moving?" */}
          <button
            onClick={handleTriggerWhyMoving}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#101010] hover:bg-[#181818] border border-[#242424] text-[#E5E5E5] hover:text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            title="Synthesize the top catalysts and market drivers"
          >
            <Radio className="w-3 h-3 text-[#D4AF37]" />
            <span>Why Is It Moving?</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={handleReset}
            className="p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#151515] rounded-lg transition border border-transparent hover:border-[#242424]"
            title="Clear Conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Questions Pills Bar */}
      <div className="p-2.5 bg-[#050505] border-b border-[#1C1C1C] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest shrink-0 pl-1">
          Quick Prompts:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-[#101010] hover:bg-[#181818] border border-[#242424] hover:border-[#D4AF37]/50 text-[11px] font-medium text-[#D1D5DB] hover:text-white rounded-md whitespace-nowrap transition disabled:opacity-50 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => {
          const isAi = m.sender === 'ai';

          return (
            <div key={m.id} className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                  isAi
                    ? 'bg-[#151515] border-[rgba(212,175,55,0.4)] text-[#D4AF37]'
                    : 'bg-[#101010] border-[#242424] text-white'
                }`}
              >
                {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-4 rounded-xl max-w-[90%] md:max-w-[80%] leading-relaxed ${
                  isAi
                    ? 'bg-[#101010] border border-[#242424] text-[#E5E5E5] shadow-md'
                    : 'bg-[#151515] border border-[#D4AF37]/50 text-white font-medium shadow-md'
                }`}
              >
                {/* Header Metadata */}
                <div className="flex justify-between items-center text-[9px] text-[#9CA3AF] mb-2 pb-1.5 border-b border-[#1C1C1C]">
                  <span className="font-bold uppercase tracking-wider text-[#F2D675] font-mono">
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
                          className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-black uppercase border ${
                            m.structuredAnalysis.bias === 'bullish'
                              ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                              : m.structuredAnalysis.bias === 'bearish'
                              ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
                              : 'bg-[#D4AF37]/10 text-[#F2D675] border-[#D4AF37]/30'
                          }`}
                        >
                          {m.structuredAnalysis.bias.toUpperCase()} BIAS
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          {m.structuredAnalysis.confidenceExplanation}
                        </span>
                      </div>
                      <span className="text-[9px] uppercase font-mono font-bold text-[#9CA3AF] px-2 py-0.5 bg-[#050505] rounded-md border border-[#242424]">
                        Risk: {m.structuredAnalysis.risk}
                      </span>
                    </div>

                    <p className="text-xs text-white leading-relaxed font-sans bg-[#050505] p-3 rounded-lg border border-[#1C1C1C]">
                      {m.structuredAnalysis.summary}
                    </p>

                    {/* Factors Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div className="p-3 rounded-lg bg-[#050505] border border-[#22C55E]/30 space-y-1.5">
                        <div className="font-bold text-[#22C55E] uppercase text-[9px] flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Bullish Drivers
                        </div>
                        <ul className="space-y-1 list-disc pl-3.5 text-[#E5E5E5]">
                          {m.structuredAnalysis.bullishFactors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-[#050505] border border-[#EF4444]/30 space-y-1.5">
                        <div className="font-bold text-[#EF4444] uppercase text-[9px] flex items-center gap-1 font-mono">
                          <XCircle className="w-3 h-3" /> Bearish Risks
                        </div>
                        <ul className="space-y-1 list-disc pl-3.5 text-[#E5E5E5]">
                          {m.structuredAnalysis.bearishFactors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Support & Resistance Pills */}
                    <div className="p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-1 text-[#9CA3AF]">
                        <span className="text-[#22C55E] font-bold uppercase">Support:</span>
                        {m.structuredAnalysis.support.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-[#9CA3AF]">
                        <span className="text-[#EF4444] font-bold uppercase">Resistance:</span>
                        {m.structuredAnalysis.resistance.map((r, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Confirmation & Invalidation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2.5 bg-[#050505] rounded-lg border-l-2 border-[#22C55E] border-y border-r border-[#1C1C1C]">
                        <span className="font-bold text-[#22C55E] uppercase block mb-0.5 font-mono">Confirmation Trigger:</span>
                        <span className="text-[#E5E5E5]">{m.structuredAnalysis.confirmation}</span>
                      </div>
                      <div className="p-2.5 bg-[#050505] rounded-lg border-l-2 border-[#EF4444] border-y border-r border-[#1C1C1C]">
                        <span className="font-bold text-[#EF4444] uppercase block mb-0.5 font-mono">Invalidation Trigger:</span>
                        <span className="text-[#E5E5E5]">{m.structuredAnalysis.invalidation}</span>
                      </div>
                    </div>

                    {/* What to Watch Next */}
                    <div className="p-2.5 bg-[#151515] border border-[#D4AF37]/40 rounded-lg flex items-center gap-2 text-[11px] text-[#E5E5E5]">
                      <Zap className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <div>
                        <strong className="text-[#F2D675]">Catalyst to Watch:</strong> {m.structuredAnalysis.watchNext}
                      </div>
                    </div>
                  </div>
                ) : m.whyMoving ? (
                  /* 2. SPECIAL "WHY IS IT MOVING" DRIVER CARD */
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                      <Radio className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                      <span>{m.whyMoving.headline}</span>
                    </div>

                    <p className="text-xs text-[#E5E5E5] leading-relaxed italic bg-[#050505] p-3 rounded-lg border border-[#1C1C1C]">
                      &ldquo;{m.whyMoving.summary}&rdquo;
                    </p>

                    <div className="space-y-1.5">
                      {m.whyMoving.drivers.map((d, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-[#050505] rounded-lg border border-[#1C1C1C] flex items-start gap-2 text-[11px]"
                        >
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 font-mono ${
                              d.impact === 'Bullish'
                                ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                                : d.impact === 'Bearish'
                                ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
                                : 'bg-[#151515] text-[#9CA3AF] border border-[#242424]'
                            }`}
                          >
                            {d.impact}
                          </span>
                          <div>
                            <span className="font-bold text-white mr-1.5">{d.category}:</span>
                            <span className="text-[#E5E5E5]">{d.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Key Levels Footer */}
                    <div className="p-2 bg-[#050505] rounded-lg border border-[#1C1C1C] flex justify-between items-center text-[10px] font-mono">
                      <span>Support: <strong className="text-[#22C55E]">{m.whyMoving.keyLevels.support}</strong></span>
                      <span>VWAP: <strong className="text-white">{m.whyMoving.keyLevels.vwap}</strong></span>
                      <span>Resistance: <strong className="text-[#EF4444]">{m.whyMoving.keyLevels.resistance}</strong></span>
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
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg bg-[#151515] border border-[rgba(212,175,55,0.4)] text-[#D4AF37] flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="p-3.5 rounded-xl bg-[#101010] border border-[#242424] text-[#9CA3AF] text-xs flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping" />
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
        className="p-3 bg-[#101010] border-t border-[#1C1C1C] flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${ticker}'s setup, VWAP hold, support/resistance, macro catalysts, or options flow...`}
          className="flex-1 bg-[#050505] border border-[#242424] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-[#6B7280] focus:outline-none transition shadow-inner font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#FFE08A] hover:to-[#D4AF37] text-black font-black text-xs rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 shadow-md"
        >
          <Send className="w-3.5 h-3.5 text-black" />
          <span>Ask</span>
        </button>
      </form>

      {/* Required Financial Risk & Informational Disclaimer */}
      <div className="px-3 py-1.5 bg-[#050505] border-t border-[#1C1C1C] text-[9.5px] text-[#9CA3AF] text-center flex items-center justify-center gap-1.5 font-mono">
        <ShieldCheck className="w-3 h-3 text-[#D4AF37] shrink-0" />
        <span>
          Gemini-powered market analysis is provided for informational and educational purposes. Market predictions may be incorrect and do not constitute financial advice.
        </span>
      </div>
    </div>
  );
};
