import { LanguageCode, LanguageInfo, RegionCode, RegionInfo } from './types';

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    defaultCurrency: 'USD',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr',
    defaultCurrency: 'EUR',
  },
  'zh-CN': {
    code: 'zh-CN',
    name: 'Simplified Chinese',
    nativeName: '简体中文',
    flag: '🇨🇳',
    dir: 'ltr',
    defaultCurrency: 'CNY',
  },
  'zh-TW': {
    code: 'zh-TW',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    dir: 'ltr',
    defaultCurrency: 'TWD',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
    defaultCurrency: 'JPY',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
    defaultCurrency: 'KRW',
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    dir: 'ltr',
    defaultCurrency: 'THB',
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    dir: 'ltr',
    defaultCurrency: 'VND',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
    defaultCurrency: 'EUR',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr',
    defaultCurrency: 'EUR',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    dir: 'ltr',
    defaultCurrency: 'BRL',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
    defaultCurrency: 'SAR',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    dir: 'ltr',
    defaultCurrency: 'EUR',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr',
    defaultCurrency: 'USD',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr',
    defaultCurrency: 'INR',
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    dir: 'ltr',
    defaultCurrency: 'TRY',
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    dir: 'ltr',
    defaultCurrency: 'IDR',
  },
  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    dir: 'ltr',
    defaultCurrency: 'EUR',
  },
  pl: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    dir: 'ltr',
    defaultCurrency: 'PLN',
  },
};

export const SUPPORTED_REGIONS: Record<RegionCode, RegionInfo> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    defaultTimezone: 'America/New_York',
    primaryExchange: 'NYSE / NASDAQ',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    defaultTimezone: 'America/Toronto',
    primaryExchange: 'TSX',
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    defaultTimezone: 'Europe/London',
    primaryExchange: 'LSE',
  },
  EU: {
    code: 'EU',
    name: 'European Union',
    flag: '🇪🇺',
    currency: 'EUR',
    defaultTimezone: 'Europe/Frankfurt',
    primaryExchange: 'Euronext / XETRA',
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    defaultTimezone: 'Asia/Tokyo',
    primaryExchange: 'TSE',
  },
  KR: {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    currency: 'KRW',
    defaultTimezone: 'Asia/Seoul',
    primaryExchange: 'KRX',
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    currency: 'CNY',
    defaultTimezone: 'Asia/Shanghai',
    primaryExchange: 'SSE / SZSE',
  },
  HK: {
    code: 'HK',
    name: 'Hong Kong',
    flag: '🇭🇰',
    currency: 'HKD',
    defaultTimezone: 'Asia/Hong_Kong',
    primaryExchange: 'HKEX',
  },
  SG: {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    defaultTimezone: 'Asia/Singapore',
    primaryExchange: 'SGX',
  },
  TH: {
    code: 'TH',
    name: 'Thailand',
    flag: '🇹🇭',
    currency: 'THB',
    defaultTimezone: 'Asia/Bangkok',
    primaryExchange: 'SET',
  },
  VN: {
    code: 'VN',
    name: 'Vietnam',
    flag: '🇻🇳',
    currency: 'VND',
    defaultTimezone: 'Asia/Ho_Chi_Minh',
    primaryExchange: 'HOSE',
  },
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    defaultTimezone: 'Asia/Kolkata',
    primaryExchange: 'NSE / BSE',
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    defaultTimezone: 'Australia/Sydney',
    primaryExchange: 'ASX',
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    defaultTimezone: 'Pacific/Auckland',
    primaryExchange: 'NZX',
  },
  BR: {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    defaultTimezone: 'America/Sao_Paulo',
    primaryExchange: 'B3',
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    defaultTimezone: 'America/Mexico_City',
    primaryExchange: 'BMV',
  },
  ME: {
    code: 'ME',
    name: 'Middle East',
    flag: '🇸🇦',
    currency: 'SAR',
    defaultTimezone: 'Asia/Riyadh',
    primaryExchange: 'Tadawul / DFM',
  },
  GLOBAL: {
    code: 'GLOBAL',
    name: 'Global / International',
    flag: '🌐',
    currency: 'USD',
    defaultTimezone: 'UTC',
    primaryExchange: 'Global Multi-Asset',
  },
};

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
export const DEFAULT_REGION: RegionCode = 'US';

/**
 * Detect user's browser language on first load.
 */
export function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined' || !navigator) return DEFAULT_LANGUAGE;

  const browserLangs = navigator.languages || [navigator.language || ''];

  for (const rawLang of browserLangs) {
    if (!rawLang) continue;
    const cleanLang = rawLang.toLowerCase();

    // Check exact matches like zh-tw, zh-cn
    if (cleanLang === 'zh-tw' || cleanLang === 'zh-hk' || cleanLang === 'zh-hant') return 'zh-TW';
    if (cleanLang.startsWith('zh')) return 'zh-CN';
    if (cleanLang.startsWith('es')) return 'es';
    if (cleanLang.startsWith('ja')) return 'ja';
    if (cleanLang.startsWith('ko')) return 'ko';
    if (cleanLang.startsWith('th')) return 'th';
    if (cleanLang.startsWith('vi')) return 'vi';
    if (cleanLang.startsWith('fr')) return 'fr';
    if (cleanLang.startsWith('de')) return 'de';
    if (cleanLang.startsWith('pt')) return 'pt';
    if (cleanLang.startsWith('ar')) return 'ar';
    if (cleanLang.startsWith('it')) return 'it';
    if (cleanLang.startsWith('ru')) return 'ru';
    if (cleanLang.startsWith('hi')) return 'hi';
    if (cleanLang.startsWith('tr')) return 'tr';
    if (cleanLang.startsWith('id')) return 'id';
    if (cleanLang.startsWith('nl')) return 'nl';
    if (cleanLang.startsWith('pl')) return 'pl';
    if (cleanLang.startsWith('en')) return 'en';
  }

  return DEFAULT_LANGUAGE;
}
