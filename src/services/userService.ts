import {
  UserProfile,
  Watchlist,
  SavedAlert,
  HistoricalPrediction,
  SupportTicket,
  SystemServiceStatus,
  SubscriptionPlanTier,
  ApiKeyRecord,
} from '../types/user';
import { TickerSymbol } from '../types/market';

const STORAGE_KEYS = {
  USER: 'marketmind_user_profile',
  WATCHLISTS: 'marketmind_watchlists',
  SAVED_ALERTS: 'marketmind_saved_alerts',
  PREDICTIONS: 'marketmind_prediction_history',
  SUPPORT_TICKETS: 'marketmind_support_tickets',
  BROADCAST: 'marketmind_broadcast_banner',
  ONBOARDING_COMPLETED: 'marketmind_onboarding_completed',
};

// Default Initial Admin / User Profile
export const DEFAULT_ADMIN_EMAIL = 'khomchatwongwai@gmail.com';

const INITIAL_USER: UserProfile = {
  id: 'usr_alpha_9921',
  name: 'Khomchat Wongwai',
  firstName: 'Khomchat',
  lastName: 'Wongwai',
  email: DEFAULT_ADMIN_EMAIL,
  emailVerified: true,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'admin',
  plan: 'premium',
  planTier: 'PREMIUM',
  selectedPlan: 'premium',
  subscriptionStatus: 'active',
  hasUsedTrial: true,
  isGuest: false,
  planBillingCycle: 'annual',
  planRenewsAt: '2027-08-14',
  monthlyPrice: 69.99,
  cancelAtPeriodEnd: false,
  createdAt: '2026-01-15',
  tradingExperience: 'Pro Quant',
  defaultTicker: 'SPY',
  defaultTimeframe: '5m',
  riskTolerance: 'Moderate',
  language: 'en',
  region: 'US',
  timezone: 'America/New_York',
  preferredCurrency: 'USD',
  preferredMarket: 'US (NYSE/NASDAQ)',
  aiResponseLanguage: 'en',
  notifications: {
    emailAlerts: true,
    pushAlerts: true,
    soundEnabled: true,
    telegramEnabled: false,
    telegramChatId: '@quant_trader_bot',
    discordWebhookUrl: 'https://discord.com/api/webhooks/1299/marketmind-signals',
  },
  twoFactorEnabled: true,
  apiKeys: [
    {
      id: 'key_live_01',
      name: 'Primary Trading Bot Algo',
      keyPrefix: 'mk_live_9a8f2...',
      createdAt: '2026-02-10',
      lastUsedAt: '2 mins ago',
      status: 'active',
      rateLimitPerMin: 1200,
    },
    {
      id: 'key_live_02',
      name: 'Backtesting Cluster',
      keyPrefix: 'mk_live_3e1b7...',
      createdAt: '2026-04-18',
      lastUsedAt: '1 hour ago',
      status: 'active',
      rateLimitPerMin: 3000,
    },
  ],
};

const INITIAL_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl_main',
    name: 'Major Indices & High Beta',
    description: 'Core benchmark ETFs and high volume leaders',
    isDefault: true,
    tickers: ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN', 'META', 'AMD', 'IWM', 'COIN', 'PLTR'],
    createdAt: '2026-01-15',
  },
  {
    id: 'wl_semis',
    name: 'Semiconductors & AI',
    description: 'AI hardware chips, cloud hyperscalers & suppliers',
    isDefault: false,
    tickers: ['NVDA', 'AMD', 'MSFT', 'META', 'AAPL', 'AMZN'],
    createdAt: '2026-02-01',
  },
  {
    id: 'wl_macro',
    name: 'Macro & Liquidity Hub',
    description: 'Index broad coverage and treasury sensitivity',
    isDefault: false,
    tickers: ['SPY', 'QQQ', 'IWM', 'TSLA', 'COIN'],
    createdAt: '2026-03-10',
  },
];

