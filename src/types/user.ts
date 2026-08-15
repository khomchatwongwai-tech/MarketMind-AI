import { TickerSymbol } from './market';
import { SubscriptionPlanId, SubscriptionStatus, UserSubscriptionRecord } from './subscription';

export type { TickerSymbol };

export type SubscriptionPlanTier =
  | 'free'
  | 'basic'
  | 'pro'
  | 'premium'
  | 'institutional'
  | 'enterprise';

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  role: 'user' | 'admin';
  plan: SubscriptionPlanTier;
  planTier?: string; // UI display alias e.g. 'Pro' or 'Free'
  selectedPlan?: SubscriptionPlanId;
  isGuest?: boolean;
  
  // Trial & Subscription State
  subscriptionStatus?: SubscriptionStatus;
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialStatus?: 'active' | 'expired' | 'none' | 'converted';
  trialDaysRemaining?: number;
  hasUsedTrial?: boolean;
  
  // Billing fields
  planBillingCycle: 'monthly' | 'annual';
  planRenewsAt: string;
  monthlyPrice?: number;
  nextBillingDate?: string;
  cancelAtPeriodEnd?: boolean;
  paymentProvider?: 'none' | 'stripe' | 'manual';
  paymentCustomerId?: string;
  paymentSubscriptionId?: string;
  lastPaymentStatus?: 'succeeded' | 'failed' | 'pending' | 'none';

  createdAt: string;
  tradingExperience: 'Beginner' | 'Intermediate' | 'Pro Quant' | 'Institutional';
  defaultTicker: TickerSymbol;
  defaultTimeframe: '1m' | '5m' | '15m' | '1h' | '1d';
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  
  // Localization & Region
  country?: string;
  language?: string;
  region?: string;
  timezone?: string;
  preferredCurrency?: string;
  preferredMarket?: string;
  aiResponseLanguage?: string;
  
  notifications: {
    emailAlerts: boolean;
    pushAlerts: boolean;
    soundEnabled: boolean;
    telegramEnabled: boolean;
    telegramChatId?: string;
    discordWebhookUrl?: string;
  };
  twoFactorEnabled: boolean;
  apiKeys: ApiKeyRecord[];
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  secretKey?: string;
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
  rateLimitPerMin: number;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  tickers: TickerSymbol[];
  createdAt: string;
}

export interface SavedAlert {
  id: string;
  ticker: TickerSymbol;
  type:
    | 'PRICE_ABOVE'
    | 'PRICE_BELOW'
    | 'VWAP_CROSS'
    | 'RSI_OVERBOUGHT'
    | 'RSI_OVERSOLD'
    | 'SUPPORT_BREAK'
    | 'RESISTANCE_BREAK'
    | 'UNUSUAL_OPTIONS_SPIKE';
  targetValue: number;
  label: string;
  condition: string;
  status: 'active' | 'triggered' | 'paused';
  createdAt: string;
  triggeredAt?: string;
  soundAlert: boolean;
  webhookAlert: boolean;
  notes?: string;
}

export interface HistoricalPrediction {
  id: string;
  ticker: TickerSymbol;
  timestamp: string;
  timeframe: '15M' | '1H' | '1D' | '1W';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  confidenceScore: number;
  status: 'WIN' | 'LOSS' | 'IN_PROGRESS';
  finalPrice?: number;
  returnPercent?: number;
  primaryCatalyst: string;
  resolvedAt?: string;
  brierScore: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: 'Technical / Bug' | 'Market Data Feed' | 'Subscription & Billing' | 'API & Webhooks' | 'Feature Request';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  message: string;
  status: 'Open' | 'In Review' | 'Resolved';
  createdAt: string;
  updatedAt: string;
  response?: string;
}

export interface SystemServiceStatus {
  id: string;
  name: string;
  status: 'Operational' | 'Degraded' | 'Maintenance' | 'Outage' | 'operational' | 'degraded';
  latencyMs: number;
  uptime90d: number;
  uptimePercent?: number;
  lastCheck?: string;
  description: string;
}
