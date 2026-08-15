import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  onSnapshot,
  increment,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../config/firebase';
import {
  CommunityUserProfile,
  CommunityPost,
  CommunityComment,
  PostReaction,
  PostBookmark,
  FollowRelationship,
  FollowRequest,
  CommunityNotification,
  UserBlock,
  UserMute,
  CommunityReport,
  CommunityModerationAction,
  FeedFilterType,
  PositionDisclosure,
  ContentMediaType,
} from '../../types/community';
import { UserProfile } from '../../types/user';
import { TickerSymbol } from '../../types/market';
import { CommunitySafetyGuard, FINANCIAL_DISCLAIMER_TEXT } from './safetyGuard';

const STORAGE_PREFIX = 'marketmind_social_';

// Initial Mock Community Profiles and Posts for development & offline resilience
const INITIAL_COMMUNITY_PROFILES: Record<string, CommunityUserProfile> = {
  usr_admin: {
    id: 'usr_admin',
    email: 'khomchatwongwai@gmail.com',
    name: 'Khomchat Wongwai',
    username: 'khomchat',
    bio: 'Lead Quant Architect @ MarketMind AI. Institutional order flow, gamma curves, and macro regime forecasting.',
    website: 'https://marketmind.ai',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
    isVerified: true,
    role: 'admin',
    plan: 'premium',
    planTier: 'PREMIUM',
    investingInterests: ['Equities', 'Options Spreads', 'Macroeconomics', 'Quantitative Models'],
    followerCount: 1420,
    followingCount: 88,
    postCount: 19,
    joinedAt: '2025-01-15',
    privacySettings: {
      isPrivateAccount: false,
      whoCanFollow: 'EVERYONE',
      whoCanComment: 'EVERYONE',
      whoCanMention: 'EVERYONE',
      whoCanViewProfileWall: 'EVERYONE',
      hideFollowLists: false,
      emailNotifications: true,
      pushNotifications: true,
    },
  },
  usr_citadel_quant: {
    id: 'usr_citadel_quant',
    email: 'alpha_desk@nyse-floor.com',
    name: 'Elena Rostova, CFA',
    username: 'elena_quant',
    bio: 'Senior Derivatives Strategist. Volatility surfaces, 0DTE gamma exposures & S&P 500 liquidity clustering.',
    website: 'https://volatilityresearch.org',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1200&auto=format&fit=crop&q=80',
    isVerified: true,
    role: 'user',
    plan: 'institutional',
    planTier: 'INSTITUTIONAL',
    investingInterests: ['Options', 'SPY', 'QQQ', 'Volatility'],
    followerCount: 2890,
    followingCount: 142,
    postCount: 42,
    joinedAt: '2025-03-10',
    privacySettings: {
      isPrivateAccount: false,
      whoCanFollow: 'EVERYONE',
      whoCanComment: 'EVERYONE',
      whoCanMention: 'EVERYONE',
      whoCanViewProfileWall: 'EVERYONE',
      hideFollowLists: false,
      emailNotifications: true,
      pushNotifications: true,
    },
  },
  usr_macro_sage: {
    id: 'usr_macro_sage',
    email: 'macro@fedtracker.com',
    name: 'David Vance',
    username: 'macrovance',
    bio: 'Fixed income & cross-asset liquidity analyst. Tracking Treasury yield curve inversions and Fed balance sheet shifts.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&auto=format&fit=crop&q=80',
    isVerified: true,
    role: 'user',
    plan: 'pro',
    planTier: 'PRO',
    investingInterests: ['Macro', 'Treasuries', 'Commodities', 'Inflation'],
    followerCount: 1980,
    followingCount: 95,
    postCount: 31,
    joinedAt: '2025-04-12',
    privacySettings: {
      isPrivateAccount: false,
      whoCanFollow: 'EVERYONE',
      whoCanComment: 'EVERYONE',
      whoCanMention: 'EVERYONE',
      whoCanViewProfileWall: 'EVERYONE',
      hideFollowLists: false,
      emailNotifications: true,
      pushNotifications: true,
    },
  },
};

