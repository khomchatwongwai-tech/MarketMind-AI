export type LanguageCode =
  | 'en'
  | 'es'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja'
  | 'ko'
  | 'th'
  | 'vi'
  | 'fr'
  | 'de'
  | 'pt'
  | 'ar'
  | 'it'
  | 'ru'
  | 'hi'
  | 'tr'
  | 'id'
  | 'nl'
  | 'pl';

export type TextDirection = 'ltr' | 'rtl';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: TextDirection;
  defaultCurrency: string;
}

export type RegionCode =
  | 'US'
  | 'CA'
  | 'GB'
  | 'EU'
  | 'JP'
  | 'KR'
  | 'CN'
  | 'HK'
  | 'SG'
  | 'TH'
  | 'VN'
  | 'IN'
  | 'AU'
  | 'NZ'
  | 'BR'
  | 'MX'
  | 'ME'
  | 'GLOBAL';

export interface RegionInfo {
  code: RegionCode;
  name: string;
  flag: string;
  currency: string;
  defaultTimezone: string;
  primaryExchange: string;
}
