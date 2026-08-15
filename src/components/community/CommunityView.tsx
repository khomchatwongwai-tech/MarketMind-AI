import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  TrendingUp,
  Clock,
  Flame,
  Bookmark,
  Search,
  Plus,
  Bell,
  Sliders,
  ShieldAlert,
  Sparkles,
  Vote,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  Radio,
  Eye,
  DollarSign,
  Filter,
} from 'lucide-react';
import { CommunityPost, CommunityUserProfile, FeedFilterType } from '../../types/community';
import { UserProfile } from '../../types/user';
import { TickerSymbol } from '../../types/market';
import { CommunityService } from '../../services/community/communityService';
import { PostCard } from './PostCard';
import { PostComposerModal } from './PostComposerModal';
import { UserProfileView } from './UserProfileView';
import { NotificationsDrawer } from './NotificationsDrawer';
import { EditProfileModal } from './EditProfileModal';
import { FINANCIAL_DISCLAIMER_TEXT } from '../../services/community/safetyGuard';

interface CommunityViewProps {
  currentUser: UserProfile;
  onSelectTicker?: (ticker: TickerSymbol) => void;
}

const POPULAR_TICKERS: string[] = ['ALL', 'SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMD', 'AMZN'];

export const CommunityView: React.FC<CommunityViewProps> = ({
  currentUser,
  onSelectTicker,
}) => {
  const [communityUser, setCommunityUser] = useState<CommunityUserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeFilter, setActiveFilter] = useState<FeedFilterType>('DISCOVER');
  const [activeTickerFilter, setActiveTickerFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Profile View State (if drilling down into a user's wall)
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // Modals
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Load Community User Profile & Feed
  const initData = useCallback(async () => {
    try {
      setIsLoading(true);
      const prof = await CommunityService.getOrCreateCommunityProfile(currentUser);
      setCommunityUser(prof);

      const notifs = CommunityService.getLocalNotifications(prof.id);
      setUnreadNotifCount(notifs.filter((n) => !n.read).length);

      const feedData = await CommunityService.getFeed({
        userId: prof.id,
        filter: activeFilter,
        tickerFilter: activeTickerFilter,
        searchQuery,
      });
      setPosts(feedData.posts);
    } catch (e) {
      console.warn('Failed to load community feed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeFilter, activeTickerFilter, searchQuery]);

  useEffect(() => {
    initData();
  }, [initData]);

  const handlePostCreated = () => {
    initData();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (!communityUser) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Initializing MarketMind Community Network...
      </div>
    );
  }

  // If a profile wall is active, render UserProfileView
  if (viewingProfileId) {
    return (
      <UserProfileView
        userId={viewingProfileId}
        currentUser={communityUser}
        onBack={() => setViewingProfileId(null)}
        onSelectTicker={onSelectTicker}
        onProfileUpdated={(updated) => {
          if (updated.id === communityUser.id) {
            setCommunityUser(updated);
          }
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 text-[#e2e8f0]">
      {/* Top Banner: Financial Safety & Transparency */}
      <div className="bg-[#0f1013] border border-[rgba(212,175,55,0.25)] rounded-xl p-3 flex items-center justify-between gap-3 shadow-[0_2px_15px_rgba(212,175,55,0.05)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center text-[#F2D675] shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Financial Community Network</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 rounded font-mono font-bold">
                COMPLIANCE MONITORED
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {FINANCIAL_DISCLAIMER_TEXT}
            </p>
          </div>
        </div>

        {/* Action Controls (Notifications, Self Profile, New Post) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 rounded-xl bg-[#16171c] hover:bg-[#202127] border border-[#2d2e36] text-slate-300 hover:text-[#D4AF37] transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-black font-bold font-mono text-[9px] flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewingProfileId(communityUser.id)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-[#16171c] hover:bg-[#202127] border border-[#2d2e36] hover:border-[#D4AF37] transition"
          >
            <img
              src={communityUser.avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover border border-[#D4AF37]"
            />
            <span className="text-xs font-bold text-white font-mono">@{communityUser.username}</span>
          </button>

          <button
            onClick={() => setIsComposerOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:from-[#F2D675] hover:to-[#D4AF37] text-black font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Post</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Feed on Left (8 cols) + Intelligence Sidebars on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Feed & Composer */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Quick Composer Trigger Card */}
          <div className="bg-[#0c0d10] border border-[#242424] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src={communityUser.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-[#2a2a2a]"
              />
              <button
                onClick={() => setIsComposerOpen(true)}
                className="flex-1 text-left bg-[#141518] hover:bg-[#1a1b20] border border-[#24252a] text-slate-400 hover:text-white text-xs px-4 py-2.5 rounded-xl transition font-medium cursor-pointer"
              >
                Share quantitative market insights, key levels, or $SPY ideas...
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#18191d] text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsComposerOpen(true)}
                  className="flex items-center gap-1.5 hover:text-[#D4AF37] transition"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Chart / Image</span>
                </button>
                <button
                  onClick={() => setIsComposerOpen(true)}
                  className="flex items-center gap-1.5 hover:text-[#D4AF37] transition"
                >
                  <Vote className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sentiment Poll</span>
                </button>
                <button
                  onClick={() => setIsComposerOpen(true)}
                  className="flex items-center gap-1.5 hover:text-[#D4AF37] transition"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>News Link</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-500">
                Markdown &amp; $TICKERS Supported
              </span>
            </div>
          </div>

          {/* Feed Filter Tabs & Search Bar */}
          <div className="bg-[#0c0d10] border border-[#242424] rounded-2xl p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Tab navigation */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold bg-[#141519] p-1 rounded-xl border border-[#24252a]">
                {(
                  [
                    { id: 'DISCOVER', label: 'Discover', icon: Sparkles },
                    { id: 'FOLLOWING', label: 'Following', icon: Users },
                    { id: 'TRENDING', label: 'Trending', icon: Flame },
                    { id: 'LATEST', label: 'Latest', icon: Clock },
                    { id: 'WATCHLIST', label: 'Watchlist', icon: Bookmark },
                    { id: 'DISCUSSIONS', label: 'Discussions', icon: Radio },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                        active
                          ? 'bg-[rgba(212,175,55,0.18)] text-[#F2D675] border border-[#D4AF37]'
                          : 'text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Refresh */}
              <button
                onClick={() => initData()}
                className="p-2 bg-[#141519] hover:bg-[#1e1f25] border border-[#24252a] text-slate-400 hover:text-white rounded-xl transition"
                title="Refresh Feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Ticker Tag Bar & Keyword Search */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#1a1b20]">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 text-[#D4AF37]" />
                  Ticker:
                </span>
                {POPULAR_TICKERS.map((t) => {
                  const active = activeTickerFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setActiveTickerFilter(t)}
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border transition ${
                        active
                          ? 'bg-[rgba(212,175,55,0.2)] text-[#F2D675] border-[#D4AF37]'
                          : 'bg-[#141519] text-slate-400 border-[#24252a] hover:text-white'
                      }`}
                    >
                      {t === 'ALL' ? 'ALL' : `$${t}`}
                    </button>
                  );
                })}
              </div>

              {/* Search input */}
              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search thoughts, $tickers, @users..."
                  className="w-full bg-[#141519] border border-[#24252a] focus:border-[#D4AF37] text-white text-xs pl-8 pr-3 py-1.5 rounded-xl transition placeholder-[#555]"
                />
              </div>
            </div>
          </div>

          {/* Posts Stream */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs bg-[#0c0d10] border border-[#242424] rounded-2xl">
                Loading quantitative community stream...
              </div>
            ) : posts.length === 0 ? (
              <div className="p-12 text-center bg-[#0c0d10] border border-[#242424] rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#141519] border border-[#24252a] flex items-center justify-center text-[#D4AF37]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Posts in this Feed View</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Be the first to publish quantitative market research or select another filter tab.
                </p>
                <button
                  onClick={() => setIsComposerOpen(true)}
                  className="mt-1 px-4 py-2 bg-[#D4AF37] hover:bg-[#F2D675] text-black font-bold text-xs rounded-xl transition"
                >
                  Create Market Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={communityUser}
                  onSelectTicker={onSelectTicker}
                  onOpenProfile={(uid) => setViewingProfileId(uid)}
                  onPostDeleted={handlePostDeleted}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Widgets (Trending Tickers, Who to Follow, Sentiment Pulse, Rules) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Widget 1: Market Sentiment Pulse */}
          <div className="bg-[#0c0d10] border border-[#242424] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Community Sentiment Pulse
              </h3>
              <span className="text-[10px] font-mono text-[#D4AF37] bg-[rgba(212,175,55,0.1)] px-2 py-0.5 rounded border border-[rgba(212,175,55,0.2)]">
                LIVE
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-slate-300 font-bold">$SPY S&amp;P 500</span>
                  <span className="text-emerald-400 font-bold">72% Bullish</span>
                </div>
                <div className="w-full bg-[#18191e] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '72%' }} />
                  <div className="bg-rose-500 h-full" style={{ width: '28%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-slate-300 font-bold">$NVDA Nvidia</span>
                  <span className="text-emerald-400 font-bold">81% Bullish</span>
                </div>
                <div className="w-full bg-[#18191e] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '81%' }} />
                  <div className="bg-rose-500 h-full" style={{ width: '19%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-slate-300 font-bold">$TSLA Tesla</span>
                  <span className="text-rose-400 font-bold">58% Bearish</span>
                </div>
                <div className="w-full bg-[#18191e] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '42%' }} />
                  <div className="bg-rose-500 h-full" style={{ width: '58%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Who to Follow */}
          <div className="bg-[#0c0d10] border border-[#242424] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              Verified Quantitative Analysts
            </h3>

            <div className="space-y-3 pt-1">
              {[
                {
                  id: 'usr_admin',
                  name: 'Khomchat Wongwai',
                  username: 'khomchat',
                  title: 'Lead Quant Architect',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                },
                {
                  id: 'usr_citadel_quant',
                  name: 'Elena Rostova, CFA',
                  username: 'elena_quant',
                  title: 'Senior Derivatives Strategist',
                  avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                },
                {
                  id: 'usr_macro_sage',
                  name: 'David Vance',
                  username: 'macrovance',
                  title: 'Fixed Income & Macro Analyst',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                },
              ].map((analyst) => (
                <div key={analyst.id} className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => setViewingProfileId(analyst.id)}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <img
                      src={analyst.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-[#2d2d2d] group-hover:border-[#D4AF37] transition"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-[#F2D675] flex items-center gap-1 truncate">
                        {analyst.name}
                        <CheckCircle2 className="w-3 h-3 text-[#D4AF37] shrink-0" />
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate">@{analyst.username}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingProfileId(analyst.id)}
                    className="px-2.5 py-1 bg-[#18191f] hover:bg-[#252630] border border-[#2e2f38] text-xs font-bold text-slate-300 hover:text-white rounded-lg transition"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Trending Tickers */}
          <div className="bg-[#0c0d10] border border-[#242424] rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              Trending Discussions
            </h3>

            <div className="space-y-2 pt-1">
              {[
                { ticker: 'SPY', name: 'S&P 500 ETF Trust', posts: '1.4k posts', change: '+0.84%' },
                { ticker: 'NVDA', name: 'Nvidia Corp', posts: '980 posts', change: '+3.12%' },
                { ticker: 'QQQ', name: 'Invesco QQQ Trust', posts: '740 posts', change: '+1.10%' },
                { ticker: 'AAPL', name: 'Apple Inc', posts: '520 posts', change: '-0.24%' },
              ].map((item) => (
                <button
                  key={item.ticker}
                  onClick={() => {
                    setActiveTickerFilter(item.ticker);
                    if (onSelectTicker) onSelectTicker(item.ticker as TickerSymbol);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#141519] border border-transparent hover:border-[#26272e] transition text-left group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#F2D675] font-mono">
                      ${item.ticker}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.name}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">{item.change}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{item.posts}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Widget 4: Compliance & Guidelines */}
          <div className="bg-[#090a0c] border border-[#1e2025] rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-slate-400 leading-relaxed">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D4AF37]" />
              Community Safety Principles
            </h4>
            <ul className="space-y-1.5 text-[11px] list-disc pl-4 text-slate-400">
              <li>No pump-and-dump coordination or claims of guaranteed profit.</li>
              <li>Always disclose open financial positions when sharing trade ideas.</li>
              <li>Portfolio balances and broker API tokens remain private by default.</li>
              <li>All reported posts are audited by compliance staff.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Composer Modal */}
      {isComposerOpen && (
        <PostComposerModal
          currentUser={communityUser}
          onClose={() => setIsComposerOpen(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationsDrawer
        currentUser={communityUser}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectProfile={(uid) => {
          setViewingProfileId(uid);
          setIsNotificationsOpen(false);
        }}
      />

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <EditProfileModal
          currentUser={communityUser}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={(updated) => {
            setCommunityUser(updated);
            setIsEditProfileOpen(false);
          }}
        />
      )}
    </div>
  );
};