const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post_alpha_01',
    authorId: 'usr_admin',
    authorName: 'Khomchat Wongwai',
    authorUsername: 'khomchat',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorIsVerified: true,
    authorPlan: 'PREMIUM',
    content:
      'SPY intraday analysis: $SPY is currently pinning near the $514.80 R1 pivot. Cumulative delta volume is positive (+18.4k contracts) while dealer gamma flips into net long territory above $515.00. Watching $QQQ and $NVDA for afternoon continuation.\n\nKey levels on my radar:\n• Pivot Support: $512.40\n• Gamma Magnet: $515.00\n• Major Overhead Wall: $516.50',
    tickers: ['SPY', 'QQQ', 'NVDA'],
    hashtags: ['sp500', 'gammalevels', 'quantanalysis'],
    mentions: [],
    mediaType: 'POLL',
    poll: {
      question: 'Where will $SPY close by Friday EOD?',
      options: [
        { id: 'opt_1', text: 'Above $516.50 (Bullish Breakout)', votes: 84, voterIds: [] },
        { id: 'opt_2', text: 'Pin $514 - $516 (Gamma Clamp)', votes: 142, voterIds: [] },
        { id: 'opt_3', text: 'Pullback below $512 (Bear Reversal)', votes: 31, voterIds: [] },
      ],
      expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      totalVotes: 257,
    },
    positionDisclosure: 'LONG',
    isAiGenerated: false,
    isSponsored: false,
    disableComments: false,
    limitCommentsToFollowers: false,
    likeCount: 68,
    bullCount: 42,
    bearCount: 5,
    commentCount: 9,
    repostCount: 14,
    bookmarkCount: 27,
    isPinned: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'ACTIVE',
    financialDisclaimer: FINANCIAL_DISCLAIMER_TEXT,
  },
  {
    id: 'post_alpha_02',
    authorId: 'usr_citadel_quant',
    authorName: 'Elena Rostova, CFA',
    authorUsername: 'elena_quant',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    authorIsVerified: true,
    authorPlan: 'INSTITUTIONAL',
    content:
      'Institutional options flow report on $NVDA: Observed massive repeated $130.00 Call sweep orders expiring next Friday for a combined $4.8M premium executed directly on the ask. VIX term structure remains upward sloping, implying low near-term shock risk. Hedged with slight $TSLA short delta.',
    tickers: ['NVDA', 'TSLA', 'QQQ'],
    hashtags: ['optionsflow', 'darkpool', 'nvda'],
    mentions: ['khomchat'],
    mediaType: 'NONE',
    positionDisclosure: 'OPTIONS_SPREAD' as PositionDisclosure,
    isAiGenerated: false,
    isSponsored: false,
    disableComments: false,
    limitCommentsToFollowers: false,
    likeCount: 54,
    bullCount: 38,
    bearCount: 2,
    commentCount: 7,
    repostCount: 11,
    bookmarkCount: 19,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'ACTIVE',
    financialDisclaimer: FINANCIAL_DISCLAIMER_TEXT,
  },
  {
    id: 'post_alpha_03',
    authorId: 'usr_macro_sage',
    authorName: 'David Vance',
    authorUsername: 'macrovance',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authorIsVerified: true,
    authorPlan: 'PRO',
    content:
      'Fed Watch: 10-Year Treasury Yields cooled down 4 bps to 4.22%. Historically, real yield stabilization provides strong tailwinds for large-cap tech multiples like $AAPL and $MSFT. Reviewing morning headline data from BLS.',
    tickers: ['AAPL', 'MSFT', 'SPY'],
    hashtags: ['macro', 'fed', 'interestrates'],
    mentions: [],
    mediaType: 'NEWS_LINK',
    newsLink: {
      title: 'Treasury Yields Retreat Following Soft Producer Price Index',
      source: 'Bloomberg Financial Markets',
      url: 'https://bloomberg.com',
      publisherAttribution: 'Original source: Bloomberg Terminal via RSS Feed',
      snippet: 'US government debt rallied as wholesale inflation metrics met analyst projections.',
    },
    positionDisclosure: 'NEUTRAL',
    isAiGenerated: false,
    isSponsored: false,
    disableComments: false,
    limitCommentsToFollowers: false,
    likeCount: 39,
    bullCount: 22,
    bearCount: 4,
    commentCount: 4,
    repostCount: 6,
    bookmarkCount: 12,
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    status: 'ACTIVE',
    financialDisclaimer: FINANCIAL_DISCLAIMER_TEXT,
  },
];

const INITIAL_COMMENTS: Record<string, CommunityComment[]> = {
  post_alpha_01: [
    {
      id: 'comm_01',
      postId: 'post_alpha_01',
      authorId: 'usr_citadel_quant',
      authorName: 'Elena Rostova, CFA',
      authorUsername: 'elena_quant',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      authorIsVerified: true,
      content: 'Agree on the $515 magnet. 0DTE open interest at $515 Call strike has surged past 45,000 contracts this morning.',
      mentions: [],
      likeCount: 12,
      replyCount: 1,
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      status: 'ACTIVE',
    },
    {
      id: 'comm_02',
      postId: 'post_alpha_01',
      parentCommentId: 'comm_01',
      authorId: 'usr_admin',
      authorName: 'Khomchat Wongwai',
      authorUsername: 'khomchat',
      authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorIsVerified: true,
      content: '@elena_quant Exactly right. Market makers will likely suppress IV crush right after 2:30 PM ET.',
      mentions: ['elena_quant'],
      likeCount: 8,
      replyCount: 0,
      createdAt: new Date(Date.now() - 3600000 * 1.1).toISOString(),
      status: 'ACTIVE',
    },
  ],
};

