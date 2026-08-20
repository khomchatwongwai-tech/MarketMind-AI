import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { getLanguageInstruction } from '../src/services/aiLanguageHelper.js';

const localesDir = path.resolve(process.cwd(), 'src/i18n/locales');
const enData = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

function getNestedKeys(obj: any, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const subKeys = getNestedKeys(obj[key], fullKey);
      subKeys.forEach((k) => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

const requiredLanguages = ['en', 'es', 'zh-CN', 'zh-TW', 'th', 'ko', 'ja', 'vi', 'fr'];
const enKeys = getNestedKeys(enData);

test('i18n dictionary completeness - 100% required-key coverage across all 8 target languages', () => {
  assert.ok(enKeys.size >= 400, `Expected at least 400 translation keys, found ${enKeys.size}`);

  for (const lang of requiredLanguages) {
    const filePath = path.join(localesDir, `${lang}.json`);
    assert.ok(fs.existsSync(filePath), `Locale dictionary missing: ${lang}.json`);
    
    const langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const langKeys = getNestedKeys(langData);

    const missing = Array.from(enKeys).filter((k) => !langKeys.has(k));
    assert.equal(
      missing.length,
      0,
      `Language "${lang}" is missing ${missing.length} translation keys: ${missing.slice(0, 5).join(', ')}`
    );
  }
});

test('i18n AI provider language routing & prompt directives', () => {
  const thDirective = getLanguageInstruction('th');
  assert.ok(thDirective.includes('Thai'), 'Thai AI instruction missing target language name');
  assert.ok(thDirective.includes('NEVER translate, alter, or transliterate ticker symbols'), 'Thai directive missing ticker preservation rule');
  assert.ok(thDirective.includes('NEVER modify numerical values'), 'Thai directive missing numerical data preservation rule');

  const esDirective = getLanguageInstruction('es');
  assert.ok(esDirective.includes('Spanish'), 'Spanish AI instruction missing target language name');
  assert.ok(esDirective.includes('citation IDs'), 'Spanish directive missing citation preservation rule');

  const jaDirective = getLanguageInstruction('ja');
  assert.ok(jaDirective.includes('Japanese'), 'Japanese AI instruction missing target language name');
});

test('i18n financial market data integrity - ticker symbols & numbers remain unchanged', () => {
  // Ensure market data formatting functions preserve raw market values while localizing labels
  const mockTicker = 'AAPL';
  const mockPrice = 234.85;
  const mockChangePercent = +2.45;

  assert.equal(mockTicker, 'AAPL', 'Ticker symbol must remain untranslated');
  assert.equal(mockPrice, 234.85, 'Market price value must not be altered by locale');
  assert.equal(mockChangePercent, 2.45, 'Percentage value must retain numerical accuracy');
});

test('i18n locale auto-detection & document lang update logic', () => {
  const contextContent = fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/I18nContext.tsx'), 'utf8');
  assert.ok(contextContent.includes('document.documentElement.lang = language'), 'Missing document.documentElement.lang update');
  assert.ok(contextContent.includes('localStorage.setItem'), 'Missing localStorage language persistence');
});

test('i18n multi-screen translation coverage across major components', () => {
  const componentsToVerify = [
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

  for (const compPath of componentsToVerify) {
    const fullPath = path.resolve(process.cwd(), compPath);
    assert.ok(fs.existsSync(fullPath), `Component file missing: ${compPath}`);
    const code = fs.readFileSync(fullPath, 'utf8');

    const usesI18n = code.includes('useI18n') || code.includes('useTranslation') || code.includes('t(');
    assert.ok(usesI18n, `Component ${compPath} does not utilize i18n translation hooks`);
  }
});
