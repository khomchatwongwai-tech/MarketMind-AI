import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageCode, LanguageInfo, RegionCode, RegionInfo, TextDirection } from './types';
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_REGIONS,
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
  detectBrowserLanguage,
} from './config';
import { LOCALE_DICTIONARIES } from './locales';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  region: RegionCode;
  setRegion: (reg: RegionCode) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  currency: string;
  setCurrency: (cur: string) => void;
  aiLanguage: LanguageCode;
  setAiLanguage: (lang: LanguageCode) => void;
  dir: TextDirection;
  currentLanguageInfo: LanguageInfo;
  currentRegionInfo: RegionInfo;
  languages: LanguageInfo[];
  regions: RegionInfo[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEYS = {
  LANGUAGE: 'marketmind_language_pref',
  REGION: 'marketmind_region_pref',
  TIMEZONE: 'marketmind_timezone_pref',
  CURRENCY: 'marketmind_currency_pref',
  AI_LANGUAGE: 'marketmind_ai_language_pref',
};

// Nested path resolver helper
function getNestedTranslation(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language initialization (Saved > Browser detection > Default EN)
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as LanguageCode | null;
      if (saved && SUPPORTED_LANGUAGES[saved]) {
        return saved;
      }
      return detectBrowserLanguage();
    } catch {
      return DEFAULT_LANGUAGE;
    }
  });

  // Region initialization
  const [region, setRegionState] = useState<RegionCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGION) as RegionCode | null;
      if (saved && SUPPORTED_REGIONS[saved]) {
        return saved;
      }
      // Infer basic region from detected language or fallback
      const browserLang = detectBrowserLanguage();
      if (browserLang === 'th') return 'TH';
      if (browserLang === 'ja') return 'JP';
      if (browserLang === 'ko') return 'KR';
      if (browserLang === 'zh-CN') return 'CN';
      if (browserLang === 'zh-TW') return 'HK';
      if (browserLang === 'vi') return 'VN';
      if (browserLang === 'fr' || browserLang === 'de' || browserLang === 'it') return 'EU';
      if (browserLang === 'pt') return 'BR';
      if (browserLang === 'ar') return 'ME';
      return DEFAULT_REGION;
    } catch {
      return DEFAULT_REGION;
    }
  });

  // Timezone initialization
  const [timezone, setTimezoneState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TIMEZONE);
      if (saved) return saved;
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    } catch {
      return 'America/New_York';
    }
  });

  // Currency initialization
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      if (saved) return saved;
      return SUPPORTED_REGIONS[region]?.currency || 'USD';
    } catch {
      return 'USD';
    }
  });

  // AI Response Language
  const [aiLanguage, setAiLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AI_LANGUAGE) as LanguageCode | null;
      if (saved && SUPPORTED_LANGUAGES[saved]) return saved;
      return language;
    } catch {
      return language;
    }
  });

  const currentLanguageInfo = useMemo(() => SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en, [language]);
  const currentRegionInfo = useMemo(() => SUPPORTED_REGIONS[region] || SUPPORTED_REGIONS.US, [region]);
  const dir = currentLanguageInfo.dir;

  // Sync HTML document direction and lang attributes immediately
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }
  }, [dir, language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (!SUPPORTED_LANGUAGES[lang]) return;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  }, []);

  const setRegion = useCallback((reg: RegionCode) => {
    if (!SUPPORTED_REGIONS[reg]) return;
    setRegionState(reg);
    try {
      localStorage.setItem(STORAGE_KEYS.REGION, reg);
    } catch (e) {
      console.warn('Could not save region preference:', e);
    }
  }, []);

  const setTimezone = useCallback((tz: string) => {
    setTimezoneState(tz);
    try {
      localStorage.setItem(STORAGE_KEYS.TIMEZONE, tz);
    } catch (e) {
      console.warn('Could not save timezone preference:', e);
    }
  }, []);

  const setCurrency = useCallback((cur: string) => {
    setCurrencyState(cur);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, cur);
    } catch (e) {
      console.warn('Could not save currency preference:', e);
    }
  }, []);

  const setAiLanguage = useCallback((lang: LanguageCode) => {
    if (!SUPPORTED_LANGUAGES[lang]) return;
    setAiLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.AI_LANGUAGE, lang);
    } catch (e) {
      console.warn('Could not save AI language preference:', e);
    }
  }, []);

  // Centralized string translation lookup with fallback to English
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict = LOCALE_DICTIONARIES[language] || LOCALE_DICTIONARIES.en;
      let text = getNestedTranslation(activeDict, key);

      // Fallback to English dictionary if key is missing in target language
      if (!text && language !== 'en') {
        text = getNestedTranslation(LOCALE_DICTIONARIES.en, key);
      }

      // If still not found, return the key itself gracefully (or the last segment)
      if (!text) {
        return key;
      }

      // Handle simple parameter replacement: {name}, {count}, etc.
      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = (text as string).replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return text;
    },
    [language]
  );

  const languages = useMemo(() => Object.values(SUPPORTED_LANGUAGES), []);
  const regions = useMemo(() => Object.values(SUPPORTED_REGIONS), []);

  const value = useMemo<I18nContextType>(
    () => ({
      language,
      setLanguage,
      region,
      setRegion,
      timezone,
      setTimezone,
      currency,
      setCurrency,
      aiLanguage,
      setAiLanguage,
      dir,
      currentLanguageInfo,
      currentRegionInfo,
      languages,
      regions,
      t,
    }),
    [
      language,
      setLanguage,
      region,
      setRegion,
      timezone,
      setTimezone,
      currency,
      setCurrency,
      aiLanguage,
      setAiLanguage,
      dir,
      currentLanguageInfo,
      currentRegionInfo,
      languages,
      regions,
      t,
    ]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Convenient alias
export const useTranslation = useI18n;
