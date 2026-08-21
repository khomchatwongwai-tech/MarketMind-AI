import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { getLanguageInstruction } from '../src/services/aiLanguageHelper.js';

const localesDir = path.resolve(process.cwd(), 'src/i18n/locales');
const targetLocales = ['en', 'es', 'zh-CN', 'zh-TW', 'th', 'ko', 'ja', 'vi', 'fr'];

function getNestedKeysAndValues(obj: any, prefix = ''): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const subMap = getNestedKeysAndValues(obj[key], fullKey);
      subMap.forEach((val, k) => map.set(k, val));
    } else if (typeof obj[key] === 'string') {
      map.set(fullKey, obj[key]);
    }
  }
  return map;
}

function extractInterpolationVariables(str: string): string[] {
  const matches = str.match(/\{[a-zA-Z0-9_]+\}/g) || [];
  return Array.from(new Set(matches)).sort();
}

const enData = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const enMap = getNestedKeysAndValues(enData);

test('AUDIT 1: Locale Completeness - 100% key match across all 8 target languages', () => {
  assert.ok(enMap.size >= 400, `Expected at least 400 translation keys in en.json, found ${enMap.size}`);

  const completenessReport: Record<string, string> = {};

  for (const locale of targetLocales) {
    const filePath = path.join(localesDir, `${locale}.json`);
    assert.ok(fs.existsSync(filePath), `Missing required locale file: ${locale}.json`);

    const localeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const localeMap = getNestedKeysAndValues(localeData);

    const missingKeys: string[] = [];
    enMap.forEach((_, key) => {
      if (!localeMap.has(key)) {
        missingKeys.push(key);
      }
    });

    const matchedPercent = (((enMap.size - missingKeys.length) / enMap.size) * 100).toFixed(1);
    completenessReport[locale] = `${matchedPercent}%`;

    assert.equal(
      missingKeys.length,
      0,
      `Locale "${locale}" is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 5).join(', ')}`
    );

    // Verify key count matches exactly (no English-only orphaned keys)
    const extraKeys: string[] = [];
    localeMap.forEach((_, key) => {
      if (!enMap.has(key)) {
        extraKeys.push(key);
      }
    });

    assert.equal(
      extraKeys.length,
      0,
      `Locale "${locale}" has ${extraKeys.length} extra orphan keys not in English: ${extraKeys.slice(0, 5).join(', ')}`
    );
  }

  console.log('--- CI LOCALE COMPLETENESS REPORT ---');
  console.log(`English: 100%`);
  console.log(`Spanish: ${completenessReport['es']}`);
  console.log(`Chinese: ${completenessReport['zh-CN']}`);
  console.log(`Thai: ${completenessReport['th']}`);
  console.log(`Korean: ${completenessReport['ko']}`);
  console.log(`Japanese: ${completenessReport['ja']}`);
  console.log(`Vietnamese: ${completenessReport['vi']}`);
  console.log(`French: ${completenessReport['fr']}`);
  console.log('------------------------------------');
});

test('AUDIT 2: Interpolation Variable Parity - variables match across all languages', () => {
  for (const [key, enVal] of enMap.entries()) {
    const enVars = extractInterpolationVariables(enVal);
    if (enVars.length === 0) continue;

    for (const locale of targetLocales) {
      if (locale === 'en') continue;
      const localeData = JSON.parse(fs.readFileSync(path.join(localesDir, `${locale}.json`), 'utf8'));
      const localeMap = getNestedKeysAndValues(localeData);
      const locVal = localeMap.get(key);

      if (locVal) {
        const locVars = extractInterpolationVariables(locVal);
        assert.deepEqual(
          locVars,
          enVars,
          `Interpolation mismatch for key "${key}" in locale "${locale}". Expected ${enVars.join(', ')}, got ${locVars.join(', ')}`
        );
      }
    }
  }
});

test('AUDIT 3: Major Production Component i18n Hook Coverage', () => {
  const majorComponents = [
    'src/components/Header.tsx',
    'src/components/Navigation.tsx',
    'src/components/LanguageSelector.tsx',
    'src/components/AskMarketMindChat.tsx',
    'src/components/research/DeepResearchWorkspace.tsx',
    'src/components/AccountSettingsModal.tsx',
    'src/components/markets/MarketScannerView.tsx',
    'src/components/optionsTrader/OptionsTraderView.tsx',
    'src/components/EconomicFedView.tsx',
  ];

  for (const compPath of majorComponents) {
    const fullPath = path.resolve(process.cwd(), compPath);
    assert.ok(fs.existsSync(fullPath), `Component file missing: ${compPath}`);
    const code = fs.readFileSync(fullPath, 'utf8');

    const usesI18n = code.includes('useI18n') || code.includes('useTranslation') || code.includes('t(');
    assert.ok(usesI18n, `Component ${compPath} does not utilize i18n translation hooks`);
  }
});

test('AUDIT 4: Selected Language Persistence & Document lang Sync', () => {
  const contextCode = fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/I18nContext.tsx'), 'utf8');
  assert.ok(contextCode.includes('document.documentElement.lang = language'), 'I18nContext missing document.documentElement.lang update');
  assert.ok(contextCode.includes('localStorage.setItem'), 'I18nContext missing localStorage persistence');
  assert.ok(contextCode.includes('detectBrowserLanguage'), 'I18nContext missing browser language detection');
});

test('AUDIT 5: Financial Market Data Integrity & Ticker Immutability', () => {
  const thDirective = getLanguageInstruction('th');
  assert.ok(thDirective.includes('NEVER translate, alter, or transliterate ticker symbols'), 'Thai directive missing ticker preservation rule');
  assert.ok(thDirective.includes('NEVER modify numerical values'), 'Thai directive missing numeric preservation rule');

  const esDirective = getLanguageInstruction('es');
  assert.ok(esDirective.includes('Spanish'), 'Spanish AI instruction missing target language name');
  assert.ok(esDirective.includes('citation IDs'), 'Spanish directive missing citation preservation rule');

  const jaDirective = getLanguageInstruction('ja');
  assert.ok(jaDirective.includes('Japanese'), 'Japanese AI instruction missing target language name');
});

test('AUDIT 6: Production Hardcoded String Exclusion Check', () => {
  const targetComponents = [
    'src/components/Header.tsx',
    'src/components/Navigation.tsx',
    'src/components/MarketMindSummaryCard.tsx',
    'src/components/WhatChangedRetentionCard.tsx',
    'src/components/MarketTape.tsx',
  ];

  const bannedLiterals = [
    'MARKET INTELLIGENCE CENTER',
    'WHAT CHANGED SINCE YOUR LAST VISIT?',
    'INSTITUTIONAL OVERVIEW',
    'DIRECT MULTI-FEED',
    'Sub-millisecond Routing',
  ];

  for (const compPath of targetComponents) {
    const fullPath = path.resolve(process.cwd(), compPath);
    assert.ok(fs.existsSync(fullPath), `Component file missing: ${compPath}`);
    const code = fs.readFileSync(fullPath, 'utf8');

    for (const banned of bannedLiterals) {
      const containsLiteral = code.includes(`>${banned}<`) || code.includes(`"${banned}"`) || code.includes(`'${banned}'`);
      assert.ok(
        !containsLiteral,
        `Hardcoded production UI string "${banned}" found in ${compPath}. Use translation keys instead.`
      );
    }
  }
});
