import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  isFiniteMarketNumber,
  formatPrice,
  formatPercent,
  formatNumber,
  formatVolume,
  safeFixed,
} from '../src/utils/formatters';
import {
  formatNumber as i18nFormatNumber,
  formatCurrency as i18nFormatCurrency,
  formatPercent as i18nFormatPercent,
  formatCompactNumber as i18nFormatCompactNumber,
} from '../src/i18n/formatters';

describe('Null-Safe Market Data Formatting Suite', () => {
  describe('src/utils/formatters.ts', () => {
    it('isFiniteMarketNumber accurately validates finite numbers vs null/undefined/NaN/Infinity', () => {
      assert.strictEqual(isFiniteMarketNumber(0), true);
      assert.strictEqual(isFiniteMarketNumber(100.5), true);
      assert.strictEqual(isFiniteMarketNumber(-50), true);

      assert.strictEqual(isFiniteMarketNumber(null), false);
      assert.strictEqual(isFiniteMarketNumber(undefined), false);
      assert.strictEqual(isFiniteMarketNumber(NaN), false);
      assert.strictEqual(isFiniteMarketNumber(Infinity), false);
      assert.strictEqual(isFiniteMarketNumber(-Infinity), false);
      assert.strictEqual(isFiniteMarketNumber('100'), false);
    });

    it('formatPrice gracefully handles null, undefined, and valid numbers without throwing', () => {
      assert.strictEqual(formatPrice(123.456, 2), '$123.46');
      assert.strictEqual(formatPrice(null), 'N/A');
      assert.strictEqual(formatPrice(undefined, 2, 'N/A'), 'N/A');
      assert.strictEqual(formatPrice(NaN), 'N/A');
      assert.strictEqual(formatPrice(Infinity), 'N/A');
    });

    it('formatPercent gracefully formats percentages and handles sign prefix and fallback', () => {
      assert.strictEqual(formatPercent(5.25, 2, true), '+5.25%');
      assert.strictEqual(formatPercent(-3.1, 2, true), '-3.10%');
      assert.strictEqual(formatPercent(0, 2, true), '+0.00%');
      assert.strictEqual(formatPercent(null, 2, true, 'N/A'), 'N/A');
      assert.strictEqual(formatPercent(undefined), 'N/A');
      assert.strictEqual(formatPercent(NaN), 'N/A');
    });

    it('formatNumber formats standard numbers and returns fallback on non-finite values', () => {
      assert.strictEqual(formatNumber(1234.56), '1,234.56');
      assert.strictEqual(formatNumber(null), 'N/A');
      assert.strictEqual(formatNumber(undefined, 2, '0.00'), '0.00');
      assert.strictEqual(formatNumber(NaN), 'N/A');
    });

    it('formatVolume formats trading volume with K/M/B suffixes and returns fallback on null', () => {
      assert.strictEqual(formatVolume(1500000000), '1.5B');
      assert.strictEqual(formatVolume(2500000), '2.5M');
      assert.strictEqual(formatVolume(4500), '4.5K');
      assert.strictEqual(formatVolume(500), '500');
      assert.strictEqual(formatVolume(null), 'N/A');
      assert.strictEqual(formatVolume(undefined), 'N/A');
    });

    it('safeFixed prevents .toFixed crashes on non-number inputs', () => {
      assert.strictEqual(safeFixed(12.3456, 2), '12.35');
      assert.strictEqual(safeFixed(null), 'N/A');
      assert.strictEqual(safeFixed(undefined, 2, '--'), '--');
      assert.strictEqual(safeFixed(NaN), 'N/A');
    });
  });

  describe('src/i18n/formatters.ts', () => {
    it('i18n formatters return fallback string when input is null, undefined, or NaN', () => {
      assert.strictEqual(i18nFormatNumber(null), '—');
      assert.strictEqual(i18nFormatCurrency(null), '—');
      assert.strictEqual(i18nFormatPercent(null), '—%');
      assert.strictEqual(i18nFormatCompactNumber(null), '—');

      assert.strictEqual(i18nFormatNumber(undefined), '—');
      assert.strictEqual(i18nFormatCurrency(NaN), '—');
      assert.strictEqual(i18nFormatPercent(Infinity), '—%');
    });
  });

  describe('Frontend Component AST / Regex Verification', () => {
    const componentDir = path.join(process.cwd(), 'src/components');

    it('every component file avoids direct un-guarded .toFixed call on nullable properties', () => {
      const files = fs.readdirSync(componentDir, { recursive: true }) as string[];
      const tsxFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

      const unsafeFixedPattern = /(quote|marketData|technicals|item|pred|sweep|inst|stockBrief|options|analysis)\.([a-zA-Z0-9_]+)\.toFixed\(/g;

      const errors: string[] = [];

      for (const file of tsxFiles) {
        const filePath = path.join(componentDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        let match;
        while ((match = unsafeFixedPattern.exec(content)) !== null) {
          const lineStart = content.lastIndexOf('\n', match.index) + 1;
          const lineEnd = content.indexOf('\n', match.index);
          const line = content.substring(lineStart, lineEnd !== -1 ? lineEnd : content.length);

          const isGuarded = line.includes('isFiniteMarketNumber') ||
                            line.includes('formatPrice') ||
                            line.includes('formatPercent') ||
                            line.includes('formatNumber') ||
                            line.includes('safeFixed') ||
                            line.includes('!= null') ||
                            line.includes('typeof') ||
                            line.includes('??') ||
                            line.includes('||');

          if (!isGuarded) {
            errors.push(`Unsafe .toFixed() call in ${file}: "${line.trim()}"`);
          }
        }
      }

      assert.deepStrictEqual(errors, []);
    });
  });
});
