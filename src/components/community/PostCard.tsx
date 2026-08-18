import React, { useState } from 'react';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Repeat2,
  Bookmark,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  ShieldAlert,
  Bot,
  DollarSign,
  Clock,
  Pin,
  ExternalLink,
  Edit2,
  Trash2,
  Flag,
  Vote,
  Sparkles,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { CommunityPost, CommunityUserProfile, PositionDisclosure } from '../../types/community';
import { CommunityService } from '../../services/community/communityService';
import { CommentsThread } from './CommentsThread';
import { QuoteRepostModal } from './QuoteRepostModal';
import { ReportModal } from './ReportModal';
import { TradingWarningModal } from './TradingWarningModal';
import { TickerSymbol } from '../../types/market';

interface PostCardProps {
  post: CommunityPost;
  currentUser: CommunityUserProfile;
  onSelectTicker?: (ticker: TickerSymbol) => void;
  onOpenProfile?: (userId: string) => void;
  onPostUpdated?: (updatedPost: CommunityPost) => void;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onSelectTicker,
  onOpenProfile,
  onPostUpdated,
  onPostDeleted,
}) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [pendingWarningTicker, setPendingWarningTicker] = useState<TickerSymbol | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Local state for instant feedback
  const [localPost, setLocalPost] = useState<CommunityPost>(post);
  const [userReaction, setUserReaction] = useState<'LIKE' | 'BULL' | 'BEAR' | null>(() =>
    CommunityService.getUserReaction(post.id, currentUser.id)
  );
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() =>
    CommunityService.isBookmarked(currentUser.id, post.id)
  );

  // Poll voting state
  const [isVoting, setIsVoting] = useState(false);

  // Check permissions
  const isAuthor = currentUser.id === post.authorId;
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const handleReaction = async (type: 'LIKE' | 'BULL' | 'BEAR') => {
    try {
      const res = await CommunityService.toggleReaction(localPost.id, currentUser.id, type, currentUser);
      setUserReaction(res.userReaction);
      setLocalPost(res.post);
      if (onPostUpdated) onPostUpdated(res.post);
    } catch (e) {
      console.warn('Reaction error:', e);
    }
  };

  const handleBookmark = async () => {
    try {
      const bookmarked = await CommunityService.toggleBookmark(currentUser.id, localPost);
      setIsBookmarked(bookmarked);
      setLocalPost((prev) => ({
        ...prev,
        bookmarkCount: bookmarked ? prev.bookmarkCount + 1 : Math.max(0, prev.bookmarkCount - 1),
      }));
    } catch (e) {
      console.warn('Bookmark error:', e);
    }
  };

  const handleVotePoll = async (optionId: string) => {
    try {
      setIsVoting(true);
      const updated = await CommunityService.votePoll(localPost.id, optionId, currentUser.id);
      setLocalPost(updated);
      if (onPostUpdated) onPostUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#post_${localPost.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    setIsMenuOpen(false);
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await CommunityService.deletePost(localPost.id, currentUser.id, isAdmin);
        if (onPostDeleted) onPostDeleted(localPost.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete post');
      }
    }
  };

  const handleTickerClick = (ticker: TickerSymbol) => {
    setPendingWarningTicker(ticker);
    setIsWarningModalOpen(true);
  };

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Render Rich Text with clickable tickers, mentions, hashtags
  const renderFormattedContent = (text: string) => {
    const tokens = text.split(/(\$[A-Z]{1,6}\b|@[a-zA-Z0-9_]{3,25}\b|#[a-zA-Z0-9_]{2,30}\b)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('$')) {
        const ticker = token.slice(1) as TickerSymbol;
        return (
          <button
            key={i}
            onClick={() => handleTickerClick(ticker)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-[rgba(212,175,55,0.12)] text-[#F2D675] border border-[rgba(212,175,55,0.3)] font-mono font-bold text-xs hover:bg-[rgba(212,175,55,0.25)] hover:border-[#D4AF37] transition cursor-pointer"
          >
            {token}
          </button>
        );
      }
      if (token.startsWith('@')) {
        const username = token.slice(1);
        return (
          <span
            key={i}
            onClick={() => onOpenProfile && onOpenProfile(token.slice(1))}
            className="text-[#60a5fa] hover:text-[#93c5fd] hover:underline cursor-pointer font-semibold"
          >
            {token}
          </span>
        );
      }
      if (token.startsWith('#')) {
        return (
          <span key={i} className="text-[#D4AF37] hover:underline cursor-pointer">
            {token}
          </span>
        );
      }
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <article className="bg-[#0c0d10] border border-[#242424] hover:border-[#383838] transition-all rounded-xl p-4 flex flex-col gap-3 relative shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* Top Banner (Pinned or Reposted info) */}
      {localPost.isPinned && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#D4AF37] bg-[rgba(212,175,55,0.08)] px-2.5 py-1 rounded-md border border-[rgba(212,175,55,0.2)] w-fit">
          <Pin className="w-3 h-3" />
          <span>PINNED QUANT ANALYSIS</span>
        </div>
      )}

      {/* Header: Author Info & Controls */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenProfile && onOpenProfile(localPost.authorId)}
            className="relative group focus:outline-none"
          >
            <img
              src={localPost.authorAvatarUrl}
              alt={localPost.authorName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#2a2a2a] group-hover:border-[#D4AF37] transition"
            />
            {localPost.authorIsVerified && (
              <span className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-black p-0.5 rounded-full shadow">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onOpenProfile && onOpenProfile(localPost.authorId)}
                className="font-bold text-sm text-white hover:text-[#F2D675] transition flex items-center gap-1"
              >
                <span>{localPost.authorName}</span>
                {localPost.authorIsVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" title="Verified Quant Analyst" />
                )}
              </button>

              <span className="text-xs text-[#8A8F98] font-mono">@{localPost.authorUsername}</span>

              {localPost.authorPlan && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase bg-[#1a1a1a] text-[#D4AF37] border border-[rgba(212,175,55,0.3)]">
                  {localPost.authorPlan}
                </span>
              )}

              <span className="text-xs text-[#555]">&bull;</span>
              <span className="text-xs text-[#8A8F98] flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#555]" />
                {formatTimeAgo(localPost.createdAt)}
              </span>

              {localPost.isEdited && (
                <span className="text-[10px] text-slate-500 italic">(edited)</span>
              )}
            </div>

            {/* Position Disclosure Tag */}
            {localPost.positionDisclosure !== 'NONE' && (
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 border ${
                    localPost.positionDisclosure === 'LONG'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                      : localPost.positionDisclosure === 'SHORT'
                      ? 'bg-rose-950/60 text-rose-400 border-rose-500/40'
                      : 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  DISCLOSED POSITION: {localPost.positionDisclosure}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Options Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-[#777] hover:text-white rounded-lg hover:bg-[#1c1c1c] transition"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-[#141414] border border-[#2d2d2d] rounded-xl shadow-2xl z-30 py-1.5 text-xs">
              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-2 text-left text-slate-300 hover:bg-[#222] hover:text-white flex items-center gap-2"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5 text-[#D4AF37]" />}
                <span>{isCopied ? 'Link Copied!' : 'Copy Direct Link'}</span>
              </button>

              {onOpenProfile && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenProfile(localPost.authorId);
                  }}
                  className="w-full px-3 py-2 text-left text-slate-300 hover:bg-[#222] hover:text-white flex items-center gap-2"
                >
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                  <span>View Author Profile</span>
                </button>
              )}

              {(isAuthor || isAdmin) && (
                <button
                  onClick={handleDeletePost}
                  className="w-full px-3 py-2 text-left text-rose-400 hover:bg-[#222] flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}

              {!isAuthor && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsReportModalOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left text-amber-400 hover:bg-[#222] flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      <div className="text-sm text-[#e0e4eb] leading-relaxed whitespace-pre-line break-words select-text">
        {renderFormattedContent(localPost.content)}
      </div>

      {/* Disclosures & Badges (AI / Sponsored) */}
      {(localPost.isAiGenerated || localPost.isSponsored) && (
        <div className="flex items-center gap-2 flex-wrap">
          {localPost.isAiGenerated && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              AI-ASSISTED SYNTHESIS
            </span>
          )}
          {localPost.isSponsored && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" />
              SPONSORED / PAID PARTNERSHIP
            </span>
          )}
        </div>
      )}

      {/* Media: Attached Chart / Image */}
      {localPost.mediaUrl && (
        <div className="rounded-lg overflow-hidden border border-[#222] max-h-96 bg-black flex items-center justify-center">
          <img
            src={localPost.mediaUrl}
            alt="Post attachment"
            className="w-full h-auto object-contain max-h-96 rounded-lg"
          />
        </div>
      )}

      {/* Media: Interactive Live Poll */}
      {localPost.poll && (
        <div className="bg-[#121316] border border-[#262626] rounded-xl p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#F2D675] flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-[#D4AF37]" />
              {localPost.poll.question}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {localPost.poll.totalVotes} total votes
            </span>
          </div>

          <div className="space-y-2">
            {localPost.poll.options.map((opt) => {
              const hasVoted = opt.voterIds.includes(currentUser.id);
              const percentage =
                localPost.poll && localPost.poll.totalVotes > 0
                  ? Math.round((opt.votes / localPost.poll.totalVotes) * 100)
                  : 0;

              return (
                <button
                  key={opt.id}
                  disabled={isVoting}
                  onClick={() => handleVotePoll(opt.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition relative overflow-hidden flex items-center justify-between group ${
                    hasVoted
                      ? 'border-[#D4AF37] bg-[rgba(212,175,55,0.1)]'
                      : 'border-[#222] hover:border-[#3d3d3d] bg-[#181818]'
                  }`}
                >
                  {/* Progress Fill Bar */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-[rgba(212,175,55,0.18)] transition-all duration-500 rounded"
                    style={{ width: `${percentage}%` }}
                  />

                  <span className="relative z-10 text-xs text-white font-medium flex items-center gap-2">
                    {hasVoted && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    {opt.text}
                  </span>

                  <span className="relative z-10 text-xs font-mono font-bold text-[#F2D675]">
                    {percentage}% ({opt.votes})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Media: Approved News Link */}
      {localPost.newsLink && (
        <a
          href={localPost.newsLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#111215] border border-[#262626] hover:border-[#D4AF37] rounded-xl p-3 flex flex-col gap-1 transition group"
        >
          <div className="flex items-center justify-between text-[11px] text-[#888]">
            <span className="font-mono text-[#D4AF37] flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {localPost.newsLink.source}
            </span>
            <span className="text-[10px] italic">{localPost.newsLink.publisherAttribution}</span>
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-[#F2D675] transition line-clamp-2">
            {localPost.newsLink.title}
          </h4>
          {localPost.newsLink.snippet && (
            <p className="text-xs text-slate-400 line-clamp-2">{localPost.newsLink.snippet}</p>
          )}
        </a>
      )}

      {/* Reposted Embedded Post (if Quote Post) */}
      {localPost.repostedPost && (
        <div className="border border-[#2d2d2d] rounded-xl p-3 bg-[#080808] flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2 text-xs">
            <img
              src={localPost.repostedPost.authorAvatarUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="font-bold text-white">{localPost.repostedPost.authorName}</span>
            <span className="text-[#888] font-mono">@{localPost.repostedPost.authorUsername}</span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-3">{localPost.repostedPost.content}</p>
        </div>
      )}

      {/* Mandatory "Not Financial Advice" Footer Tag */}
      <div className="pt-2 border-t border-[#1c1c1c] flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-[#8A8F98]">
          <ShieldAlert className="w-3 h-3 text-[#D4AF37]" />
          NOT FINANCIAL ADVICE &bull; COMMUNITY OPINIONS ONLY
        </span>
      </div>

      {/* Action Bar (Reactions, Comments, Reposts, Bookmarks, Share) */}
      <div className="flex items-center justify-between pt-1 text-xs text-[#8A8F98] border-t border-[#181818]">
        {/* Like / Heart */}
        <button
          onClick={() => handleReaction('LIKE')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition ${
            userReaction === 'LIKE'
              ? 'text-rose-400 bg-rose-950/30'
              : 'hover:text-rose-400 hover:bg-[#1a1a1a]'
          }`}
          title="Like"
        >
          <Heart className={`w-4 h-4 ${userReaction === 'LIKE' ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span className="font-mono">{localPost.likeCount}</span>
        </button>

        {/* Bullish Reaction */}
        <button
          onClick={() => handleReaction('BULL')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition ${
            userReaction === 'BULL'
              ? 'text-emerald-400 bg-emerald-950/30 font-bold'
              : 'hover:text-emerald-400 hover:bg-[#1a1a1a]'
          }`}
          title="Bullish Sentiment"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="font-mono">{localPost.bullCount} Bull</span>
        </button>

        {/* Bearish Reaction */}
        <button
          onClick={() => handleReaction('BEAR')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition ${
            userReaction === 'BEAR'
              ? 'text-rose-400 bg-rose-950/30 font-bold'
              : 'hover:text-rose-400 hover:bg-[#1a1a1a]'
          }`}
          title="Bearish Sentiment"
        >
          <TrendingDown className="w-4 h-4" />
          <span className="font-mono">{localPost.bearCount} Bear</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition ${
            isCommentsOpen
              ? 'text-[#F2D675] bg-[rgba(212,175,55,0.1)]'
              : 'hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="font-mono">{localPost.commentCount}</span>
        </button>

        {/* Repost */}
        <button
          onClick={() => setIsQuoteModalOpen(true)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:text-emerald-400 hover:bg-[#1a1a1a] transition"
          title="Repost or Quote Share"
        >
          <Repeat2 className="w-4 h-4" />
          <span className="font-mono">{localPost.repostCount}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition ${
            isBookmarked
              ? 'text-[#D4AF37] bg-[rgba(212,175,55,0.1)]'
              : 'hover:text-[#D4AF37] hover:bg-[#1a1a1a]'
          }`}
          title="Save to Private Bookmarks"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#D4AF37]' : ''}`} />
        </button>

        {/* Share Link */}
        <button
          onClick={handleCopyLink}
          className="p-1.5 rounded-lg hover:text-white hover:bg-[#1a1a1a] transition"
          title="Share direct link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Threaded Comments Section */}
      {isCommentsOpen && (
        <div className="mt-2 pt-3 border-t border-[#222]">
          <CommentsThread
            postId={localPost.id}
            postAuthorId={localPost.authorId}
            currentUser={currentUser}
            disableComments={localPost.disableComments}
            limitCommentsToFollowers={localPost.limitCommentsToFollowers}
            onCommentAdded={() => {
              setLocalPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
            }}
            onCommentDeleted={() => {
              setLocalPost((prev) => ({ ...prev, commentCount: Math.max(0, prev.commentCount - 1) }));
            }}
          />
        </div>
      )}

      {/* Quote Repost Modal */}
      {isQuoteModalOpen && (
        <QuoteRepostModal
          originalPost={localPost}
          currentUser={currentUser}
          onClose={() => setIsQuoteModalOpen(false)}
          onReposted={(newPost) => {
            setLocalPost((prev) => ({ ...prev, repostCount: prev.repostCount + 1 }));
            setIsQuoteModalOpen(false);
          }}
        />
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          targetType="POST"
          targetId={localPost.id}
          targetAuthorId={localPost.authorId}
          targetContentSnippet={localPost.content}
          currentUser={currentUser}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Trading Warning Modal before examining ideas */}
      {isWarningModalOpen && pendingWarningTicker && (
        <TradingWarningModal
          ticker={pendingWarningTicker}
          onClose={() => {
            setIsWarningModalOpen(false);
            setPendingWarningTicker(null);
          }}
          onConfirm={() => {
            setIsWarningModalOpen(false);
            if (onSelectTicker && pendingWarningTicker) {
              onSelectTicker(pendingWarningTicker);
            }
            setPendingWarningTicker(null);
          }}
        />
      )}
    </article>
  );
};
