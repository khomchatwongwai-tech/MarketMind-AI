/**
 * MarketMind Locale-Aware Formatter Utilities
 * Provides high-precision financial number, date, time, and exchange timezone formatting
 */

import { LanguageCode, RegionCode } from './types.js';

/**
 * Format a financial number with locale-aware thousand separators and decimal places
 */
export function formatNumber(
  value: number | string | null | undefined,
  locale: LanguageCode = 'en',
  options: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return '—';

  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch (e) {
    return num.toFixed(options.maximumFractionDigits ?? 2);
  }
}

/**
 * Format stock price with currency code / symbol
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currencyCode: string = 'USD',
  locale: LanguageCode = 'en',
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return '—';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' || currencyCode === 'VND' ? 0 : decimals,
      maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' || currencyCode === 'VND' ? 0 : decimals,
    }).format(num);
  } catch (e) {
    const symbol = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : currencyCode === 'GBP' ? '£' : `${currencyCode} `;
    return `${symbol}${num.toFixed(decimals)}`;
  }
}

/**
 * Format percentage with positive sign if applicable
 */
export function formatPercent(
  value: number | string | null | undefined,
  locale: LanguageCode = 'en',
  includeSign: boolean = true,
  decimals: number = 2
): string {
  if (value === null || value === undefined || value === '') return '—%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return '—%';

  const prefix = includeSign && num > 0 ? '+' : '';
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
    return `${prefix}${formatted}%`;
  } catch {
    return `${prefix}${num.toFixed(decimals)}%`;
  }
}

/**
 * Format large volume (K, M, B, T) with locale
 */
export function formatCompactNumber(
  value: number | string | null | undefined,
  locale: LanguageCode = 'en'
): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) return '—';

  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  }
}

/**
 * Format date/time according to the selected timezone
 */
export function formatDateTime(
  dateOrTimestamp: Date | string | number,
  timezone: string = 'America/New_York',
  locale: LanguageCode = 'en',
  formatStyle: 'full' | 'time' | 'date' | 'compact' = 'full'
): string {
  try {
    const d = typeof dateOrTimestamp === 'number' || typeof dateOrTimestamp === 'string'
      ? new Date(dateOrTimestamp)
      : dateOrTimestamp;

    if (isNaN(d.getTime())) return '—';

    let options: Intl.DateTimeFormatOptions;

    switch (formatStyle) {
      case 'time':
        options = {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: timezone,
          hour12: false,
        };
        break;
      case 'date':
        options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: timezone,
        };
        break;
      case 'compact':
        options = {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone,
          hour12: false,
        };
        break;
      case 'full':
      default:
        options = {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: timezone,
          hour12: false,
        };
        break;
    }

    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch (e) {
    return new Date(dateOrTimestamp).toLocaleString();
  }
}

/**
 * International Market Exchanges & Session Model
 */
export interface ExchangeInfo {
  code: string;
  name: string;
  country: string;
  city: string;
  timezone: string;
  currency: string;
  openLocal: string; // "09:30"
  closeLocal: string; // "16:00"
  hasLunchBreak?: boolean;
  lunchStartLocal?: string; // "11:30"
  lunchEndLocal?: string; // "12:30"
}

