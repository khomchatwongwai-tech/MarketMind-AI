import { LanguageCode } from '../i18n/types';

export interface LanguageLocaleMeta {
  code: LanguageCode;
  name: string;
  nativeName: string;
  geminiPromptName: string;
  direction: 'ltr' | 'rtl';
}

export const LANGUAGE_LOCALE_REGISTRY: Record<LanguageCode, LanguageLocaleMeta> = {
  en: { code: 'en', name: 'English', nativeName: 'English', geminiPromptName: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', geminiPromptName: 'Spanish (Español)', direction: 'ltr' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', geminiPromptName: 'Thai (ภาษาไทย)', direction: 'ltr' },
  'zh-CN': { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文', geminiPromptName: 'Simplified Chinese (简体中文)', direction: 'ltr' },
  'zh-TW': { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文', geminiPromptName: 'Traditional Chinese (繁體中文)', direction: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', geminiPromptName: 'Japanese (日本語)', direction: 'ltr' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', geminiPromptName: 'Korean (한국어)', direction: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', geminiPromptName: 'French (Français)', direction: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', geminiPromptName: 'German (Deutsch)', direction: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', geminiPromptName: 'Portuguese (Português)', direction: 'ltr' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', geminiPromptName: 'Vietnamese (Tiếng Việt)', direction: 'ltr' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', geminiPromptName: 'Hindi (हिन्दी)', direction: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', geminiPromptName: 'Arabic (العربية)', direction: 'rtl' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', geminiPromptName: 'Italian (Italiano)', direction: 'ltr' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', geminiPromptName: 'Russian (Русский)', direction: 'ltr' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', geminiPromptName: 'Turkish (Türkçe)', direction: 'ltr' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', geminiPromptName: 'Indonesian (Bahasa Indonesia)', direction: 'ltr' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', geminiPromptName: 'Dutch (Nederlands)', direction: 'ltr' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', geminiPromptName: 'Polish (Polski)', direction: 'ltr' },
};

/**
 * Standardized AI Prompt localization directive.
 * Ensures all Gemini endpoints (Ask MarketMind, Deep Research, Why Moving, Analysis, etc.)
 * respond in the selected language while strictly preserving tickers, numbers, URLs, and citations.
 */
export function getLanguageInstruction(locale: string = 'en'): string {
  const cleanLocale = (locale || 'en').trim();
  const meta = LANGUAGE_LOCALE_REGISTRY[cleanLocale as LanguageCode] || LANGUAGE_LOCALE_REGISTRY.en;

  if (meta.code === 'en') {
    return 'LANGUAGE DIRECTIVE: Respond in professional, institutional English. Preserve all financial tickers, exact prices, dollar amounts, percentages, SEC form codes, citation IDs, and URLs.';
  }

  return `LANGUAGE DIRECTIVE: Respond in ${meta.geminiPromptName} using clear, highly professional financial terminology. Translate all narrative analysis, insights, explanations, scenarios, and risk advice naturally into ${meta.name}.
CRITICAL DATA PRESERVATION RULES:
1. NEVER translate, alter, or transliterate ticker symbols (e.g. NVDA, SPY, AAPL, BTC/USD).
2. NEVER modify numerical values, strike prices, dollar figures ($XXX.XX), or percentages (+X.XX%).
3. NEVER translate citation IDs (e.g. [cit_1], [cit_2]), source URLs, or filing form names (e.g. 10-K, 10-Q, 8-K, Form 4, 13F).
4. Standardize technical acronyms (e.g. VWAP, RSI, MACD, EMA, SMA, S1, R1, P/E, DCF, EBITDA) appropriately according to institutional market conventions in ${meta.name}.`;
}

/**
 * Translates backend error codes into a user-friendly translation key
 */
export function getErrorCodeKey(errorCode: string): string {
  const code = (errorCode || '').toUpperCase();
  const errorMap: Record<string, string> = {
    AUTH_REQUIRED: 'errors.authRequired',
    UNAUTHORIZED: 'errors.unauthorized',
    FORBIDDEN: 'errors.forbidden',
    RATE_LIMITED: 'errors.rateLimited',
    DATA_UNAVAILABLE: 'errors.dataUnavailable',
    RESEARCH_FAILED: 'errors.researchFailed',
    NETWORK_ERROR: 'errors.networkError',
    INVALID_REQUEST: 'errors.invalidRequest',
    PAYMENT_REQUIRED: 'errors.paymentRequired',
    NOT_FOUND: 'errors.notFound',
    INTERNAL_ERROR: 'errors.internalError',
    SESSION_EXPIRED: 'errors.sessionExpired',
  };
  return errorMap[code] || 'errors.genericError';
}
