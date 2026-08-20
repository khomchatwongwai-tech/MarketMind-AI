import { TickerSymbol } from './market.js';
import { SubscriptionPlanTier } from './user.js';

export type PositionDisclosure = 'NONE' | 'LONG' | 'SHORT' | 'NEUTRAL' | 'NO_POSITION';

export type ContentMediaType = 'NONE' | 'IMAGE' | 'CHART' | 'POLL' | 'NEWS_LINK';

export type FeedFilterType = 'FOLLOWING' | 'DISCOVER' | 'LATEST' | 'TRENDING' | 'WATCHLIST' | 'DISCUSSIONS';

export type PrivacyAudience = 'EVERYONE' | 'FOLLOWERS_ONLY' | 'NOBODY';
export type WallPrivacyAudience = 'EVERYONE' | 'FOLLOWERS_ONLY' | 'ONLY_ME';

export interface UserPrivacySettings {
  isPrivateAccount: boolean;
  whoCanFollow: 'EVERYONE' | 'REQUEST_ONLY';
  whoCanComment: PrivacyAudience;
  whoCanMention: PrivacyAudience;
  whoCanViewProfileWall: WallPrivacyAudience;
  hideFollowLists: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface CommunityUserProfile {
  id: string; // Auth UID
  email: string;
  name: string;
  username: string;
  bio: string;
  website?: string;
  avatarUrl: string;
  coverImageUrl?: string;
  isVerified: boolean; // Only administrator can grant
  role: 'user' | 'admin';
  plan: SubscriptionPlanTier;
  planTier?: string;
  investingInterests: string[];
  followerCount: number;
  followingCount: number;
  postCount: number;
  joinedAt: string;
  privacySettings: UserPrivacySettings;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedUntil?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voterIds: string[];
}

export interface PostPoll {
  question: string;
  options: PollOption[];
  expiresAt: string;
  totalVotes: number;
}

export interface ApprovedNewsLink {
  title: string;
  source: string;
  url: string;
  publisherAttribution: string;
  imageUrl?: string;
  snippet?: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string;
  authorIsVerified: boolean;
  authorPlan?: string;
  content: string;
  tickers: TickerSymbol[];
  hashtags: string[];
  mentions: string[];
  mediaType: ContentMediaType;
  mediaUrl?: string; // compressed safe base64 or URL
  poll?: PostPoll;
  newsLink?: ApprovedNewsLink;
  positionDisclosure: PositionDisclosure;
  isAiGenerated: boolean;
  isSponsored: boolean;
  disableComments: boolean;
  limitCommentsToFollowers: boolean;
  likeCount: number;
  bullCount: number;
  bearCount: number;
  commentCount: number;
  repostCount: number;
  bookmarkCount: number;
  repostedPost?: CommunityPost; // nested quote/repost
  isPinned?: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
  status: 'ACTIVE' | 'FLAGGED' | 'REMOVED';
  financialDisclaimer: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentCommentId?: string; // For threaded sub-replies
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string;
  authorIsVerified: boolean;
  content: string;
  mentions: string[];
  likeCount: number;
  replyCount: number;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
  status: 'ACTIVE' | 'REMOVED';
}

export interface PostReaction {
  id: string;
  postId: string;
  userId: string;
  reactionType: 'LIKE' | 'BULL' | 'BEAR';
  createdAt: string;
}

export interface PostBookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
  postSnapshot: CommunityPost;
}

export interface FollowRelationship {
  id: string; // `${followerId}_${followingId}`
  followerId: string;
  followerUsername: string;
  followerAvatarUrl: string;
  followingId: string;
  followingUsername: string;
  createdAt: string;
}

export interface FollowRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarUrl: string;
  targetUserId: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export type NotificationType =
  | 'NEW_FOLLOWER'
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_ACCEPTED'
  | 'POST_REACTION'
  | 'NEW_COMMENT'
  | 'COMMENT_REPLY'
  | 'MENTION'
  | 'REPOST'
  | 'WATCHLIST_DISCUSSION'
  | 'MODERATION_ACTION';

export interface CommunityNotification {
  id: string;
  userId: string; // Target recipient
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorAvatarUrl: string;
  postId?: string;
  commentId?: string;
  ticker?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserBlock {
  id: string; // `${blockerId}_${blockedId}`
  blockerId: string;
  blockedId: string;
  blockedUsername: string;
  createdAt: string;
}

export interface UserMute {
  id: string; // `${muterId}_${mutedId}`
  muterId: string;
  mutedId: string;
  mutedUsername: string;
  createdAt: string;
}

export type ReportCategory =
  | 'SPAM'
  | 'MANIPULATION'
  | 'PHISHING'
  | 'IMPERSONATION'
  | 'HARASSMENT'
  | 'COPYRIGHT'
  | 'OTHER';

export interface CommunityReport {
  id: string;
  reporterId: string;
  reporterEmail: string;
  targetType: 'POST' | 'COMMENT' | 'PROFILE';
  targetId: string;
  targetAuthorId: string;
  targetContentSnippet: string;
  category: ReportCategory;
  description: string;
  aiSafetyScore: number; // 0-100 (higher = higher severity)
  status: 'PENDING' | 'DISMISSED' | 'ACTION_TAKEN';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface CommunityModerationAction {
  id: string;
  moderatorId: string;
  moderatorEmail: string;
  actionType:
    | 'DISMISS'
    | 'WARN_USER'
    | 'REMOVE_CONTENT'
    | 'SUSPEND_USER_24H'
    | 'SUSPEND_USER_7D'
    | 'BAN_USER'
    | 'EMERGENCY_LOCK'
    | 'GRANT_VERIFIED'
    | 'REVOKE_VERIFIED';
  targetType: 'POST' | 'COMMENT' | 'PROFILE';
  targetId: string;
  targetUserId: string;
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface CommunityModerationConfig {
  prohibitedWords: string[];
  maliciousDomains: string[];
  rateLimitPostsPerMin: number;
  rateLimitCommentsPerMin: number;
  maxPostLength: number;
  maxCommentLength: number;
}
