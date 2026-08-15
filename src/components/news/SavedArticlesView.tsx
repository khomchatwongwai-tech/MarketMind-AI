import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Share2,
  FileText,
  Clock,
  Building2,
  RefreshCw,
  Plus,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { SavedArticle } from '../../types/newsIntelligence';

interface SavedArticlesViewProps {
  onSelectTicker?: (ticker: string) => void;
}

export const SavedArticlesView: React.FC<SavedArticlesViewProps> = ({ onSelectTicker }) => {
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const fetchSaved = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news/bookmarks');
      if (res.ok) {
        const data = await res.json();
        setSavedArticles(data.saved || []);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/news/bookmarks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedArticles((prev) => prev.filter((a) => a.id !== id && a.articleId !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyNotice('Article URL copied to clipboard!');
    setTimeout(() => setCopyNotice(null), 2500);
  };

  return (
    <div className="space-y-4 font-sans text-[#E2E8F0]">
      {/* Copy Toast */}
      {copyNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E0E0E] border border-[#D4AF37] text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copyNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1C1C1C]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/50 rounded-lg text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase text-white font-mono tracking-wider">
                  Saved Research Articles & Analyst Bookmarks
                </h3>
                <span className="px-2 py-0.5 bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border border-[#D4AF37]/40 rounded text-[10px] font-mono font-bold">
                  {savedArticles.length} SAVED
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Archived regulatory filings, breaking catalysts, and market stories saved for offline reference and compliance review.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSaved}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#141414] hover:bg-[#202020] text-[#D4AF37] border border-[#242424] hover:border-[#D4AF37]/50 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Bookmarks
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      {savedArticles.length === 0 ? (
        <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-12 text-center text-[#71717A] space-y-2">
          <Bookmark className="w-8 h-8 mx-auto text-[#444]" />
          <h4 className="text-sm font-bold text-white">No Saved Articles Yet</h4>
          <p className="text-xs max-w-md mx-auto">
            Click the bookmark icon on any headline in the Multi-Source News Feed or AI Market Brief to save it here for future reference.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {savedArticles.map((article) => (
            <div
              key={article.id}
              className="bg-[#0A0A0A] border border-[#242424] hover:border-[#D4AF37]/50 rounded-xl p-4 shadow-xl flex flex-col justify-between gap-3 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 bg-[#141414] border border-[#2C2C2C] rounded text-[10px] font-mono font-bold text-[#D4AF37]">
                    {article.publisher}
                  </span>
                  <span className="text-[10px] font-mono text-[#666] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(article.savedAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">
                  {article.headline}
                </h4>

                {article.notes && (
                  <p className="text-xs text-[#AAA] bg-[#050505] p-2 rounded border border-[#1A1A1A] italic">
                    "{article.notes}"
                  </p>
                )}

                {article.tickers && article.tickers.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {article.tickers.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectTicker?.(t)}
                        className="px-2 py-0.5 bg-[#141414] hover:bg-[#1E1E1E] border border-[#222] rounded text-[10px] font-mono text-[#D4AF37] font-bold"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyLink(article.url)}
                  className="px-2.5 py-1 bg-[#141414] hover:bg-[#1E1E1E] text-[#888] hover:text-white border border-[#222] rounded text-[11px] font-mono flex items-center gap-1.5 transition"
                  title="Copy URL"
                >
                  <Copy className="w-3 h-3" /> Copy Link
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-[#141414] hover:bg-[#1F1F1F] text-[#D4AF37] border border-[#2C2C2C] hover:border-[#D4AF37]/50 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    Read Article <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleRemove(article.id)}
                    className="p-1.5 bg-[#141414] hover:bg-rose-950/40 text-[#666] hover:text-rose-400 border border-[#222] hover:border-rose-500/40 rounded transition"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
