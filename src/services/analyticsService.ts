/**
 * MarketMind AI - Product Analytics & User Activation Engine
 * Privacy-preserving event tracking for activation, retention, and feedback.
 */

export type AnalyticsEventName =
  | 'signup_completed'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'ticker_searched'
  | 'asset_opened'
  | 'why_moving_opened'
  | 'ai_question_asked'
  | 'explain_simply_opened'
  | 'watchlist_created'
  | 'watchlist_asset_added'
  | 'alert_created'
  | 'morning_brief_opened'
  | 'closing_bell_opened'
  | 'notification_opened'
  | 'pricing_viewed'
  | 'trial_started'
  | 'trial_expired'
  | 'checkout_started'
  | 'subscription_started'
  | 'plan_changed'
  | 'subscription_cancelled'
  | 'limit_reached'
  | 'data_issue_reported'
  | 'user_activated'
  | 'demo_mode_toggled';

export interface AnalyticsEvent {
  id: string;
  eventName: AnalyticsEventName;
  userId?: string;
  timestamp: string;
  properties?: Record<string, any>;
}

export class AnalyticsService {
  private static STORAGE_KEY = 'marketmind_analytics_events';
  private static ACTIVATION_KEY = 'marketmind_user_activated';

  static track(eventName: AnalyticsEventName, properties?: Record<string, any>): void {
    try {
      const event: AnalyticsEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventName,
        timestamp: new Date().toISOString(),
        properties: properties || {},
      };

      // Store in memory / local telemetry log
      const existing = this.getRecentEvents();
      const updated = [event, ...existing].slice(0, 100);
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }

      // Check if user is now activated
      this.checkActivationCriteria(eventName);

      // In production, can forward to backend metrics endpoint without sensitive payload
      if (typeof window !== 'undefined' && window.fetch) {
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventName, timestamp: event.timestamp }),
        }).catch(() => {
          // Non-blocking telemetry
        });
      }
    } catch {
      // Fail silently to avoid breaking user interactions
    }
  }

  private static checkActivationCriteria(lastEvent: AnalyticsEventName): void {
    if (typeof window === 'undefined') return;
    const isAlreadyActivated = localStorage.getItem(this.ACTIVATION_KEY) === 'true';
    if (isAlreadyActivated) return;

    // Activation criteria:
    // 1. Completed onboarding
    // 2. Searched / opened asset
    // 3. Added at least one symbol or created watchlist
    // 4. Viewed MarketMind analysis or Why Moving report
    const events = this.getRecentEvents();
    const eventNames = new Set(events.map((e) => e.eventName));
    eventNames.add(lastEvent);

    const hasOnboarded = eventNames.has('onboarding_completed');
    const hasSearched = eventNames.has('ticker_searched') || eventNames.has('asset_opened');
    const hasWatchlist = eventNames.has('watchlist_asset_added') || eventNames.has('watchlist_created');
    const hasViewedAnalysis =
      eventNames.has('why_moving_opened') ||
      eventNames.has('ai_question_asked') ||
      eventNames.has('explain_simply_opened');

    if (hasOnboarded && hasSearched && hasWatchlist && hasViewedAnalysis) {
      localStorage.setItem(this.ACTIVATION_KEY, 'true');
      this.track('user_activated', { activatedAt: new Date().toISOString() });
    }
  }

  static isUserActivated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.ACTIVATION_KEY) === 'true';
  }

  static getRecentEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