const INITIAL_SAVED_ALERTS: SavedAlert[] = [
  {
    id: 'alt_001',
    ticker: 'SPY',
    type: 'VWAP_CROSS',
    targetValue: 512.8,
    label: 'SPY VWAP Upside Retest',
    condition: 'Price crosses and holds above Intraday VWAP',
    status: 'active',
    createdAt: '2026-08-14 09:35 ET',
    soundAlert: true,
    webhookAlert: true,
    notes: 'Key trigger for afternoon momentum continuation',
  },
  {
    id: 'alt_002',
    ticker: 'QQQ',
    type: 'RESISTANCE_BREAK',
    targetValue: 448.5,
    label: 'QQQ R1 Major Breakout',
    condition: 'Price > R1 $448.50 with Relative Volume > 1.5x',
    status: 'active',
    createdAt: '2026-08-14 09:40 ET',
    soundAlert: true,
    webhookAlert: true,
  },
  {
    id: 'alt_003',
    ticker: 'NVDA',
    type: 'UNUSUAL_OPTIONS_SPIKE',
    targetValue: 2.5,
    label: 'NVDA Unusual Call Sweeps',
    condition: 'Call Volume / Put Volume ratio exceeds 2.50',
    status: 'triggered',
    triggeredAt: '2026-08-14 10:15 ET',
    createdAt: '2026-08-14 09:30 ET',
    soundAlert: true,
    webhookAlert: false,
  },
  {
    id: 'alt_004',
    ticker: 'TSLA',
    type: 'RSI_OVERSOLD',
    targetValue: 30,
    label: 'TSLA 15M RSI Bounce Zone',
    condition: 'RSI(14) drops below 30.00',
    status: 'paused',
    createdAt: '2026-08-13 15:45 ET',
    soundAlert: false,
    webhookAlert: true,
  },
  {
    id: 'alt_005',
    ticker: 'SPY',
    type: 'PRICE_ABOVE',
    targetValue: 514.0,
    label: 'SPY Resistance Pivot Target',
    condition: 'Price breaks above $514.00',
    status: 'active',
    createdAt: '2026-08-14 10:00 ET',
    soundAlert: true,
    webhookAlert: true,
  },
];

const INITIAL_PREDICTIONS: HistoricalPrediction[] = [
  {
    id: 'pred_001',
    ticker: 'SPY',
    timestamp: '2026-08-14 09:45 ET',
    timeframe: '1H',
    direction: 'BULLISH',
    entryPrice: 511.2,
    targetPrice: 513.8,
    stopLossPrice: 509.9,
    confidenceScore: 78,
    status: 'WIN',
    finalPrice: 513.95,
    returnPercent: 0.54,
    primaryCatalyst: 'Tech sector opening surge & VWAP reclaim with positive gamma pin',
    resolvedAt: '2026-08-14 10:45 ET',
    brierScore: 0.08,
  },
  {
    id: 'pred_002',
    ticker: 'QQQ',
    timestamp: '2026-08-14 09:30 ET',
    timeframe: '15M',
    direction: 'BULLISH',
    entryPrice: 445.1,
    targetPrice: 447.2,
    stopLossPrice: 443.8,
    confidenceScore: 82,
    status: 'WIN',
    finalPrice: 447.5,
    returnPercent: 0.54,
    primaryCatalyst: 'Strong semiconductor pre-market gap continuation',
    resolvedAt: '2026-08-14 09:45 ET',
    brierScore: 0.05,
  },
  {
    id: 'pred_003',
    ticker: 'NVDA',
    timestamp: '2026-08-14 10:00 ET',
    timeframe: '1H',
    direction: 'BULLISH',
    entryPrice: 128.4,
    targetPrice: 131.5,
    stopLossPrice: 126.8,
    confidenceScore: 75,
    status: 'IN_PROGRESS',
    primaryCatalyst: 'Aggressive institutional call flow targeting $130 strike',
    brierScore: 0.12,
  },
  {
    id: 'pred_004',
    ticker: 'TSLA',
    timestamp: '2026-08-13 14:15 ET',
    timeframe: '1D',
    direction: 'BEARISH',
    entryPrice: 218.4,
    targetPrice: 212.0,
    stopLossPrice: 221.5,
    confidenceScore: 68,
    status: 'WIN',
    finalPrice: 211.8,
    returnPercent: 3.02,
    primaryCatalyst: 'EMA 20 rejection accompanied by heavy put sweeps',
    resolvedAt: '2026-08-14 09:30 ET',
    brierScore: 0.1,
  },
  {
    id: 'pred_005',
    ticker: 'IWM',
    timestamp: '2026-08-13 11:30 ET',
    timeframe: '1H',
    direction: 'BULLISH',
    entryPrice: 204.5,
    targetPrice: 206.8,
    stopLossPrice: 203.2,
    confidenceScore: 62,
    status: 'LOSS',
    finalPrice: 203.1,
    returnPercent: -0.68,
    primaryCatalyst: 'Small-cap rotation anticipated before 10-Yr yield spike',
    resolvedAt: '2026-08-13 12:30 ET',
    brierScore: 0.38,
  },
  {
    id: 'pred_006',
    ticker: 'MSFT',
    timestamp: '2026-08-13 10:15 ET',
    timeframe: '1D',
    direction: 'BULLISH',
    entryPrice: 422.0,
    targetPrice: 428.5,
    stopLossPrice: 418.0,
    confidenceScore: 84,
    status: 'WIN',
    finalPrice: 429.1,
    returnPercent: 1.68,
    primaryCatalyst: 'Enterprise cloud spend upgrades & bullish MACD crossover',
    resolvedAt: '2026-08-14 09:30 ET',
    brierScore: 0.04,
  },
  {
    id: 'pred_007',
    ticker: 'AAPL',
    timestamp: '2026-08-12 13:00 ET',
    timeframe: '1H',
    direction: 'NEUTRAL',
    entryPrice: 224.2,
    targetPrice: 224.8,
    stopLossPrice: 223.0,
    confidenceScore: 70,
    status: 'WIN',
    finalPrice: 224.4,
    returnPercent: 0.09,
    primaryCatalyst: 'Consolidation inside tight Bollinger Bands before options expiry',
    resolvedAt: '2026-08-12 14:00 ET',
    brierScore: 0.09,
  },
];