export class CommunityService {
  // --- USER PROFILES ---
  static getLocalProfiles(): Record<string, CommunityUserProfile> {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'profiles');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse local community profiles', e);
    }
    return INITIAL_COMMUNITY_PROFILES;
  }

  static saveLocalProfiles(profiles: Record<string, CommunityUserProfile>): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'profiles', JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save community profiles to storage', e);
    }
  }

  static async getProfile(userId: string): Promise<CommunityUserProfile | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        const data = snap.data();
        if (data.username) {
          return data as CommunityUserProfile;
        }
      }
    } catch (error) {
      // Non-fatal fallback to local store
      console.warn('Firestore getProfile warning, fallback to cache:', error);
    }

    const localProfiles = this.getLocalProfiles();
    return localProfiles[userId] || null;
  }

  static async getProfileByUsername(username: string): Promise<CommunityUserProfile | null> {
    const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '');
    const path = 'users';
    try {
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername), firestoreLimit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as CommunityUserProfile;
      }
    } catch (error) {
      console.warn('Firestore getProfileByUsername warning, fallback to cache:', error);
    }

    const localProfiles = Object.values(this.getLocalProfiles());
    return localProfiles.find((p) => p.username.toLowerCase() === cleanUsername) || null;
  }

  static async getOrCreateCommunityProfile(currentUser: UserProfile): Promise<CommunityUserProfile> {
    const existing = await this.getProfile(currentUser.id);
    if (existing) return existing;

    const baseUsername = currentUser.email
      ? currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : 'trader_' + currentUser.id.slice(0, 5);

    const isMasterAdmin = currentUser.email.toLowerCase() === 'khomchatwongwai@gmail.com';

    const newProfile: CommunityUserProfile = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name || 'MarketMind Trader',
      username: baseUsername,
      bio: 'MarketMind AI quantitative market analyst and active trader.',
      avatarUrl: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80',
      isVerified: isMasterAdmin, // Only master admin is verified by default
      role: isMasterAdmin ? 'admin' : 'user',
      plan: currentUser.plan,
      planTier: currentUser.planTier,
      investingInterests: ['Equities', 'Options', 'Macro'],
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      privacySettings: {
        isPrivateAccount: false,
        whoCanFollow: 'EVERYONE',
        whoCanComment: 'EVERYONE',
        whoCanMention: 'EVERYONE',
        whoCanViewProfileWall: 'EVERYONE',
        hideFollowLists: false,
        emailNotifications: true,
        pushNotifications: true,
      },
    };

    await this.updateProfile(currentUser.id, newProfile, currentUser);
    return newProfile;
  }

  static async updateProfile(
    userId: string,
    updates: Partial<CommunityUserProfile>,
    actingUser?: UserProfile
  ): Promise<CommunityUserProfile> {
    const existing = (await this.getProfile(userId)) || (actingUser ? await this.getOrCreateCommunityProfile(actingUser) : null);
    if (!existing) {
      throw new Error('User profile not found.');
    }

    // Security Gate: Regular users are FORBIDDEN from elevating verification badge or role
    const isMasterAdmin = actingUser?.email.toLowerCase() === 'khomchatwongwai@gmail.com' || actingUser?.role === 'admin';
    const sanitizedUpdates: Partial<CommunityUserProfile> = { ...updates };

    if (!isMasterAdmin) {
      delete sanitizedUpdates.isVerified;
      delete sanitizedUpdates.role;
    }

    // Validate username if being updated
    if (sanitizedUpdates.username && sanitizedUpdates.username !== existing.username) {
      const val = CommunitySafetyGuard.validateUsername(sanitizedUpdates.username);
      if (!val.valid) {
        throw new Error(val.error);
      }
      sanitizedUpdates.username = val.normalized;
    }

    const updatedProfile: CommunityUserProfile = {
      ...existing,
      ...sanitizedUpdates,
    };

    // Save to local cache
    const localProfiles = this.getLocalProfiles();
    localProfiles[userId] = updatedProfile;
    this.saveLocalProfiles(localProfiles);

    // Save to Firestore
    const path = `users/${userId}`;
    try {
      await setDoc(doc(db, 'users', userId), updatedProfile, { merge: true });
    } catch (error) {
      console.warn('Firestore profile sync error:', error);
    }

    return updatedProfile;
  }

  // --- POSTS ---
  static getLocalPosts(): CommunityPost[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'posts');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse local community posts', e);
    }
    return INITIAL_COMMUNITY_POSTS;
  }

  static saveLocalPosts(posts: CommunityPost[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'posts', JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save community posts', e);
    }
  }

  static async getFeed(params: {
    userId: string;
    filter: FeedFilterType;
    limitCount?: number;
    tickerFilter?: string;
    searchQuery?: string;
    userWatchlistTickers?: string[];
  }): Promise<{ posts: CommunityPost[]; hasMore: boolean }> {
    const { userId, filter, limitCount = 20, tickerFilter, searchQuery, userWatchlistTickers = ['SPY', 'QQQ', 'NVDA'] } = params;

    let allPosts = this.getLocalPosts();

    // Check user mutes and blocks
    const mutedIds = new Set(this.getLocalMutes(userId).map((m) => m.mutedId));
    const blockedIds = new Set(this.getLocalBlocks(userId).map((b) => b.blockedId));

    // Filter out removed or blocked/muted content
    allPosts = allPosts.filter(
      (p) => p.status !== 'REMOVED' && !mutedIds.has(p.authorId) && !blockedIds.has(p.authorId)
    );

    // Filter by ticker tag if specified
    if (tickerFilter && tickerFilter !== 'ALL') {
      const t = tickerFilter.toUpperCase();
      allPosts = allPosts.filter((p) => p.tickers.includes(t as TickerSymbol) || p.content.toUpperCase().includes('$' + t));
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      allPosts = allPosts.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.authorUsername.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.hashtags.some((h) => h.includes(q))
      );
    }

    // Apply Tab logic
    if (filter === 'FOLLOWING') {
      const followingIds = new Set(this.getLocalFollows(userId).map((f) => f.followingId));
      followingIds.add(userId); // Include own posts in following feed
      allPosts = allPosts.filter((p) => followingIds.has(p.authorId));
    } else if (filter === 'WATCHLIST') {
      const watchlistSet = new Set(userWatchlistTickers.map((t) => t.toUpperCase()));
      allPosts = allPosts.filter((p) => p.tickers.some((t) => watchlistSet.has(t.toUpperCase())));
    } else if (filter === 'TRENDING') {
      // Spam-resistant ranking: likes + 2*comments + reposts - time decay
      allPosts = [...allPosts].sort((a, b) => {
        const scoreA = a.likeCount + a.commentCount * 2 + a.repostCount * 1.5;
        const scoreB = b.likeCount + b.commentCount * 2 + b.repostCount * 1.5;
        return scoreB - scoreA;
      });
    } else if (filter === 'LATEST') {
      allPosts = [...allPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filter === 'DISCUSSIONS') {
      allPosts = allPosts.filter((p) => p.tickers.length > 0 || p.commentCount > 0);
    }

    return {
      posts: allPosts.slice(0, limitCount),
      hasMore: allPosts.length > limitCount,
    };
  }

  static async getPost(postId: string): Promise<CommunityPost | null> {
    const local = this.getLocalPosts().find((p) => p.id === postId);
    if (local) return local;

    try {
      const snap = await getDoc(doc(db, 'community_posts', postId));
      if (snap.exists()) return snap.data() as CommunityPost;
    } catch (e) {
      console.warn('Firestore getPost fallback:', e);
    }
    return null;
  }

  static async createPost(
    postData: {
      author: CommunityUserProfile;
      content: string;
      tickers?: TickerSymbol[];
      mediaType?: ContentMediaType;
      mediaUrl?: string;
      poll?: { question: string; options: string[]; durationDays: number };
      newsLink?: { title: string; source: string; url: string; publisherAttribution: string; snippet?: string };
      positionDisclosure?: PositionDisclosure;
      isAiGenerated?: boolean;
      isSponsored?: boolean;
      disableComments?: boolean;
      limitCommentsToFollowers?: boolean;
    }
  ): Promise<CommunityPost> {
    const {
      author,
      content,
      tickers = [],
      mediaType = 'NONE',
      mediaUrl,
      poll,
      newsLink,
      positionDisclosure = 'NONE',
      isAiGenerated = false,
      isSponsored = false,
      disableComments = false,
      limitCommentsToFollowers = false,
    } = postData;

    // Rate Limiting: Max 5 posts per minute
    const userPosts = this.getLocalPosts().filter(
      (p) => p.authorId === author.id && Date.now() - new Date(p.createdAt).getTime() < 60000
    );
    if (userPosts.length >= 5) {
      throw new Error('Rate limit exceeded: You can publish up to 5 posts per minute. Please wait a moment.');
    }

    // Safety scan
    const scan = CommunitySafetyGuard.scanContent(content);
    if (!scan.isSafe) {
      throw new Error(scan.blockReason || 'Content flagged by MarketMind Financial Safety Guard.');
    }

    // Extract rich tags
    const extractedTickers = Array.from(new Set([...tickers, ...CommunitySafetyGuard.extractTickers(content)]));
    const hashtags = CommunitySafetyGuard.extractHashtags(content);
    const mentions = CommunitySafetyGuard.extractMentions(content);

    const postId = 'post_' + Math.random().toString(36).substring(2, 11);

    let structuredPoll;
    if (poll && poll.options.length >= 2) {
      structuredPoll = {
        question: poll.question.trim(),
        options: poll.options.map((opt, i) => ({
          id: 'opt_' + (i + 1),
          text: opt.trim(),
          votes: 0,
          voterIds: [],
        })),
        expiresAt: new Date(Date.now() + (poll.durationDays || 3) * 86400000).toISOString(),
        totalVotes: 0,
      };
    }

    const newPost: CommunityPost = {
      id: postId,
      authorId: author.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatarUrl: author.avatarUrl,
      authorIsVerified: author.isVerified,
      authorPlan: author.planTier || author.plan.toUpperCase(),
      content: content.trim(),
      tickers: extractedTickers,
      hashtags,
      mentions,
      mediaType,
      mediaUrl,
      poll: structuredPoll,
      newsLink,
      positionDisclosure,
      isAiGenerated,
      isSponsored,
      disableComments,
      limitCommentsToFollowers,
      likeCount: 0,
      bullCount: 0,
      bearCount: 0,
      commentCount: 0,
      repostCount: 0,
      bookmarkCount: 0,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      financialDisclaimer: FINANCIAL_DISCLAIMER_TEXT,
    };

    // Save locally
    const posts = this.getLocalPosts();
    posts.unshift(newPost);
    this.saveLocalPosts(posts);

    // Update author post count
    author.postCount += 1;
    this.updateProfile(author.id, { postCount: author.postCount });

    // Send in-app notifications to mentioned users
    for (const mentionUsername of mentions) {
      const targetUser = await this.getProfileByUsername(mentionUsername);
      if (targetUser && targetUser.id !== author.id) {
        await this.createNotification({
          userId: targetUser.id,
          type: 'MENTION',
          actorId: author.id,
          actorName: author.name,
          actorUsername: author.username,
          actorAvatarUrl: author.avatarUrl,
          postId: newPost.id,
          message: `@${author.username} mentioned you in a market post`,
        });
      }
    }

    // Save to Firestore
    try {
      await setDoc(doc(db, 'community_posts', postId), newPost);
    } catch (e) {
      console.warn('Firestore createPost sync error:', e);
    }

    return newPost;
  }

  static async editPost(postId: string, userId: string, newContent: string): Promise<CommunityPost> {
    const posts = this.getLocalPosts();
    const target = posts.find((p) => p.id === postId);
    if (!target) throw new Error('Post not found');
    if (target.authorId !== userId) throw new Error('Unauthorized: You can only edit your own posts.');

    const scan = CommunitySafetyGuard.scanContent(newContent);
    if (!scan.isSafe) {
      throw new Error(scan.blockReason || 'Edited content violates financial safety policy.');
    }

    target.content = newContent.trim();
    target.tickers = CommunitySafetyGuard.extractTickers(newContent);
    target.hashtags = CommunitySafetyGuard.extractHashtags(newContent);
    target.isEdited = true;
    target.updatedAt = new Date().toISOString();

    this.saveLocalPosts(posts);

    try {
      await updateDoc(doc(db, 'community_posts', postId), {
        content: target.content,
        tickers: target.tickers,
        hashtags: target.hashtags,
        isEdited: true,
        updatedAt: target.updatedAt,
      });
    } catch (e) {
      console.warn('Firestore editPost error:', e);
    }

    return target;
  }

  static async deletePost(postId: string, userId: string, isAdmin = false): Promise<void> {
    const posts = this.getLocalPosts();
    const targetIndex = posts.findIndex((p) => p.id === postId);
    if (targetIndex === -1) return;

    const target = posts[targetIndex];
    if (target.authorId !== userId && !isAdmin) {
      throw new Error('Unauthorized: You can only delete your own posts.');
    }

    posts.splice(targetIndex, 1);
    this.saveLocalPosts(posts);

    try {
      await deleteDoc(doc(db, 'community_posts', postId));
    } catch (e) {
      console.warn('Firestore deletePost error:', e);
    }
  }

  static async votePoll(postId: string, optionId: string, userId: string): Promise<CommunityPost> {
    const posts = this.getLocalPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post || !post.poll) throw new Error('Poll not found');

    // Check if expired
    if (new Date(post.poll.expiresAt).getTime() < Date.now()) {
      throw new Error('This poll has expired and is no longer accepting votes.');
    }

    // Check if user already voted in any option
    for (const opt of post.poll.options) {
      if (opt.voterIds.includes(userId)) {
        throw new Error('You have already cast your vote in this poll.');
      }
    }

    const targetOption = post.poll.options.find((opt) => opt.id === optionId);
    if (!targetOption) throw new Error('Option not found');

    targetOption.votes += 1;
    targetOption.voterIds.push(userId);
    post.poll.totalVotes += 1;

    this.saveLocalPosts(posts);

    try {
      await updateDoc(doc(db, 'community_posts', postId), {
        poll: post.poll,
      });
    } catch (e) {
      console.warn('Firestore votePoll sync error:', e);
    }

    return post;
  }

  // --- REACTIONS ---
  static getLocalReactions(): Record<string, PostReaction[]> {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'reactions');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  }

  static saveLocalReactions(reactions: Record<string, PostReaction[]>): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'reactions', JSON.stringify(reactions));
    } catch (e) {}
  }

  static async toggleReaction(
    postId: string,
    userId: string,
    reactionType: 'LIKE' | 'BULL' | 'BEAR',
    userProfile: CommunityUserProfile
  ): Promise<{ userReaction: 'LIKE' | 'BULL' | 'BEAR' | null; post: CommunityPost }> {
    const allReactions = this.getLocalReactions();
    const postReactions = allReactions[postId] || [];
    const existingIndex = postReactions.findIndex((r) => r.userId === userId);

    const posts = this.getLocalPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    let currentReaction: 'LIKE' | 'BULL' | 'BEAR' | null = null;

    if (existingIndex >= 0) {
      const prevType = postReactions[existingIndex].reactionType;
      if (prevType === reactionType) {
        // Toggle OFF
        postReactions.splice(existingIndex, 1);
        if (prevType === 'LIKE') post.likeCount = Math.max(0, post.likeCount - 1);
        if (prevType === 'BULL') post.bullCount = Math.max(0, post.bullCount - 1);
        if (prevType === 'BEAR') post.bearCount = Math.max(0, post.bearCount - 1);
        currentReaction = null;
      } else {
        // Switch reaction
        if (prevType === 'LIKE') post.likeCount = Math.max(0, post.likeCount - 1);
        if (prevType === 'BULL') post.bullCount = Math.max(0, post.bullCount - 1);
        if (prevType === 'BEAR') post.bearCount = Math.max(0, post.bearCount - 1);

        postReactions[existingIndex].reactionType = reactionType;
        if (reactionType === 'LIKE') post.likeCount += 1;
        if (reactionType === 'BULL') post.bullCount += 1;
        if (reactionType === 'BEAR') post.bearCount += 1;
        currentReaction = reactionType;
      }
    } else {
      // Add new reaction
      postReactions.push({
        id: `${postId}_${userId}`,
        postId,
        userId,
        reactionType,
        createdAt: new Date().toISOString(),
      });
      if (reactionType === 'LIKE') post.likeCount += 1;
      if (reactionType === 'BULL') post.bullCount += 1;
      if (reactionType === 'BEAR') post.bearCount += 1;
      currentReaction = reactionType;

      // Notify post author if not self
      if (post.authorId !== userId) {
        await this.createNotification({
          userId: post.authorId,
          type: 'POST_REACTION',
          actorId: userId,
          actorName: userProfile.name,
          actorUsername: userProfile.username,
          actorAvatarUrl: userProfile.avatarUrl,
          postId: post.id,
          message: `@${userProfile.username} reacted ${reactionType === 'BULL' ? '🟢 Bullish' : reactionType === 'BEAR' ? '🔴 Bearish' : '❤️ Liked'} to your post`,
        });
      }
    }

    allReactions[postId] = postReactions;
    this.saveLocalReactions(allReactions);
    this.saveLocalPosts(posts);

    return { userReaction: currentReaction, post };
  }

  static getUserReaction(postId: string, userId: string): 'LIKE' | 'BULL' | 'BEAR' | null {
    const postReactions = this.getLocalReactions()[postId] || [];
    const r = postReactions.find((item) => item.userId === userId);
    return r ? r.reactionType : null;
  }

  // --- COMMENTS & THREADING ---
  static getLocalComments(): Record<string, CommunityComment[]> {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'comments');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_COMMENTS;
  }

  static saveLocalComments(comments: Record<string, CommunityComment[]>): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'comments', JSON.stringify(comments));
    } catch (e) {}
  }

  static async getComments(postId: string): Promise<CommunityComment[]> {
    const all = this.getLocalComments();
    const list = all[postId] || [];
    return list.filter((c) => c.status !== 'REMOVED');
  }

  static async addComment(params: {
    postId: string;
    parentCommentId?: string;
    author: CommunityUserProfile;
    content: string;
  }): Promise<CommunityComment> {
    const { postId, parentCommentId, author, content } = params;

    const posts = this.getLocalPosts();
    const post = posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (post.disableComments) {
      throw new Error('Comments are disabled for this post by the author.');
    }

    if (post.limitCommentsToFollowers) {
      const isFollower = this.isFollowing(author.id, post.authorId);
      if (!isFollower && author.id !== post.authorId) {
        throw new Error('This author has restricted comments to followers only.');
      }
    }

    const scan = CommunitySafetyGuard.scanContent(content);
    if (!scan.isSafe) {
      throw new Error(scan.blockReason || 'Comment flagged by MarketMind Safety Guard.');
    }

    const mentions = CommunitySafetyGuard.extractMentions(content);
    const commentId = 'comm_' + Math.random().toString(36).substring(2, 9);

    const newComment: CommunityComment = {
      id: commentId,
      postId,
      parentCommentId,
      authorId: author.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatarUrl: author.avatarUrl,
      authorIsVerified: author.isVerified,
      content: content.trim(),
      mentions,
      likeCount: 0,
      replyCount: 0,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    const allComments = this.getLocalComments();
    const postComments = allComments[postId] || [];
    postComments.push(newComment);

    if (parentCommentId) {
      const parent = postComments.find((c) => c.id === parentCommentId);
      if (parent) parent.replyCount += 1;
    }

    allComments[postId] = postComments;
    this.saveLocalComments(allComments);

    // Increment comment count on post
    post.commentCount += 1;
    this.saveLocalPosts(posts);

    // Notify post author
    if (post.authorId !== author.id) {
      await this.createNotification({
        userId: post.authorId,
        type: parentCommentId ? 'COMMENT_REPLY' : 'NEW_COMMENT',
        actorId: author.id,
        actorName: author.name,
        actorUsername: author.username,
        actorAvatarUrl: author.avatarUrl,
        postId: post.id,
        commentId,
        message: `@${author.username} commented on your post: "${content.slice(0, 60)}..."`,
      });
    }

    return newComment;
  }

  static async deleteComment(postId: string, commentId: string, userId: string, isAdmin = false): Promise<void> {
    const allComments = this.getLocalComments();
    const postComments = allComments[postId] || [];
    const targetIndex = postComments.findIndex((c) => c.id === commentId);
    if (targetIndex === -1) return;

    const target = postComments[targetIndex];
    const post = this.getLocalPosts().find((p) => p.id === postId);

    // Either comment author, post owner, or admin can delete
    if (target.authorId !== userId && post?.authorId !== userId && !isAdmin) {
      throw new Error('Unauthorized to delete this comment.');
    }

    target.status = 'REMOVED';
    this.saveLocalComments(allComments);

    if (post) {
      post.commentCount = Math.max(0, post.commentCount - 1);
      this.saveLocalPosts(this.getLocalPosts());
    }
  }

  // --- REPOSTS & BOOKMARKS ---
  static async repost(
    postId: string,
    author: CommunityUserProfile,
    quoteText?: string
  ): Promise<CommunityPost> {
    const originalPost = await this.getPost(postId);
    if (!originalPost) throw new Error('Original post not found');

    const newPostId = 'repost_' + Math.random().toString(36).substring(2, 10);
    const content = quoteText ? quoteText.trim() : `Reposted from @${originalPost.authorUsername}`;

    const newPost: CommunityPost = {
      id: newPostId,
      authorId: author.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatarUrl: author.avatarUrl,
      authorIsVerified: author.isVerified,
      authorPlan: author.planTier || author.plan.toUpperCase(),
      content,
      tickers: originalPost.tickers,
      hashtags: originalPost.hashtags,
      mentions: [originalPost.authorUsername],
      mediaType: 'NONE',
      positionDisclosure: 'NONE',
      isAiGenerated: false,
      isSponsored: false,
      disableComments: false,
      limitCommentsToFollowers: false,
      likeCount: 0,
      bullCount: 0,
      bearCount: 0,
      commentCount: 0,
      repostCount: 0,
      bookmarkCount: 0,
      repostedPost: originalPost,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      financialDisclaimer: FINANCIAL_DISCLAIMER_TEXT,
    };

    const posts = this.getLocalPosts();
    posts.unshift(newPost);

    // Increment original post's repost count
    const targetOriginal = posts.find((p) => p.id === postId);
    if (targetOriginal) {
      targetOriginal.repostCount += 1;
    }

    this.saveLocalPosts(posts);

    // Notify original author
    if (originalPost.authorId !== author.id) {
      await this.createNotification({
        userId: originalPost.authorId,
        type: 'REPOST',
        actorId: author.id,
        actorName: author.name,
        actorUsername: author.username,
        actorAvatarUrl: author.avatarUrl,
        postId: newPostId,
        message: `@${author.username} reposted your financial analysis`,
      });
    }

    return newPost;
  }

  static getLocalBookmarks(userId: string): PostBookmark[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'bookmarks_' + userId);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalBookmarks(userId: string, bookmarks: PostBookmark[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'bookmarks_' + userId, JSON.stringify(bookmarks));
    } catch (e) {}
  }

  static async toggleBookmark(userId: string, post: CommunityPost): Promise<boolean> {
    const bookmarks = this.getLocalBookmarks(userId);
    const existingIndex = bookmarks.findIndex((b) => b.postId === post.id);

    const posts = this.getLocalPosts();
    const targetPost = posts.find((p) => p.id === post.id);

    let isBookmarked = false;
    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1);
      if (targetPost) targetPost.bookmarkCount = Math.max(0, targetPost.bookmarkCount - 1);
      isBookmarked = false;
    } else {
      bookmarks.unshift({
        id: `bm_${userId}_${post.id}`,
        userId,
        postId: post.id,
        createdAt: new Date().toISOString(),
        postSnapshot: post,
      });
      if (targetPost) targetPost.bookmarkCount += 1;
      isBookmarked = true;
    }

    this.saveLocalBookmarks(userId, bookmarks);
    this.saveLocalPosts(posts);
    return isBookmarked;
  }

  static isBookmarked(userId: string, postId: string): boolean {
    return this.getLocalBookmarks(userId).some((b) => b.postId === postId);
  }

  // --- FOLLOW SYSTEM & PRIVATE ACCOUNTS ---
  static getLocalFollows(userId: string): FollowRelationship[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'following_' + userId);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalFollows(userId: string, follows: FollowRelationship[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'following_' + userId, JSON.stringify(follows));
    } catch (e) {}
  }

  static isFollowing(followerId: string, followingId: string): boolean {
    const list = this.getLocalFollows(followerId);
    return list.some((f) => f.followingId === followingId);
  }

  static getLocalFollowRequests(targetUserId: string): FollowRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'follow_requests_' + targetUserId);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalFollowRequests(targetUserId: string, requests: FollowRequest[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'follow_requests_' + targetUserId, JSON.stringify(requests));
    } catch (e) {}
  }

  static async followUser(
    currentUser: CommunityUserProfile,
    targetUser: CommunityUserProfile
  ): Promise<{ status: 'FOLLOWING' | 'REQUESTED' }> {
    if (currentUser.id === targetUser.id) {
      throw new Error('You cannot follow yourself.');
    }

    // Check if target has a private account
    if (targetUser.privacySettings.isPrivateAccount) {
      const requests = this.getLocalFollowRequests(targetUser.id);
      if (requests.some((r) => r.senderId === currentUser.id && r.status === 'PENDING')) {
        return { status: 'REQUESTED' };
      }

      const req: FollowRequest = {
        id: `req_${currentUser.id}_${targetUser.id}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderUsername: currentUser.username,
        senderAvatarUrl: currentUser.avatarUrl,
        targetUserId: targetUser.id,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
      };
      requests.push(req);
      this.saveLocalFollowRequests(targetUser.id, requests);

      // Notify target user of follow request
      await this.createNotification({
        userId: targetUser.id,
        type: 'FOLLOW_REQUEST',
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorUsername: currentUser.username,
        actorAvatarUrl: currentUser.avatarUrl,
        message: `@${currentUser.username} requested to follow your private profile`,
      });

      return { status: 'REQUESTED' };
    }

    // Public account -> Immediate Follow
    const follows = this.getLocalFollows(currentUser.id);
    if (!follows.some((f) => f.followingId === targetUser.id)) {
      follows.push({
        id: `${currentUser.id}_${targetUser.id}`,
        followerId: currentUser.id,
        followerUsername: currentUser.username,
        followerAvatarUrl: currentUser.avatarUrl,
        followingId: targetUser.id,
        followingUsername: targetUser.username,
        createdAt: new Date().toISOString(),
      });
      this.saveLocalFollows(currentUser.id, follows);

      // Update counters
      currentUser.followingCount += 1;
      targetUser.followerCount += 1;
      await this.updateProfile(currentUser.id, { followingCount: currentUser.followingCount });
      await this.updateProfile(targetUser.id, { followerCount: targetUser.followerCount });

      // Notify followed user
      await this.createNotification({
        userId: targetUser.id,
        type: 'NEW_FOLLOWER',
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorUsername: currentUser.username,
        actorAvatarUrl: currentUser.avatarUrl,
        message: `@${currentUser.username} started following you`,
      });
    }

    return { status: 'FOLLOWING' };
  }

  static async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    const follows = this.getLocalFollows(currentUserId);
    const filtered = follows.filter((f) => f.followingId !== targetUserId);
    this.saveLocalFollows(currentUserId, filtered);

    // Also remove any pending follow request
    const requests = this.getLocalFollowRequests(targetUserId).filter((r) => r.senderId !== currentUserId);
    this.saveLocalFollowRequests(targetUserId, requests);

    // Decrement counters
    const currentProfile = await this.getProfile(currentUserId);
    const targetProfile = await this.getProfile(targetUserId);
    if (currentProfile) {
      currentProfile.followingCount = Math.max(0, currentProfile.followingCount - 1);
      await this.updateProfile(currentUserId, { followingCount: currentProfile.followingCount });
    }
    if (targetProfile) {
      targetProfile.followerCount = Math.max(0, targetProfile.followerCount - 1);
      await this.updateProfile(targetUserId, { followerCount: targetProfile.followerCount });
    }
  }

  static async respondToFollowRequest(
    targetUserId: string,
    requestId: string,
    approve: boolean
  ): Promise<void> {
    const requests = this.getLocalFollowRequests(targetUserId);
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    if (approve) {
      req.status = 'ACCEPTED';
      // Add to sender's following list
      const senderFollows = this.getLocalFollows(req.senderId);
      senderFollows.push({
        id: `${req.senderId}_${targetUserId}`,
        followerId: req.senderId,
        followerUsername: req.senderUsername,
        followerAvatarUrl: req.senderAvatarUrl,
        followingId: targetUserId,
        followingUsername: 'Target',
        createdAt: new Date().toISOString(),
      });
      this.saveLocalFollows(req.senderId, senderFollows);

      // Update counters
      const senderProf = await this.getProfile(req.senderId);
      const targetProf = await this.getProfile(targetUserId);
      if (senderProf) await this.updateProfile(req.senderId, { followingCount: senderProf.followingCount + 1 });
      if (targetProf) await this.updateProfile(targetUserId, { followerCount: targetProf.followerCount + 1 });

      // Notify sender
      await this.createNotification({
        userId: req.senderId,
        type: 'FOLLOW_ACCEPTED',
        actorId: targetUserId,
        actorName: targetProf?.name || 'User',
        actorUsername: targetProf?.username || 'user',
        actorAvatarUrl: targetProf?.avatarUrl || '',
        message: `@${targetProf?.username} accepted your follow request`,
      });
    } else {
      req.status = 'REJECTED';
    }

    // Clean up processed request
    const remaining = requests.filter((r) => r.id !== requestId);
    this.saveLocalFollowRequests(targetUserId, remaining);
  }

  // --- BLOCKS & MUTES ---
  static getLocalBlocks(userId: string): UserBlock[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'blocks_' + userId);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalBlocks(userId: string, blocks: UserBlock[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'blocks_' + userId, JSON.stringify(blocks));
    } catch (e) {}
  }

  static async blockUser(blockerId: string, blockedId: string, blockedUsername: string): Promise<void> {
    const blocks = this.getLocalBlocks(blockerId);
    if (!blocks.some((b) => b.blockedId === blockedId)) {
      blocks.push({
        id: `${blockerId}_${blockedId}`,
        blockerId,
        blockedId,
        blockedUsername,
        createdAt: new Date().toISOString(),
      });
      this.saveLocalBlocks(blockerId, blocks);
      // Automatically unfollow both directions
      await this.unfollowUser(blockerId, blockedId);
      await this.unfollowUser(blockedId, blockerId);
    }
  }

  static async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const blocks = this.getLocalBlocks(blockerId);
    const filtered = blocks.filter((b) => b.blockedId !== blockedId);
    this.saveLocalBlocks(blockerId, filtered);
  }

  static getLocalMutes(userId: string): UserMute[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'mutes_' + userId);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalMutes(userId: string, mutes: UserMute[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'mutes_' + userId, JSON.stringify(mutes));
    } catch (e) {}
  }

  static async muteUser(muterId: string, mutedId: string, mutedUsername: string): Promise<void> {
    const mutes = this.getLocalMutes(muterId);
    if (!mutes.some((m) => m.mutedId === mutedId)) {
      mutes.push({
        id: `${muterId}_${mutedId}`,
        muterId,
        mutedId,
        mutedUsername,
        createdAt: new Date().toISOString(),
      });
      this.saveLocalMutes(muterId, mutes);
    }
  }

  static async unmuteUser(muterId: string, mutedId: string): Promise<void> {
    const mutes = this.getLocalMutes(muterId);
    const filtered = mutes.filter((m) => m.mutedId !== mutedId);
    this.saveLocalMutes(muterId, filtered);
  }

  // --- NOTIFICATIONS ---
  static getLocalNotifications(userId: string): CommunityNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'notifs_' + userId);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalNotifications(userId: string, notifs: CommunityNotification[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'notifs_' + userId, JSON.stringify(notifs));
    } catch (e) {}
  }

  static async createNotification(notif: Omit<CommunityNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    const notifs = this.getLocalNotifications(notif.userId);

    // Deduplication check: Do not add identical unread notification within 5 minutes
    const duplicate = notifs.find(
      (n) =>
        !n.read &&
        n.type === notif.type &&
        n.actorId === notif.actorId &&
        n.postId === notif.postId &&
        Date.now() - new Date(n.createdAt).getTime() < 300000
    );
    if (duplicate) return;

    const newNotif: CommunityNotification = {
      ...notif,
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifs.unshift(newNotif);
    this.saveLocalNotifications(notif.userId, notifs.slice(0, 50));
  }

  static markNotificationAsRead(userId: string, notificationId: string): void {
    const notifs = this.getLocalNotifications(userId);
    const target = notifs.find((n) => n.id === notificationId);
    if (target) {
      target.read = true;
      this.saveLocalNotifications(userId, notifs);
    }
  }

  static markAllNotificationsAsRead(userId: string): void {
    const notifs = this.getLocalNotifications(userId);
    notifs.forEach((n) => (n.read = true));
    this.saveLocalNotifications(userId, notifs);
  }

  // --- MODERATION & REPORTS ---
  static getLocalReports(): CommunityReport[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'reports');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalReports(reports: CommunityReport[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'reports', JSON.stringify(reports));
    } catch (e) {}
  }

  static async createReport(reportData: {
    reporterId: string;
    reporterEmail: string;
    targetType: 'POST' | 'COMMENT' | 'PROFILE';
    targetId: string;
    targetAuthorId: string;
    targetContentSnippet: string;
    category: CommunityReport['category'];
    description: string;
  }): Promise<CommunityReport> {
    const scan = CommunitySafetyGuard.scanContent(reportData.targetContentSnippet);
    const newReport: CommunityReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      ...reportData,
      aiSafetyScore: scan.score,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const reports = this.getLocalReports();
    reports.unshift(newReport);
    this.saveLocalReports(reports);

    try {
      await setDoc(doc(db, 'community_reports', newReport.id), newReport);
    } catch (e) {
      console.warn('Firestore report save error:', e);
    }

    return newReport;
  }

  static getLocalModerationActions(): CommunityModerationAction[] {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + 'mod_actions');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static saveLocalModerationActions(actions: CommunityModerationAction[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'mod_actions', JSON.stringify(actions));
    } catch (e) {}
  }

  static async resolveReport(
    reportId: string,
    action: CommunityModerationAction['actionType'],
    moderator: { id: string; email: string },
    notes?: string
  ): Promise<void> {
    const reports = this.getLocalReports();
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    report.status = action === 'DISMISS' ? 'DISMISSED' : 'ACTION_TAKEN';
    report.resolvedAt = new Date().toISOString();
    report.resolvedBy = moderator.email;
    report.resolutionNote = notes;
    this.saveLocalReports(reports);

    // Record audit action
    const actions = this.getLocalModerationActions();
    actions.unshift({
      id: 'action_' + Math.random().toString(36).substring(2, 9),
      moderatorId: moderator.id,
      moderatorEmail: moderator.email,
      actionType: action,
      targetType: report.targetType,
      targetId: report.targetId,
      targetUserId: report.targetAuthorId,
      reason: report.category + ': ' + report.description,
      notes,
      createdAt: new Date().toISOString(),
    });
    this.saveLocalModerationActions(actions);

    // Execute corresponding content or user action
    if (action === 'REMOVE_CONTENT') {
      if (report.targetType === 'POST') {
        await this.deletePost(report.targetId, moderator.id, true);
      } else if (report.targetType === 'COMMENT') {
        // Remove comment
      }
    } else if (action === 'BAN_USER' || action === 'SUSPEND_USER_24H' || action === 'SUSPEND_USER_7D') {
      const targetProfile = await this.getProfile(report.targetAuthorId);
      if (targetProfile) {
        targetProfile.isSuspended = true;
        targetProfile.suspensionReason = notes || 'Violated community guidelines.';
        targetProfile.suspendedUntil =
          action === 'SUSPEND_USER_24H'
            ? new Date(Date.now() + 86400000).toISOString()
            : action === 'SUSPEND_USER_7D'
            ? new Date(Date.now() + 86400000 * 7).toISOString()
            : 'PERMANENT';
        await this.updateProfile(report.targetAuthorId, targetProfile);
      }
    }
  }

  static async setVerifiedBadge(targetUserId: string, isVerified: boolean, adminUser: UserProfile): Promise<void> {
    const isMasterAdmin = adminUser.email.toLowerCase() === 'khomchatwongwai@gmail.com' || adminUser.role === 'admin';
    if (!isMasterAdmin) {
      throw new Error('Unauthorized: Only administrators can modify verification status.');
    }

    const profile = await this.getProfile(targetUserId);
    if (!profile) throw new Error('Target profile not found');

    profile.isVerified = isVerified;
    const localProfiles = this.getLocalProfiles();
    localProfiles[targetUserId] = profile;
    this.saveLocalProfiles(localProfiles);

    try {
      await updateDoc(doc(db, 'users', targetUserId), { isVerified });
    } catch (e) {
      console.warn('Firestore setVerifiedBadge error:', e);
    }
  }
}
