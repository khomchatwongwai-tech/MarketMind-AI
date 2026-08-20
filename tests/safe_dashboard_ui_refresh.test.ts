import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('Safe Dashboard UI Refresh — 1. MarketMindSummaryCard uses calculateRealtimeIntelligence and no synthetic math', () => {
  const summaryCardPath = path.resolve(process.cwd(), 'src/components/MarketMindSummaryCard.tsx');
  const code = fs.readFileSync(summaryCardPath, 'utf8');

  // Must import and invoke calculateRealtimeIntelligence
  assert.ok(code.includes("import { calculateRealtimeIntelligence } from '../utils/realtimeIntelligenceEngine.js'"));
  assert.ok(code.includes('const engine = calculateRealtimeIntelligence(data);'));

  // Must NOT include evaluateBiasDiagnostics
  assert.ok(!code.includes('evaluateBiasDiagnostics'));

  // Must NOT include synthetic multiplier level calculations
  assert.ok(!code.includes('1.004'));
  assert.ok(!code.includes('0.996'));

  // Must use engine.confirmationLevel and engine.invalidationLevel
  assert.ok(code.includes('engine.confirmationLevel'));
  assert.ok(code.includes('engine.invalidationLevel'));
});

test('Safe Dashboard UI Refresh — 2. MarketTape has zero hardcoded fallback price map', () => {
  const tapePath = path.resolve(process.cwd(), 'src/components/MarketTape.tsx');
  const code = fs.readFileSync(tapePath, 'utf8');

  // Must NOT contain DEFAULT_PRICES map with static fallback prices
  assert.ok(!code.includes('DEFAULT_PRICES'));
  assert.ok(!code.includes('500.0'));
  assert.ok(!code.includes('430.0'));
});

test('Safe Dashboard UI Refresh — 3. Conflict markers search yields 0 across repository', () => {
  const srcDir = path.resolve(process.cwd(), 'src');
  const testsDir = path.resolve(process.cwd(), 'tests');

  const conflictMarkerRegex = /^(<<<<<<<|=======|>>>>>>>)/m;

  const checkDir = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert.ok(
          !conflictMarkerRegex.test(content),
          `Git conflict marker found in ${fullPath}`
        );
      }
    }
  };

  checkDir(srcDir);
  checkDir(testsDir);
});