const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_1092',
    userId: 'usr_alpha_9921',
    userEmail: DEFAULT_ADMIN_EMAIL,
    userName: 'Khomchat Wongwai',
    subject: 'WebSocket Latency optimization for high-frequency scalping',
    category: 'API & Webhooks',
    priority: 'High',
    message: 'Could you confirm if the direct L2 order book delta feed can be streamed via Python WebSocket client with sub-10ms latency?',
    status: 'Resolved',
    createdAt: '2026-08-12 14:20 ET',
    updatedAt: '2026-08-12 14:35 ET',
    response: 'Hello Khomchat, yes! Your Institutional Alpha tier includes direct access to our Chicago Equinix NY4 raw multicast relay. See docs in the API Keys tab.',
  },
  {
    id: 'tkt_1098',
    userId: 'usr_alpha_9921',
    userEmail: DEFAULT_ADMIN_EMAIL,
    userName: 'Khomchat Wongwai',
    subject: 'Feature Request: Custom Black-Scholes Greek sensitivity charts',
    category: 'Feature Request',
    priority: 'Medium',
    message: 'Would love to see 3D volatility surface visualizers in the Options Analytics tab.',
    status: 'In Review',
    createdAt: '2026-08-14 08:30 ET',
    updatedAt: '2026-08-14 09:10 ET',
    response: 'Thank you for the suggestion! Our quant engineering team has queued this for the next terminal update sprint.',
  },
];

export const SYSTEM_SERVICES: SystemServiceStatus[] = [
  {
    id: 'srv_ws',
    name: 'Massive Real-Time WebSocket Market Stream',
    status: 'Operational',
    latencyMs: 16,
    uptime90d: 99.99,
    uptimePercent: 99.99,
    lastCheck: '10 seconds ago',
    description: 'Low-latency tick-by-tick Level 1 & Level 2 price and volume feed',
  },
  {
    id: 'srv_gemini',
    name: 'Google Gemini 3.7 Flash Quant AI Reasoning Gateway',
    status: 'Operational',
    latencyMs: 235,
    uptime90d: 99.97,
    uptimePercent: 99.97,
    lastCheck: '12 seconds ago',
    description: 'Server-side institutional market analysis & synthesis engine',
  },
  {
    id: 'srv_options',
    name: 'Options Flow & Dark Pool Liquidity Radar',
    status: 'Operational',
    latencyMs: 42,
    uptime90d: 99.95,
    uptimePercent: 99.95,
    lastCheck: '8 seconds ago',
    description: 'Real-time multi-exchange sweep ingestion and gamma calculation',
  },
  {
    id: 'srv_backtest',
    name: 'Historical Backtest & Prediction Verification Node',
    status: 'Operational',
    latencyMs: 38,
    uptime90d: 100.0,
    uptimePercent: 100.0,
    lastCheck: '15 seconds ago',
    description: 'Automated target hit validation and Brier probability auditing',
  },
  {
    id: 'srv_news',
    name: 'Financial News & SEC Edgar Ingestion Pipeline',
    status: 'Operational',
    latencyMs: 65,
    uptime90d: 99.94,
    uptimePercent: 99.94,
    lastCheck: '20 seconds ago',
    description: 'Real-time headline NLP sentiment extraction and breaking news clustering',
  },
  {
    id: 'srv_alerts',
    name: 'Real-Time Alert Dispatch & Webhook Relay',
    status: 'Operational',
    latencyMs: 24,
    uptime90d: 99.99,
    uptimePercent: 99.99,
    lastCheck: '5 seconds ago',
    description: 'Instant SMS, Discord, Telegram and browser push notifications',
  },
];

