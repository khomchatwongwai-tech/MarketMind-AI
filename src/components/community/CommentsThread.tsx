import React, { useState, useEffect } from 'react';
import {
  Send,
  CornerDownRight,
  Trash2,
  Flag,
  Heart,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Lock,
} from 'lucide-react';
import { CommunityComment, CommunityUserProfile } from '../../types/community';
import { CommunityService } from '../../services/community/communityService';
import { ReportModal } from './ReportModal';

interface CommentsThreadProps {
  postId: string;
  postAuthorId: string;
  currentUser: CommunityUserProfile;
  disableComments?: boolean;
  limitCommentsToFollowers?: boolean;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export const CommentsThread: React.FC<CommentsThreadProps> = ({
  postId,
  postAuthorId,
  currentUser,
  disableComments,
  limitCommentsToFollowers,
  onCommentAdded,
  onCommentDeleted,
}) => {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<CommunityComment | null>(null);

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const list = await CommunityService.getComments(postId);
      setComments(list);
    } catch (e) {
      console.warn('Failed to load comments:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const newComment = await CommunityService.addComment({
        postId,
        author: currentUser,
        content: newCommentText.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setNewCommentText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to publish comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostReply = async (parentCommentId: string) => {
    if (!replyText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const newReply = await CommunityService.addComment({
        postId,
        parentCommentId,
        author: currentUser,
        content: replyText.trim(),
      });
      setComments((prev) => [...prev, newReply]);
      setReplyText('');
      setReplyingToCommentId(null);
      if (onCommentAdded) onCommentAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await CommunityService.deleteComment(postId, commentId, currentUser.id, isAdmin);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (onCommentDeleted) onCommentDeleted();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  // Group top-level comments and replies
  const rootComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentCommentId === parentId);

  return (
    <div className="space-y-4">
      {/* Top Input Form */}
      {disableComments ? (
        <div className="flex items-center gap-2 p-3 bg-[#141414] border border-[#262626] rounded-xl text-xs text-slate-400 font-mono">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Comments are disabled by the author for this publication.</span>
        </div>
      ) : (
        <form onSubmit={handlePostComment} className="flex gap-2">
          <img
            src={currentUser.avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-[#2a2a2a]"
          />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write an analytical comment or reply (e.g. $SPY support level)..."
                className="w-full bg-[#141518] border border-[#2a2a2a] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-white text-xs px-3.5 py-2.5 rounded-xl transition pr-10 placeholder-[#666]"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmitting}
                className="absolute right-1.5 p-1.5 bg-[#D4AF37] hover:bg-[#F2D675] disabled:opacity-30 text-black rounded-lg transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            {error && (
              <span className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                <ShieldAlert className="w-3.5 h-3.5" />
                {error}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-xs text-slate-500 py-2 font-mono">Loading discussions...</div>
        ) : rootComments.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 text-center bg-[#090909] rounded-lg border border-[#181818]">
            No comments yet. Start the market discussion!
          </div>
        ) : (
          rootComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isCommentAuthor = currentUser.id === comment.authorId;
            const isPostOwner = currentUser.id === postAuthorId;

            return (
              <div key={comment.id} className="flex flex-col gap-2 bg-[#0d0e11] p-3 rounded-xl border border-[#1f2024]">
                {/* Main Comment Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={comment.authorAvatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-[#222]"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {comment.authorName}
                        {comment.authorIsVerified && <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />}
                      </span>
                      <span className="text-[11px] text-[#777] font-mono">@{comment.authorUsername}</span>
                      <span className="text-[10px] text-[#555]">&bull;</span>
                      <span className="text-[10px] text-[#777] font-mono">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#666]">
                    {(isCommentAuthor || isPostOwner || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 hover:text-rose-400 transition"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    {!isCommentAuthor && (
                      <button
                        onClick={() => setReportTarget(comment)}
                        className="p-1 hover:text-amber-400 transition"
                        title="Report comment"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs text-[#d1d5db] pl-9 leading-relaxed">{comment.content}</p>

                {/* Reply Trigger */}
                <div className="pl-9 flex items-center gap-3 text-[11px] text-[#888]">
                  <button
                    onClick={() =>
                      setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)
                    }
                    className="hover:text-[#F2D675] font-semibold transition flex items-center gap-1"
                  >
                    <CornerDownRight className="w-3 h-3 text-[#D4AF37]" />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Inline Reply Composer */}
                {replyingToCommentId === comment.id && (
                  <div className="pl-9 mt-2 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to @${comment.authorUsername}...`}
                      className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-[#D4AF37] text-white text-xs px-3 py-1.5 rounded-lg transition"
                    />
                    <button
                      onClick={() => handlePostReply(comment.id)}
                      disabled={!replyText.trim() || isSubmitting}
                      className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#F2D675] disabled:opacity-30 text-black font-bold rounded-lg text-xs transition"
                    >
                      Reply
                    </button>
                  </div>
                )}

                {/* Nested Threaded Replies */}
                {replies.length > 0 && (
                  <div className="pl-9 mt-2 space-y-2 border-l border-[#242424]">
                    {replies.map((reply) => (
                      <div key={reply.id} className="pl-3 flex flex-col gap-1 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={reply.authorAvatarUrl}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-bold text-white text-[11px] flex items-center gap-1">
                              {reply.authorName}
                              {reply.authorIsVerified && <CheckCircle2 className="w-2.5 h-2.5 text-[#D4AF37]" />}
                            </span>
                            <span className="text-[10px] text-[#777] font-mono">@{reply.authorUsername}</span>
                          </div>
                          {(currentUser.id === reply.authorId || isPostOwner || isAdmin) && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="p-1 hover:text-rose-400 text-slate-600 transition"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 pl-6">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          targetType="COMMENT"
          targetId={reportTarget.id}
          targetAuthorId={reportTarget.authorId}
          targetContentSnippet={reportTarget.content}
          currentUser={currentUser}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};
