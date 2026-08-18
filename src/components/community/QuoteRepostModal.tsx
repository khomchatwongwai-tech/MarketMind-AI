import React, { useState } from 'react';
import { X, Repeat2, Send, ShieldAlert } from 'lucide-react';
import { CommunityPost, CommunityUserProfile } from '../../types/community';
import { CommunityService } from '../../services/community/communityService';
import { CommunitySafetyGuard } from '../../services/community/safetyGuard';

interface QuoteRepostModalProps {
  originalPost: CommunityPost;
  currentUser: CommunityUserProfile;
  onClose: () => void;
  onReposted: (newPost: CommunityPost) => void;
}

export const QuoteRepostModal: React.FC<QuoteRepostModalProps> = ({
  originalPost,
  currentUser,
  onClose,
  onReposted,
}) => {
  const [quoteText, setQuoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (quoteText.trim().length > 0) {
        const scan = CommunitySafetyGuard.scanContent(quoteText);
        if (!scan.isSafe) {
          throw new Error(scan.blockReason || 'Content violates safety guidelines.');
        }
      }

      const reposted = await CommunityService.repost(
        originalPost.id,
        currentUser,
        quoteText.trim() || undefined
      );

      onReposted(reposted);
    } catch (err: any) {
      setError(err.message || 'Failed to repost');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1013] border border-[#2d2d2d] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#141518]">
          <div className="flex items-center gap-2">
            <Repeat2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quote Repost Analysis</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="Add your own perspective, technical levels or commentary..."
            rows={3}
            className="w-full bg-[#15161a] border border-[#292a30] focus:border-[#D4AF37] text-white text-xs p-3 rounded-xl transition resize-none placeholder-[#666]"
          />

          {error && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Embedded original post snapshot */}
          <div className="p-3 bg-[#080808] border border-[#242424] rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <img
                src={originalPost.authorAvatarUrl}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-bold text-white">{originalPost.authorName}</span>
              <span className="text-[#777] font-mono">@{originalPost.authorUsername}</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-3">{originalPost.content}</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#242424]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Repost'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
