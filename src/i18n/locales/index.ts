import en from './en.json';
import es from './es.json';
import zhCN from './zh-CN.json';
import zhTW from './zh-TW.json';
import ja from './ja.json';
import ko from './ko.json';
import th from './th.json';
import vi from './vi.json';
import fr from './fr.json';
import de from './de.json';
import pt from './pt.json';
import ar from './ar.json';
import it from './it.json';
import hi from './hi.json';
import { LanguageCode } from '../types';

export const LOCALE_DICTIONARIES: Record<LanguageCode, Record<string, any>> = {
  en,
  es,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ja,
  ko,
  th,
  vi,
  fr,
  de,
  pt,
  ar,
  it,
  hi,
  // Fallbacks mapped gracefully to standard translations
  ru: en,
  tr: en,
  id: en,
  nl: de,
  pl: en,
};
