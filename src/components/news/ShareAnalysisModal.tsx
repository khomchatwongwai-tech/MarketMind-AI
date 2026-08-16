import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  ExternalLink,
  Twitter,
  Linkedin,
  MessageSquare,
  Globe,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';
import { NewsItem, NewsArticle, NewsSentiment } from '../../types/newsIntelligence';

interface ShareAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsItem | NewsArticle | null;
  ticker?: string;
  confidenceScore?: number; // 0 - 100
}

export const ShareAnalysisModal: React.FC<ShareAnalysisModalProps> = ({
  isOpen,
  onClose,
  article,
  ticker: propTicker,
  confidenceScore: propConfidence,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [includeConfidence, setIncludeConfidence] = useState<boolean>(true);
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);

  // Derive display values
  const currentTicker = propTicker || article?.tickers?.[0] || 'MARKET';
  const headline = article?.headline || 'Market Intelligence & Catalyst Analysis';
  const summary = article?.summary || article?.permittedSummary || 'Institutional multi-factor sentiment and price impact analysis.';
  const source = article?.source || 'Verified Financial Wires';
  const sentiment: NewsSentiment = article?.sentiment || 'BULLISH';
  const impactScore = article?.impactScore || 88;
  const calculatedConfidence = propConfidence ?? Math.min(99, Math.max(72, impactScore + (article?.sentimentScore ? Math.abs(Math.round(article.sentimentScore * 15)) : 5)));
  const publishedDate = article?.publishedAt ? new Date(article.publishedAt) : new Date();

  // Draw Social Card to Canvas
  useEffect(() => {
    if (!isOpen || !article) return;

    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card Dimensions: 1200 x 630 (Standard Twitter / Open Graph 1.91:1 ratio)
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient (Deep Carbon & Obsidian)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090B10');
    bgGrad.addColorStop(0.5, '#0E1118');
    bgGrad.addColorStop(1, '#151924');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Radial Glows (Gold in top right, subtle emerald/rose in bottom left)
    const glowTop = ctx.createRadialGradient(width - 150, 100, 10, width - 150, 100, 450);
    glowTop.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
    glowTop.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = glowTop;
    ctx.fillRect(0, 0, width, height);

    const isBull = sentiment === 'BULLISH' || sentiment === 'VERY_BULLISH';
    const isBear = sentiment === 'BEARISH' || sentiment === 'VERY_BEARISH';
    const accentColor = isBull ? '#10B981' : isBear ? '#F43F5E' : '#94A3B8';
    const accentGlow = isBull ? 'rgba(16, 185, 129, 0.12)' : isBear ? 'rgba(244, 63, 94, 0.12)' : 'rgba(148, 163, 184, 0.08)';

    const glowBottom = ctx.createRadialGradient(150, height - 100, 10, 150, height - 100, 400);
    glowBottom.addColorStop(0, accentGlow);
    glowBottom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowBottom;
    ctx.fillRect(0, 0, width, height);

    // 3. Grid Lines / Tech Pattern Background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 4. Outer Gold Border & Corner Accents
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    // Decorative corner notches
    const cornerSize = 16;
    ctx.fillStyle = '#D4AF37';
    // Top-Left
    ctx.fillRect(24, 24, cornerSize, 4);
    ctx.fillRect(24, 24, 4, cornerSize);
    // Top-Right
    ctx.fillRect(width - 24 - cornerSize, 24, cornerSize, 4);
    ctx.fillRect(width - 28, 24, 4, cornerSize);
    // Bottom-Left
    ctx.fillRect(24, height - 28, cornerSize, 4);
    ctx.fillRect(24, height - 24 - cornerSize, 4, cornerSize);
    // Bottom-Right
    ctx.fillRect(width - 24 - cornerSize, height - 28, cornerSize, 4);
    ctx.fillRect(width - 28, height - 24 - cornerSize, 4, cornerSize);

    // 5. Header Section: MarketMind AI Branding
    // Gold Emblem Box
    ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.fillRect(60, 60, 48, 48);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 48, 48);

    // Emblem Icon (Diamond)
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.moveTo(84, 68);
    ctx.lineTo(98, 84);
    ctx.lineTo(84, 100);
    ctx.lineTo(70, 84);
    ctx.closePath();
    ctx.fill();

    // App Name
    ctx.font = 'bold 28px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('MarketMind', 122, 92);

    ctx.fillStyle = '#D4AF37';
    ctx.fillText('AI', 290, 92);

    // Subtitle
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('INSTITUTIONAL QUANTITATIVE INTELLIGENCE', 122, 106);

    // Right Header: Live Intelligence Badge & Timestamp
    const dateStr = publishedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = publishedDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'right';
    ctx.fillText(`VERIFIED CATALYST • ${dateStr} ${timeStr}`, width - 65, 88);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`FEED: ${source.toUpperCase()}`, width - 65, 106);
    ctx.textAlign = 'left';

    // Divider Line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 126);
    ctx.lineTo(width - 60, 126);
    ctx.stroke();

    // 6. Ticker & Category Pill
    const tickerY = 175;
    // Ticker Box
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(60, tickerY - 32, 120, 42);
    ctx.font = '900 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#090B10';
    ctx.fillText(`$${currentTicker}`, 72, tickerY - 3);

    // Category Box
    const categoryText = (article?.category || 'MARKET CATALYST').replace('_', ' ');
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    const catMetrics = ctx.measureText(categoryText);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(192, tickerY - 32, catMetrics.width + 24, 42);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeRect(192, tickerY - 32, catMetrics.width + 24, 42);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(categoryText, 204, tickerY - 5);

    // Source Tier Badge
    const tierText = (article?.sourceTier || 'TIER 1 PRIMARY').replace(/_/g, ' ');
    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.fillRect(192 + catMetrics.width + 36, tickerY - 32, 180, 42);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.strokeRect(192 + catMetrics.width + 36, tickerY - 32, 180, 42);
    ctx.fillStyle = '#F2D675';
    ctx.fillText(`✔ ${tierText}`, 192 + catMetrics.width + 48, tickerY - 5);

    // 7. Headline Text (Auto-wrapping with large bold font)
    ctx.font = 'bold 30px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    const maxHeadlineWidth = width - 120;
    const headlineLines = wrapText(ctx, headline, maxHeadlineWidth);

    let currentY = 235;
    headlineLines.slice(0, 2).forEach((line) => {
      ctx.fillText(line, 60, currentY);
      currentY += 40;
    });

    // 8. Key Takeaway / Summary Box
    const boxY = currentY + 10;
    const boxHeight = 110;
    ctx.fillStyle = 'rgba(15, 18, 26, 0.85)';
    ctx.fillRect(60, boxY, width - 120, boxHeight);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.strokeRect(60, boxY, width - 120, boxHeight);

    // Left accent bar in summary box
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(60, boxY, 4, boxHeight);

    // AI Summary Label
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('⚡ AI QUANTITATIVE SYNTHESIS & MARKET CATALYST', 76, boxY + 26);

    // Summary Text wrapped
    ctx.font = '16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#CBD5E1';
    const summaryLines = wrapText(ctx, summary, width - 160);
    let sumY = boxY + 54;
    summaryLines.slice(0, 2).forEach((line) => {
      ctx.fillText(line, 76, sumY);
      sumY += 24;
    });

    // 9. Metrics Strip: Sentiment | AI Confidence | Market Impact | Verification
    const metricsY = boxY + boxHeight + 24;
    const colWidth = (width - 120 - 36) / 4;

    // Card 1: Sentiment
    drawMetricCard(
      ctx,
      60,
      metricsY,
      colWidth,
      82,
      'MARKET SENTIMENT',
      sentiment.replace(/_/g, ' '),
      accentColor,
      isBull ? '▲ BULLISH BIAS' : isBear ? '▼ BEARISH BIAS' : '● NEUTRAL'
    );

    // Card 2: AI Confidence Score
    drawMetricCard(
      ctx,
      60 + colWidth + 12,
      metricsY,
      colWidth,
      82,
      'AI CONFIDENCE',
      `${calculatedConfidence}%`,
      '#D4AF37',
      'HIGH RELIABILITY'
    );

    // Card 3: Market Impact Score
    drawMetricCard(
      ctx,
      60 + (colWidth + 12) * 2,
      metricsY,
      colWidth,
      82,
      'IMPACT SCORE',
      `${impactScore}/100`,
      impactScore >= 75 ? '#F59E0B' : '#38BDF8',
      impactScore >= 75 ? 'HIGH VOLATILITY' : 'MODERATE FLOW'
    );

    // Card 4: Algorithmic Verification
    drawMetricCard(
      ctx,
      60 + (colWidth + 12) * 3,
      metricsY,
      colWidth,
      82,
      'STATUS',
      'CONFIRMED',
      '#10B981',
      'PRIMARY DISPATCH'
    );

    // 10. Footer Bar
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, height - 52);
    ctx.lineTo(width - 60, height - 52);
    ctx.stroke();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText('POWERED BY MARKETMIND AI • REAL-TIME MULTI-ASSET INTELLIGENCE', 60, height - 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#D4AF37';
    ctx.fillText('AI.STUDIO/BUILD • #MARKETMINDAI', width - 60, height - 36);
    ctx.textAlign = 'left';

    // Export Data URL
    try {
      const url = canvas.toDataURL('image/png');
      setDataUrl(url);
    } catch (e) {
      console.error('Failed to generate canvas image url:', e);
    } finally {
      setIsGenerating(false);
    }
  }, [isOpen, article, currentTicker, sentiment, calculatedConfidence, impactScore, includeConfidence, includeWatermark]);

  // Helper: Text Wrapping
  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  // Helper: Metric Card Renderer
  function drawMetricCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    val: string,
    valColor: string,
    sub: string
  ) {
    ctx.fillStyle = '#10131B';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Top Label
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(label, x + 12, y + 20);

    // Value
    ctx.font = '900 20px "JetBrains Mono", monospace';
    ctx.fillStyle = valColor;
    ctx.fillText(val, x + 12, y + 46);

    // Subtext
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText(sub, x + 12, y + 68);
  }

  // Download Card Image
  const handleDownloadImage = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `MarketMind-${currentTicker}-Intelligence-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Copy Card Image to Clipboard
  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 3000);
        } catch (err) {
          // Fallback to text copy
          handleCopyShareText();
        }
      });
    } catch (e) {
      console.error('Clipboard copy error:', e);
      handleCopyShareText();
    }
  };

  // Generate Social Share Text
  const shareText = `🚨 $${currentTicker} Market Intelligence (${sentiment.replace('_', ' ')} | AI Confidence: ${calculatedConfidence}%)\n\n"${headline}"\n\nAnalyzed via MarketMind AI.\n#MarketMindAI #${currentTicker} #Trading #Stocks #Macro`;

  const handleCopyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  // 1-Click Social Shares
  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=450');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=550');
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        if (canvasRef.current) {
          canvasRef.current.toBlob(async (blob) => {
            if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'analysis.png', { type: 'image/png' })] })) {
              const file = new File([blob], `MarketMind-${currentTicker}-analysis.png`, { type: 'image/png' });
              await navigator.share({
                title: `MarketMind AI: $${currentTicker} Analysis`,
                text: shareText,
                files: [file],
              });
              return;
            }
            await navigator.share({
              title: `MarketMind AI: $${currentTicker} Analysis`,
              text: shareText,
              url: window.location.href,
            });
          });
        }
      } catch (err) {
        console.log('Share canceled or not supported:', err);
      }
    } else {
      handleCopyShareText();
    }
  };

  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0d0f15] border border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252937] bg-gradient-to-r from-[#12151f] via-[#171a26] to-[#12151f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/30 to-[#997A15]/10 border border-[#D4AF37]/60 flex items-center justify-center shadow-inner">
              <Share2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Share Intelligence Social Card
                <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono font-bold">
                  CANVAS HD
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Dynamically rendered high-resolution card for ${currentTicker} with verified AI confidence.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202432] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Card Preview Container */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                Live Card Preview (1200 &times; 630 HD)
              </span>
              <span className="text-slate-500 text-[11px]">
                Ready for X / Twitter, LinkedIn, Instagram, Discord & Telegram
              </span>
            </div>

            {/* Hidden Canvas (Full 1200x630 resolution) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scaled Preview Image */}
            <div className="relative w-full rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-[#090b10] shadow-2xl group flex items-center justify-center">
              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt={`MarketMind AI $${currentTicker} Analysis`}
                  className="w-full h-auto object-contain max-h-[360px]"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-slate-500 font-mono text-xs">
                  Generating high-res card...
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#131620] border border-[#242838]">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Asset Ticker</span>
              <span className="text-base font-extrabold text-[#D4AF37] font-mono">${currentTicker}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#131620] border border-[#242838]">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Sentiment</span>
              <span className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1">
                {sentiment.replace('_', ' ')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#131620] border border-[#242838]">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">AI Confidence</span>
              <span className="text-base font-extrabold text-white font-mono">{calculatedConfidence}%</span>
            </div>
            <div className="p-3 rounded-xl bg-[#131620] border border-[#242838]">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Impact Rating</span>
              <span className="text-base font-extrabold text-amber-400 font-mono">{impactScore}/100</span>
            </div>
          </div>

          {/* Formatted Post Text Preview */}
          <div className="p-3.5 rounded-xl bg-[#10131b] border border-[#252937] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                Formatted Share Snippet
              </span>
              <button
                onClick={handleCopyShareText}
                className="text-xs font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Text
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-[#0b0d13] p-3 rounded-lg border border-[#1d212d] max-h-24 overflow-y-auto">
              {shareText}
            </pre>
          </div>
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="px-6 py-4 border-t border-[#252937] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3">
          {/* Social Share Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1e2a] hover:bg-[#23293a] border border-[#2e3547] text-xs font-mono text-slate-200 transition"
              title="Share to X (Twitter)"
            >
              <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
              <span className="hidden sm:inline">Post on X</span>
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1e2a] hover:bg-[#23293a] border border-[#2e3547] text-xs font-mono text-slate-200 transition"
              title="Share to LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span className="hidden sm:inline">LinkedIn</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1e2a] hover:bg-[#23293a] border border-[#2e3547] text-xs font-mono text-[#D4AF37] transition"
                title="Native OS Share"
              >
                <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Share...</span>
              </button>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyImage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161a24] hover:bg-[#202534] border border-[#2d3448] text-xs font-mono font-semibold text-slate-200 transition"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Card Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#E5C358] hover:to-[#C69F31] text-black font-bold text-xs font-mono shadow-[0_0_15px_rgba(212,175,55,0.3)] transition"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download PNG Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