export class UserService {
  // --- USER PROFILE & AUTH ---
  static getUser(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load user profile from storage', e);
    }
    return INITIAL_USER;
  }

  static getCurrentUser(): UserProfile {
    return this.getUser();
  }

  static saveUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  }

  static login(email: string, name?: string): UserProfile {
    const isMasterAdmin = email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase();
    const user: UserProfile = {
      ...INITIAL_USER,
      email,
      name: name || (isMasterAdmin ? 'Khomchat Wongwai' : email.split('@')[0]),
      role: isMasterAdmin ? 'admin' : 'user',
      plan: isMasterAdmin ? 'institutional' : 'pro',
      planTier: isMasterAdmin ? 'Institutional' : 'Pro',
      isGuest: false,
    };
    this.saveUser(user);
    return user;
  }

  static loginAsGuest(): UserProfile {
    const guest: UserProfile = {
      ...INITIAL_USER,
      id: 'guest_' + Math.random().toString(36).substring(2, 7),
      name: 'Guest Trader',
      email: 'guest@marketmind.ai',
      role: 'user',
      plan: 'free',
      planTier: 'Free',
      isGuest: true,
    };
    this.saveUser(guest);
    return guest;
  }

  static logout(): UserProfile {
    return this.loginAsGuest();
  }

  static updatePlan(plan: SubscriptionPlanTier, billingCycle: 'monthly' | 'annual' = 'annual'): UserProfile {
    const user = this.getUser();
    user.plan = plan;
    user.planTier = plan.charAt(0).toUpperCase() + plan.slice(1);
    user.planBillingCycle = billingCycle;
    user.planRenewsAt = new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString().split('T')[0];
    this.saveUser(user);
    return user;
  }

  static generateApiKey(name: string): ApiKeyRecord {
    const user = this.getUser();
    const id = 'key_' + Math.random().toString(36).substring(2, 9);
    const secretRandom = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKey: ApiKeyRecord = {
      id,
      name: name || 'API Token ' + (user.apiKeys.length + 1),
      keyPrefix: `mk_live_${secretRandom.substring(0, 6)}...`,
      secretKey: `mk_live_${secretRandom}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      rateLimitPerMin: user.plan === 'institutional' ? 5000 : user.plan === 'pro' ? 1200 : 100,
    };
    user.apiKeys.unshift(newKey);
    this.saveUser(user);
    return newKey;
  }

  static revokeApiKey(id: string): void {
    const user = this.getUser();
    user.apiKeys = user.apiKeys.filter((k) => k.id !== id);
    this.saveUser(user);
  }

  // --- WATCHLISTS ---
  static getWatchlists(): Watchlist[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load watchlists', e);
    }
    return INITIAL_WATCHLISTS;
  }

  static saveWatchlists(watchlists: Watchlist[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(watchlists));
    } catch (e) {
      console.error('Failed to save watchlists', e);
    }
  }

  static createWatchlist(name: string, description: string, tickers: TickerSymbol[] = ['SPY', 'QQQ']): Watchlist {
    const lists = this.getWatchlists();
    const newList: Watchlist = {
      id: 'wl_' + Math.random().toString(36).substring(2, 8),
      name,
      description,
      tickers,
      createdAt: new Date().toISOString().split('T')[0],
    };
    lists.push(newList);
    this.saveWatchlists(lists);
    return newList;
  }

  static deleteWatchlist(id: string): void {
    const lists = this.getWatchlists().filter((l) => l.id !== id);
    this.saveWatchlists(lists);
  }

  static addTickerToWatchlist(watchlistId: string, ticker: TickerSymbol): void {
    const lists = this.getWatchlists();
    const target = lists.find((l) => l.id === watchlistId);
    if (target && !target.tickers.includes(ticker)) {
      target.tickers.push(ticker);
      this.saveWatchlists(lists);
    }
  }

  static removeTickerFromWatchlist(watchlistId: string, ticker: TickerSymbol): void {
    const lists = this.getWatchlists();
    const target = lists.find((l) => l.id === watchlistId);
    if (target) {
      target.tickers = target.tickers.filter((t) => t !== ticker);
      this.saveWatchlists(lists);
    }
  }

  // --- SAVED ALERTS ---
  static getSavedAlerts(): SavedAlert[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_ALERTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load saved alerts', e);
    }
    return INITIAL_SAVED_ALERTS;
  }

  static saveAlerts(alerts: SavedAlert[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error('Failed to save alerts', e);
    }
  }

  static createAlert(alert: Omit<SavedAlert, 'id' | 'createdAt' | 'status'>): SavedAlert {
    const alerts = this.getSavedAlerts();
    const newAlert: SavedAlert = {
      ...alert,
      id: 'alt_' + Math.random().toString(36).substring(2, 8),
      status: 'active',
      createdAt: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
    };
    alerts.unshift(newAlert);
    this.saveAlerts(alerts);
    return newAlert;
  }

  static toggleAlertStatus(id: string): void {
    const alerts = this.getSavedAlerts();
    const target = alerts.find((a) => a.id === id);
    if (target) {
      target.status = target.status === 'active' ? 'paused' : 'active';
      this.saveAlerts(alerts);
    }
  }

  static deleteAlert(id: string): void {
    const alerts = this.getSavedAlerts().filter((a) => a.id !== id);
    this.saveAlerts(alerts);
  }

  // --- PREDICTIONS HISTORY ---
  static getPredictions(): HistoricalPrediction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load predictions', e);
    }
    return INITIAL_PREDICTIONS;
  }

  static addPrediction(pred: Omit<HistoricalPrediction, 'id' | 'timestamp'>): HistoricalPrediction {
    const preds = this.getPredictions();
    const newPred: HistoricalPrediction = {
      ...pred,
      id: 'pred_' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
    };
    preds.unshift(newPred);
    try {
      localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(preds));
    } catch (e) {}
    return newPred;
  }

  // --- SUPPORT TICKETS ---
  static getSupportTickets(): SupportTicket[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load support tickets', e);
    }
    return INITIAL_SUPPORT_TICKETS;
  }

  static createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): SupportTicket {
    const tickets = this.getSupportTickets();
    const newTicket: SupportTicket = {
      ...ticket,
      id: 'tkt_' + Math.floor(1000 + Math.random() * 9000),
      status: 'Open',
      createdAt: new Date().toLocaleDateString('en-US') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ET',
      updatedAt: 'Just now',
    };
    tickets.unshift(newTicket);
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
    } catch (e) {}
    return newTicket;
  }

  static resolveSupportTicket(ticketId: string, reply: string): void {
    const tickets = this.getSupportTickets();
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      target.status = 'Resolved';
      target.response = reply;
      target.updatedAt = 'Just now';
      try {
        localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
      } catch (e) {}
    }
  }

  // --- ONBOARDING ---
  static isOnboardingCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
  }

  static hasCompletedOnboarding(): boolean {
    return this.isOnboardingCompleted();
  }

  static setOnboardingCompleted(completed: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed));
  }

  // --- SYSTEM STATUS ---
  static getSystemStatus(): SystemServiceStatus[] {
    return SYSTEM_SERVICES;
  }

  // --- BROADCAST BANNER ---
  static getBroadcastBanner(): string | null {
    return localStorage.getItem(STORAGE_KEYS.BROADCAST) || null;
  }

  static setBroadcastBanner(message: string | null): void {
    if (message) {
      localStorage.setItem(STORAGE_KEYS.BROADCAST, message);
    } else {
      localStorage.removeItem(STORAGE_KEYS.BROADCAST);
    }
  }
}
