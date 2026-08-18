import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Calendar,
  Globe,
  Sliders,
  UserPlus,
  UserCheck,
  Lock,
  Flag,
  VolumeX,
  ShieldBan,
  Bookmark,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { CommunityUserProfile, CommunityPost } from '../../types/community';
import { CommunityService } from '../../services/community/communityService';
import { PostCard } from './PostCard';
import { EditProfileModal } from './EditProfileModal';
import { FollowListModal } from './FollowListModal';
import { ReportModal } from './ReportModal';
import { TickerSymbol } from '../../types/market';

interface UserProfileViewProps {
  userId: string;
  currentUser: CommunityUserProfile;
  onBack: () => void;
  onSelectTicker?: (ticker: TickerSymbol) => void;
  onProfileUpdated?: (updated: CommunityUserProfile) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  userId,
  currentUser,
  onBack,
  onSelectTicker,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<CommunityUserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [bookmarks, setBookmarks] = useState<CommunityPost[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'bookmarks'>('posts');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'FOLLOWERS' | 'FOLLOWING' | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Follow State
  const [followStatus, setFollowStatus] = useState<'FOLLOWING' | 'REQUESTED' | 'NOT_FOLLOWING'>('NOT_FOLLOWING');

  const isOwner = currentUser.id === userId;

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const target = await CommunityService.getProfile(userId);
      setProfile(target);

      if (target) {
        // Load posts
        const allPosts = CommunityService.getLocalPosts();
        const userPosts = allPosts.filter((p) => p.authorId === target.id && p.status !== 'REMOVED');
        setPosts(userPosts);

        // Load bookmarks if owner
        if (isOwner) {
          const userBookmarks = CommunityService.getLocalBookmarks(currentUser.id).map((b) => b.postSnapshot);
          setBookmarks(userBookmarks);
        }

        // Determine follow status
        if (!isOwner) {
          const isFoll = CommunityService.isFollowing(currentUser.id, target.id);
          if (isFoll) {
            setFollowStatus('FOLLOWING');
          } else {
            const reqs = CommunityService.getLocalFollowRequests(target.id);
            const hasReq = reqs.some((r) => r.senderId === currentUser.id && r.status === 'PENDING');
            setFollowStatus(hasReq ? 'REQUESTED' : 'NOT_FOLLOWING');
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load profile data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [userId, currentUser.id]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    if (followStatus === 'FOLLOWING') {
      await CommunityService.unfollowUser(currentUser.id, profile.id);
      setFollowStatus('NOT_FOLLOWING');
      setProfile((prev) => (prev ? { ...prev, followerCount: Math.max(0, prev.followerCount - 1) } : null));
    } else {
      const res = await CommunityService.followUser(currentUser, profile);
      setFollowStatus(res.status);
      if (res.status === 'FOLLOWING') {
        setProfile((prev) => (prev ? { ...prev, followerCount: prev.followerCount + 1 } : null));
      }
    }
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    if (window.confirm(`Block @${profile.username}? You will not see their posts or messages.`)) {
      await CommunityService.blockUser(currentUser.id, profile.id, profile.username);
      alert(`Blocked @${profile.username}`);
      onBack();
    }
  };

  const handleMuteUser = async () => {
    if (!profile) return;
    await CommunityService.muteUser(currentUser.id, profile.id, profile.username);
    alert(`Muted @${profile.username}`);
    setIsMenuOpen(false);
  };

  if (isLoading || !profile) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Loading trader profile...
      </div>
    );
  }

  // Check wall privacy
  const isPrivateWallLocked =
    profile.privacySettings?.isPrivateAccount &&
    !isOwner &&
    followStatus !== 'FOLLOWING';

  return (
    <div className="flex flex-col gap-4 text-[#e2e8f0]">
      {/* Top Nav Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community Feed</span>
        </button>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-[#0c0d10] border border-[#242424] rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Cover Photo */}
        <div className="h-40 w-full bg-[#18191e] relative">
          {profile.coverImageUrl ? (
            <img src={profile.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#17181c] via-[#20222a] to-[#0f1013]" />
          )}
        </div>

        {/* Profile Details Header */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col gap-4">
          {/* Avatar & Action Button Row */}
          <div className="flex justify-between items-end -mt-12 flex-wrap gap-3">
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#0c0d10] shadow-2xl"
              />
              {profile.isVerified && (
                <span className="absolute bottom-1 right-1 bg-[#D4AF37] text-black p-1 rounded-full shadow">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOwner ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-[#1b1c22] hover:bg-[#252730] border border-[#333] hover:border-[#D4AF37] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`px-5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow ${
                      followStatus === 'FOLLOWING'
                        ? 'bg-[#1b1c22] text-white border border-[#333] hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/40'
                        : followStatus === 'REQUESTED'
                        ? 'bg-[#222] text-slate-300 border border-[#333]'
                        : 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:from-[#F2D675] hover:to-[#D4AF37] text-black'
                    }`}
                  >
                    {followStatus === 'FOLLOWING' ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : followStatus === 'REQUESTED' ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Requested</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-2 bg-[#1b1c22] hover:bg-[#252730] text-slate-300 rounded-xl border border-[#333] transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-1 w-44 bg-[#141518] border border-[#2d2d2d] rounded-xl shadow-2xl z-30 py-1 text-xs">
                        <button
                          onClick={handleMuteUser}
                          className="w-full px-3 py-2 text-left text-slate-300 hover:bg-[#222] flex items-center gap-2"
                        >
                          <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mute @{profile.username}</span>
                        </button>
                        <button
                          onClick={handleBlockUser}
                          className="w-full px-3 py-2 text-left text-rose-400 hover:bg-[#222] flex items-center gap-2"
                        >
                          <ShieldBan className="w-3.5 h-3.5" />
                          <span>Block User</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsReportModalOpen(true);
                          }}
                          className="w-full px-3 py-2 text-left text-amber-400 hover:bg-[#222] flex items-center gap-2"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Report Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Names & Meta */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                {profile.name}
                {profile.isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" title="Verified Quant Analyst" />
                )}
              </h2>
              <span className="text-xs text-slate-400 font-mono">@{profile.username}</span>
              {profile.planTier && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase bg-[#18191e] text-[#D4AF37] border border-[rgba(212,175,55,0.3)]">
                  {profile.planTier}
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-1">{profile.bio}</p>
            )}

            {/* Meta Row: Website & Joined */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 mt-2">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#D4AF37] hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Joined {profile.joinedAt}
              </span>
            </div>

            {/* Investing Interests Chips */}
            {profile.investingInterests && profile.investingInterests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.investingInterests.map((interest) => (
                  <span
                    key={interest}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#16171c] text-slate-300 border border-[#27282f]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Social Stats Counters */}
          <div className="flex items-center gap-6 pt-3 border-t border-[#1f2025] text-xs">
            <button
              onClick={() => setFollowListType('FOLLOWERS')}
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <span className="font-bold text-white font-mono">{profile.followerCount}</span>
              <span className="text-slate-400">Followers</span>
            </button>

            <button
              onClick={() => setFollowListType('FOLLOWING')}
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <span className="font-bold text-white font-mono">{profile.followingCount}</span>
              <span className="text-slate-400">Following</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white font-mono">{posts.length}</span>
              <span className="text-slate-400">Publications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Wall Content Tabs */}
      <div className="flex border-b border-[#242424] bg-[#0c0d10] rounded-xl px-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('posts')}
          className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'posts'
              ? 'border-[#D4AF37] text-[#F2D675]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Publications ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'media'
              ? 'border-[#D4AF37] text-[#F2D675]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Charts &amp; Polls</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-3 px-4 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'bookmarks'
                ? 'border-[#D4AF37] text-[#F2D675]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Private Bookmarks ({bookmarks.length})</span>
          </button>
        )}
      </div>

      {/* Wall Stream or Locked Notice */}
      {isPrivateWallLocked ? (
        <div className="p-12 text-center bg-[#0c0d10] border border-[#242424] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#18191f] border border-[#2d2e36] flex items-center justify-center text-[#D4AF37]">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">This Account is Private</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Follow this trader to see their quantitative publications, sentiment polls, and market research.
          </p>
          <button
            onClick={handleFollowToggle}
            className="mt-2 px-5 py-2 bg-[#D4AF37] hover:bg-[#F2D675] text-black font-bold text-xs rounded-xl transition"
          >
            {followStatus === 'REQUESTED' ? 'Follow Request Sent' : 'Request to Follow'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <div className="text-center py-12 bg-[#0c0d10] border border-[#242424] rounded-2xl text-slate-500 text-xs font-mono">
                No publications posted yet.
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onSelectTicker={onSelectTicker}
                  onPostDeleted={() => loadProfileData()}
                />
              ))
            )
          )}

          {activeTab === 'media' && (
            posts.filter((p) => p.mediaType !== 'NONE').length === 0 ? (
              <div className="text-center py-12 bg-[#0c0d10] border border-[#242424] rounded-2xl text-slate-500 text-xs font-mono">
                No media attachments or sentiment polls.
              </div>
            ) : (
              posts
                .filter((p) => p.mediaType !== 'NONE')
                .map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onSelectTicker={onSelectTicker}
                    onPostDeleted={() => loadProfileData()}
                  />
                ))
            )
          )}

          {activeTab === 'bookmarks' && isOwner && (
            bookmarks.length === 0 ? (
              <div className="text-center py-12 bg-[#0c0d10] border border-[#242424] rounded-2xl text-slate-500 text-xs font-mono">
                No saved bookmarks. Click the bookmark icon on any post to save it here privately.
              </div>
            ) : (
              bookmarks.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onSelectTicker={onSelectTicker}
                  onPostDeleted={() => loadProfileData()}
                />
              ))
            )
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          currentUser={profile}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={(updated) => {
            setProfile(updated);
            if (onProfileUpdated) onProfileUpdated(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* Follow List Modal */}
      {followListType && (
        <FollowListModal
          type={followListType}
          profileUser={profile}
          currentUser={currentUser}
          onClose={() => setFollowListType(null)}
        />
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          targetType="PROFILE"
          targetId={profile.id}
          targetAuthorId={profile.id}
          targetContentSnippet={`User Profile @${profile.username}: ${profile.bio}`}
          currentUser={currentUser}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};
