import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Vote,
  Link as LinkIcon,
  Sparkles,
  DollarSign,
  ShieldAlert,
  Send,
  Plus,
  Trash2,
  Lock,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { CommunityUserProfile, PositionDisclosure, ContentMediaType } from '../../types/community';
import { CommunitySafetyGuard } from '../../services/community/safetyGuard';
import { CommunityService } from '../../services/community/communityService';
import { TickerSymbol } from '../../types/market';

interface PostComposerModalProps {
  currentUser: CommunityUserProfile;
  onClose: () => void;
  onPostCreated: () => void;
}

export const PostComposerModal: React.FC<PostComposerModalProps> = ({
  currentUser,
  onClose,
  onPostCreated,
}) => {
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<ContentMediaType>('NONE');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Poll state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDurationDays, setPollDurationDays] = useState<number>(3);

  // News Link state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSource, setNewsSource] = useState('');
  const [newsUrl, setNewsUrl] = useState('');
  const [newsSnippet, setNewsSnippet] = useState('');

  // Position Disclosure
  const [positionDisclosure, setPositionDisclosure] = useState<PositionDisclosure>('NONE');

  // Controls & Badges
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [disableComments, setDisableComments] = useState(false);
  const [limitCommentsToFollowers, setLimitCommentsToFollowers] = useState(false);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  // Handle content change & instant safety scan
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    if (text.length > 20) {
      const scan = CommunitySafetyGuard.scanContent(text);
      if (!scan.isSafe) {
        setSafetyWarning(scan.blockReason || 'Warning: Potentially prohibited manipulative phrasing detected.');
      } else {
        setSafetyWarning(null);
      }
    } else {
      setSafetyWarning(null);
    }
  };

  // Image Upload handler
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const val = CommunitySafetyGuard.validateImageFile(file);
    if (!val.valid) {
      setError(val.error || 'Invalid image file.');
      return;
    }

    try {
      const compressed = await CommunitySafetyGuard.compressImage(file);
      setMediaUrl(compressed);
      setImagePreview(compressed);
      setMediaType('IMAGE');
      setError(null);
    } catch (err: any) {
      setError('Failed to process image attachment.');
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Structure poll if active
      let pollData;
      if (mediaType === 'POLL') {
        const cleanOptions = pollOptions.map((o) => o.trim()).filter((o) => o.length > 0);
        if (!pollQuestion.trim() || cleanOptions.length < 2) {
          throw new Error('Please provide a poll question and at least 2 valid options.');
        }
        pollData = {
          question: pollQuestion.trim(),
          options: cleanOptions,
          durationDays: pollDurationDays,
        };
      }

      // Structure news link if active
      let newsData;
      if (mediaType === 'NEWS_LINK') {
        if (!newsTitle.trim() || !newsUrl.trim()) {
          throw new Error('Please provide the headline title and link URL for the approved news article.');
        }
        newsData = {
          title: newsTitle.trim(),
          source: newsSource.trim() || 'Financial News Wire',
          url: newsUrl.trim(),
          publisherAttribution: 'External News Source Reference',
          snippet: newsSnippet.trim() || undefined,
        };
      }

      await CommunityService.createPost({
        author: currentUser,
        content: content.trim(),
        mediaType,
        mediaUrl: mediaType === 'IMAGE' ? mediaUrl : undefined,
        poll: pollData,
        newsLink: newsData,
        positionDisclosure,
        isAiGenerated,
        isSponsored,
        disableComments,
        limitCommentsToFollowers,
      });

      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f1013] border border-[#2d2d2d] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-8">
        {/* Header */}
        <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#141518]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center text-[#F2D675]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Publish Market Analysis</h3>
              <p className="text-[11px] text-slate-400 font-mono">MarketMind Quantitative Community Feed</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Author Header */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-[#2a2a2a]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
                {currentUser.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">@{currentUser.username}</span>
            </div>
          </div>

          {/* Main Textarea */}
          <div className="flex flex-col gap-1">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Share your quantitative perspective, key support/resistance levels, order flow analysis, or macro data... Use $SPY, $NVDA, #technicals or @username"
              rows={4}
              maxLength={2000}
              className="w-full bg-[#15161a] border border-[#292a30] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-white text-xs p-3.5 rounded-xl transition resize-none placeholder-[#666] leading-relaxed"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1">
              <span>Supports ticker tags like $SPY, $QQQ, $AAPL</span>
              <span>{content.length} / 2000</span>
            </div>
          </div>

          {/* Real-Time Safety Warning */}
          {safetyWarning && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{safetyWarning}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Media Attachments Sub-forms */}
          {mediaType === 'IMAGE' && imagePreview && (
            <div className="relative rounded-xl overflow-hidden border border-[#333] bg-black max-h-56 flex items-center justify-center">
              <img src={imagePreview} alt="Upload preview" className="w-full h-auto object-contain max-h-56" />
              <button
                type="button"
                onClick={() => {
                  setMediaType('NONE');
                  setMediaUrl(undefined);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/80 text-white hover:text-rose-400 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Poll Sub-form */}
          {mediaType === 'POLL' && (
            <div className="bg-[#141519] border border-[#2a2b30] rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F2D675] flex items-center gap-1.5">
                  <Vote className="w-4 h-4 text-[#D4AF37]" />
                  Create Market Sentiment Poll
                </span>
                <button
                  type="button"
                  onClick={() => setMediaType('NONE')}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question (e.g. Will $SPY close above $515 this Friday?)"
                className="bg-[#0b0b0c] border border-[#242424] text-white text-xs px-3 py-2 rounded-lg"
              />

              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-[#0b0b0c] border border-[#242424] text-white text-xs px-3 py-1.5 rounded-lg"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Duration:</span>
                  <select
                    value={pollDurationDays}
                    onChange={(e) => setPollDurationDays(Number(e.target.value))}
                    className="bg-[#0b0b0c] border border-[#242424] text-white text-xs px-2 py-1 rounded"
                  >
                    <option value={1}>24 Hours</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* News Link Sub-form */}
          {mediaType === 'NEWS_LINK' && (
            <div className="bg-[#141519] border border-[#2a2b30] rounded-xl p-3.5 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#F2D675] flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-[#D4AF37]" />
                  Attach Financial News Source
                </span>
                <button
                  type="button"
                  onClick={() => setMediaType('NONE')}
                  className="text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="News Headline Title..."
                className="bg-[#0b0b0c] border border-[#242424] text-white px-3 py-1.5 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newsSource}
                  onChange={(e) => setNewsSource(e.target.value)}
                  placeholder="Source (e.g. Bloomberg, Reuters)"
                  className="bg-[#0b0b0c] border border-[#242424] text-white px-3 py-1.5 rounded-lg"
                />
                <input
                  type="url"
                  value={newsUrl}
                  onChange={(e) => setNewsUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-[#0b0b0c] border border-[#242424] text-white px-3 py-1.5 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Position Disclosure Selector */}
          <div className="flex items-center justify-between gap-3 p-3 bg-[#131417] border border-[#242428] rounded-xl text-xs">
            <span className="font-mono text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D4AF37]" />
              Position Disclosure:
            </span>
            <select
              value={positionDisclosure}
              onChange={(e) => setPositionDisclosure(e.target.value as PositionDisclosure)}
              className="bg-[#1c1e24] border border-[#333] text-white font-mono text-xs px-2.5 py-1.5 rounded-lg focus:border-[#D4AF37]"
            >
              <option value="NONE">No Disclosure (General Macro)</option>
              <option value="LONG">🟢 Long / Bullish Holding</option>
              <option value="SHORT">🔴 Short / Bearish Position</option>
              <option value="NEUTRAL">⚪ Neutral / Watching Only</option>
              <option value="NO_POSITION">⚪ No Financial Stake</option>
            </select>
          </div>

          {/* Disclosures & Toggles */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141417] border border-[#222] cursor-pointer hover:border-[#333]">
              <input
                type="checkbox"
                checked={isAiGenerated}
                onChange={(e) => setIsAiGenerated(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                AI Generated
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141417] border border-[#222] cursor-pointer hover:border-[#333]">
              <input
                type="checkbox"
                checked={isSponsored}
                onChange={(e) => setIsSponsored(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-400" />
                Sponsored Post
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141417] border border-[#222] cursor-pointer hover:border-[#333]">
              <input
                type="checkbox"
                checked={disableComments}
                onChange={(e) => setDisableComments(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Disable Comments
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141417] border border-[#222] cursor-pointer hover:border-[#333]">
              <input
                type="checkbox"
                checked={limitCommentsToFollowers}
                onChange={(e) => setLimitCommentsToFollowers(e.target.checked)}
                className="accent-[#D4AF37]"
              />
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                Followers Only
              </span>
            </label>
          </div>

          {/* Bottom Tool Bar & Submit Button */}
          <div className="flex items-center justify-between pt-2 border-t border-[#242424]">
            {/* Attachment buttons */}
            <div className="flex items-center gap-1">
              <label
                className="p-2 rounded-lg text-slate-400 hover:text-[#D4AF37] hover:bg-[#1a1a1a] cursor-pointer transition"
                title="Attach Chart or Image"
              >
                <ImageIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setMediaType('POLL')}
                className={`p-2 rounded-lg transition ${
                  mediaType === 'POLL'
                    ? 'text-[#F2D675] bg-[rgba(212,175,55,0.15)]'
                    : 'text-slate-400 hover:text-[#D4AF37] hover:bg-[#1a1a1a]'
                }`}
                title="Create Sentiment Poll"
              >
                <Vote className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMediaType('NEWS_LINK')}
                className={`p-2 rounded-lg transition ${
                  mediaType === 'NEWS_LINK'
                    ? 'text-[#F2D675] bg-[rgba(212,175,55,0.15)]'
                    : 'text-slate-400 hover:text-[#D4AF37] hover:bg-[#1a1a1a]'
                }`}
                title="Attach News Source"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting || safetyWarning !== null}
                className="px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:from-[#F2D675] hover:to-[#D4AF37] text-black font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
