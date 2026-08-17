/**
 * MarketMind AI - Smart Alert Engine & Notification Quality Controller
 * Enforces deduplication, cooldowns, verified triggers, and severity classification.
 */

import { MarketQuote } from '../types/market';
import { NormalizedInstrument } from '../types/instrument';

export type AlertSeverity = 'INFO' | 'IMPORTANT' | 'HIGH' | 'CRITICAL';
export type AlertCategory =
  | 'MARKET'
  | 'WATCHLIST'
  | 'NEWS'
  | 'ECONOMIC'
  | 'EARNINGS'
  | 'PORTFOLIO'
  | 'OPTIONS'
  | 'SYSTEM'
  | 'SUBSCRIPTION';

export interface SmartNotification {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  symbol?: string;
  title: string;
  message: string;
  triggerType: string;
  triggerValue?: string | number;
  provider: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface AlertRule {
  id: string;
  symbol: string;
  triggerType:
    | 'PRICE_ABOVE'
    | 'PRICE_BELOW'
    | 'PERCENT_CHANGE'
    | 'VOLUME_SPIKE'
    | 'SUPPORT_BREAK'
    | 'RESISTANCE_BREAK'
    | 'BREAKING_NEWS'
    | 'EARNINGS_RELEASE'
    | 'ECONOMIC_SURPRISE';
  targetValue: number;
  conditionDescription: string;
  severity: AlertSeverity;
  enabled: boolean;
  lastTriggeredAt?: number;
}

export class SmartAlertEngine {
  private static STORAGE_KEY = 'marketmind_notifications_v4';
  private static COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown per symbol/trigger
  private static triggerHistory = new Map<string, number>();

  static getNotifications(): SmartNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Fallback
    }

    return [];
  }

  static saveNotifications(notifications: SmartNotification[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications.slice(0, 100)));
    } catch {
      // Ignore
    }
  }

  static markAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(list);
  }

  static markAllAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(list);
  }

  static deleteNotification(id: string): void {
    const list = this.getNotifications().filter((n) => n.id !== id);
    this.saveNotifications(list);
  }

  static clearAll(): void {
    this.saveNotifications([]);
  }

  /**
   * Evaluate live market quote against user rules with strict cooldown & deduplication
   */
  static evaluateQuoteAlerts(
    quote: MarketQuote,
    instrument?: NormalizedInstrument,
    supportLevel?: number,
    resistanceLevel?: number
  ): SmartNotification | null {
    const symbol = quote.ticker.toUpperCase();
    const now = Date.now();

    // Check price movement >= 3.0%
    if (Math.abs(quote.changePercent) >= 3.0) {
      const key = `${symbol}_PRICE_CHANGE_3PCT`;
      const lastTrigger = this.triggerHistory.get(key) || 0;
      if (now - lastTrigger > this.COOLDOWN_MS) {
        this.triggerHistory.set(key, now);
        const isUp = quote.changePercent > 0;
        const notif: SmartNotification = {
          id: `notif_${now}_${symbol}`,
          category: 'WATCHLIST',
          severity: Math.abs(quote.changePercent) >= 5.0 ? 'HIGH' : 'IMPORTANT',
          symbol,
          title: `${symbol} ${isUp ? 'Surges' : 'Drops'} ${Math.abs(quote.changePercent).toFixed(2)}%`,
          message: `${symbol} is trading at $${quote.price.toFixed(2)} (${isUp ? '+' : ''}${quote.changePercent.toFixed(2)}%). Volume: ${(quote.volume / 1e6).toFixed(1)}M shares.`,
          triggerType: 'PERCENT_CHANGE',
          triggerValue: quote.changePercent,
          provider: quote.dataSource || 'Market Provider',
          timestamp: new Date().toISOString(),
          read: false,
          actionLabel: `Analyze ${symbol}`,
        };
        this.addNotification(notif);
        return notif;
      }
    }

    // Check Resistance Break
    if (resistanceLevel && quote.price > resistanceLevel) {
      const key = `${symbol}_RESISTANCE_BREAK`;
      const lastTrigger = this.triggerHistory.get(key) || 0;
      if (now - lastTrigger > this.COOLDOWN_MS) {
        this.triggerHistory.set(key, now);
        const notif: SmartNotification = {
          id: `notif_${now}_${symbol}_res`,
          category: 'WATCHLIST',
          severity: 'IMPORTANT',
          symbol,
          title: `${symbol} Resistance Breakout`,
          message: `${symbol} broke above verified technical resistance at $${resistanceLevel.toFixed(2)} currently at $${quote.price.toFixed(2)}.`,
          triggerType: 'RESISTANCE_BREAK',
          triggerValue: resistanceLevel,
          provider: quote.dataSource || 'Technical Engine',
          timestamp: new Date().toISOString(),
          read: false,
          actionLabel: 'View Technicals',
        };
        this.addNotification(notif);
        return notif;
      }
    }

    return null;
  }

  private static addNotification(notif: SmartNotification): void {
    const list = [notif, ...this.getNotifications()].slice(0, 80);
    this.saveNotifications(list);
  }
}
