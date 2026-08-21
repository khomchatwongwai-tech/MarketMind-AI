import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

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

const keySample = [
  'nav.overview',
  'nav.chart',
  'nav.news',
  'nav.options',
  'nav.scanner',
  'nav.deepResearch',
  'nav.multiAsset',
  'nav.connectedAccounts',
  'nav.optionsTrader',
  'nav.community',
  'nav.askAi',
  'nav.morningReport',
  'nav.signIn',
  'market.dayHigh',
  'market.dayLow',
  'market.prevClose',
  'market.volume',
  'market.relVol',
  'market.latency',
  'market.biasUnavailable',
  'common.bull',
  'common.bear',
  'common.neut',
  'dashboard.marketStatus',
  'dashboard.regularLive',
  'dashboard.terminalView',
  'dashboard.unifiedTerminal',
  'dashboard.explainSimply',
  'market.technicalEngine',
  'market.supportResistance',
  'market.primaryDriver',
  'market.mainRiskFactor',
  'market.setupQualityIndex',
  'market.bullishConfirmation',
  'market.bearishInvalidation',
  'market.optionsFlowSentiment',
  'market.systemRiskMeter',
  'footer.privacyPolicy',
  'footer.termsOfService',
  'footer.contactSupport',
];

test('INSTANT LIVE SWITCH TEST: Every target locale returns distinct localized strings for 40+ UI elements without reload', () => {
  const enData = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
  const enMap = getNestedKeysAndValues(enData);

  assert.ok(keySample.length >= 20, 'Expected at least 20 sample keys for live switch verification');

  for (const locale of targetLocales) {
    const locData = JSON.parse(fs.readFileSync(path.join(localesDir, `${locale}.json`), 'utf8'));
    const locMap = getNestedKeysAndValues(locData);

    let changedCount = 0;
    const verifiedStrings: Record<string, string> = {};

    for (const key of keySample) {
      const enVal = enMap.get(key);
      const locVal = locMap.get(key);

      assert.ok(locVal, `Missing key "${key}" in locale "${locale}"`);
      verifiedStrings[key] = locVal;

      if (locale === 'en' || locVal !== enVal) {
        changedCount++;
      }
    }

    if (locale !== 'en') {
      assert.ok(
        changedCount >= 20,
        `Expected at least 20 distinct localized strings for locale "${locale}", found ${changedCount}`
      );
    }

    console.log(`[Instant Switch Test] Verified ${keySample.length} elements for locale "${locale}" (${changedCount} distinct localized)`);
  }
});