export const GLOBAL_EXCHANGES: Record<string, ExchangeInfo> = {
  NYSE: {
    code: 'NYSE',
    name: 'New York Stock Exchange',
    country: 'United States',
    city: 'New York',
    timezone: 'America/New_York',
    currency: 'USD',
    openLocal: '09:30',
    closeLocal: '16:00',
  },
  NASDAQ: {
    code: 'NASDAQ',
    name: 'Nasdaq Stock Market',
    country: 'United States',
    city: 'New York',
    timezone: 'America/New_York',
    currency: 'USD',
    openLocal: '09:30',
    closeLocal: '16:00',
  },
  LSE: {
    code: 'LSE',
    name: 'London Stock Exchange',
    country: 'United Kingdom',
    city: 'London',
    timezone: 'Europe/London',
    currency: 'GBP',
    openLocal: '08:00',
    closeLocal: '16:30',
  },
  TSE: {
    code: 'TSE',
    name: 'Tokyo Stock Exchange',
    country: 'Japan',
    city: 'Tokyo',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    openLocal: '09:00',
    closeLocal: '15:30',
    hasLunchBreak: true,
    lunchStartLocal: '11:30',
    lunchEndLocal: '12:30',
  },
  HKEX: {
    code: 'HKEX',
    name: 'Hong Kong Exchanges',
    country: 'Hong Kong',
    city: 'Hong Kong',
    timezone: 'Asia/Hong_Kong',
    currency: 'HKD',
    openLocal: '09:30',
    closeLocal: '16:00',
    hasLunchBreak: true,
    lunchStartLocal: '12:00',
    lunchEndLocal: '13:00',
  },
  EURONEXT: {
    code: 'EURONEXT',
    name: 'Euronext Paris / Amsterdam',
    country: 'European Union',
    city: 'Paris',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    openLocal: '09:00',
    closeLocal: '17:30',
  },
  XETRA: {
    code: 'XETRA',
    name: 'Frankfurt Stock Exchange (Xetra)',
    country: 'Germany',
    city: 'Frankfurt',
    timezone: 'Europe/Berlin',
    currency: 'EUR',
    openLocal: '09:00',
    closeLocal: '17:30',
  },
  ASX: {
    code: 'ASX',
    name: 'Australian Securities Exchange',
    country: 'Australia',
    city: 'Sydney',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    openLocal: '10:00',
    closeLocal: '16:00',
  },
  SET: {
    code: 'SET',
    name: 'Stock Exchange of Thailand',
    country: 'Thailand',
    city: 'Bangkok',
    timezone: 'Asia/Bangkok',
    currency: 'THB',
    openLocal: '10:00',
    closeLocal: '16:30',
    hasLunchBreak: true,
    lunchStartLocal: '12:30',
    lunchEndLocal: '14:00',
  },
  SGX: {
    code: 'SGX',
    name: 'Singapore Exchange',
    country: 'Singapore',
    city: 'Singapore',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    openLocal: '09:00',
    closeLocal: '17:00',
    hasLunchBreak: true,
    lunchStartLocal: '12:00',
    lunchEndLocal: '13:00',
  },
  NSE: {
    code: 'NSE',
    name: 'National Stock Exchange of India',
    country: 'India',
    city: 'Mumbai',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    openLocal: '09:15',
    closeLocal: '15:30',
  },
};

/**
 * Get real-time open/closed status for an international exchange
 */
export function getExchangeSessionStatus(exchangeCode: string = 'NYSE'): {
  isOpen: boolean;
  statusText: string;
  localTimeStr: string;
  nextEventText: string;
} {
  const exchange = GLOBAL_EXCHANGES[exchangeCode.toUpperCase()] || GLOBAL_EXCHANGES.NYSE;
  const now = new Date();

  // Get current time in exchange's local timezone
  const localTimeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: exchange.timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const hour = parseInt(localTimeParts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(localTimeParts.find((p) => p.type === 'minute')?.value || '0', 10);
  const weekday = localTimeParts.find((p) => p.type === 'weekday')?.value || 'Mon';

  const currentMinutes = hour * 60 + minute;

  const [openHour, openMin] = exchange.openLocal.split(':').map(Number);
  const [closeHour, closeMin] = exchange.closeLocal.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} (${exchange.timezone.split('/')[1]?.replace('_', ' ')})`;

  if (isWeekend) {
    return {
      isOpen: false,
      statusText: 'WEEKEND CLOSED',
      localTimeStr: timeString,
      nextEventText: `Opens Monday ${exchange.openLocal} local`,
    };
  }

  // Check lunch break if applicable
  if (exchange.hasLunchBreak && exchange.lunchStartLocal && exchange.lunchEndLocal) {
    const [lStartH, lStartM] = exchange.lunchStartLocal.split(':').map(Number);
    const [lEndH, lEndM] = exchange.lunchEndLocal.split(':').map(Number);
    const lunchStartMinutes = lStartH * 60 + lStartM;
    const lunchEndMinutes = lEndH * 60 + lEndM;

    if (currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes) {
      return {
        isOpen: false,
        statusText: 'LUNCH BREAK',
        localTimeStr: timeString,
        nextEventText: `Afternoon session resumes at ${exchange.lunchEndLocal}`,
      };
    }
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      statusText: 'REGULAR SESSION LIVE',
      localTimeStr: timeString,
      nextEventText: `Closes at ${exchange.closeLocal} local`,
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: 'PRE-MARKET / CLOSED',
      localTimeStr: timeString,
      nextEventText: `Opens at ${exchange.openLocal} local`,
    };
  }

  return {
    isOpen: false,
    statusText: 'POST-MARKET / CLOSED',
    localTimeStr: timeString,
    nextEventText: `Opens next session at ${exchange.openLocal} local`,
  };
}
