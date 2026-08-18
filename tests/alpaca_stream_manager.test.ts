import assert from 'node:assert/strict';
import test from 'node:test';
import { StreamSubscriptionManager } from '../src/server/streamSubscriptionManager';

test('1. Enforces Configurable 30-Symbol WebSocket Stream Cap', () => {
  const manager = StreamSubscriptionManager.getInstance();
  manager.resetForTests(30);

  // Subscribe 30 unique symbols
  for (let i = 1; i <= 30; i++) {
    const sym = `SYM${i}`;
    const result = manager.subscribe(sym, 'WATCHLIST');
    assert.equal(result.status, 'SUBSCRIBED_STREAM');
    assert.equal(result.activeCount, i);
  }

  assert.equal(manager.getActiveStreamSymbols().length, 30);
});

test('2. Prioritizes ACTIVE_VIEW over WATCHLIST, PORTFOLIO, and DASHBOARD', () => {
  const manager = StreamSubscriptionManager.getInstance();
  manager.resetForTests(3); // set small cap of 3 for testing

  manager.subscribe('DASH1', 'DASHBOARD');   // priority 30
  manager.subscribe('PORT1', 'PORTFOLIO');   // priority 50
  manager.subscribe('WATCH1', 'WATCHLIST');  // priority 70

  assert.equal(manager.getActiveStreamSymbols().length, 3);
  assert.ok(manager.isStreamActive('DASH1'));
  assert.ok(manager.isStreamActive('PORT1'));
  assert.ok(manager.isStreamActive('WATCH1'));

  // Subscribe a 4th symbol with ACTIVE_VIEW (priority 100) -> must evict lowest priority (DASH1)
  const result = manager.subscribe('NVDA', 'ACTIVE_VIEW');

  assert.equal(result.status, 'SUBSCRIBED_STREAM');
  assert.equal(result.evictedSymbol, 'DASH1');
  assert.equal(manager.getActiveStreamSymbols().length, 3);

  assert.ok(manager.isStreamActive('NVDA'));
  assert.ok(manager.isStreamActive('WATCH1'));
  assert.ok(manager.isStreamActive('PORT1'));
  assert.equal(manager.isStreamActive('DASH1'), false, 'DASH1 must be evicted from active stream');

  // DASH1 is now in rest fallback
  assert.ok(manager.getRestFallbackSymbols().includes('DASH1'));
});

test('3. Low-Priority Request When Stream is Full is Routed to REST Fallback', () => {
  const manager = StreamSubscriptionManager.getInstance();
  manager.resetForTests(2);

  manager.subscribe('NVDA', 'ACTIVE_VIEW'); // 100
  manager.subscribe('AAPL', 'ACTIVE_VIEW'); // 100

  // Attempt to subscribe low priority symbol when all slots are higher priority
  const result = manager.subscribe('DASH_LOW', 'DASHBOARD'); // 30

  assert.equal(result.status, 'SUBSCRIBED_REST_FALLBACK');
  assert.equal(result.evictedSymbol, undefined);
  assert.equal(manager.getActiveStreamSymbols().length, 2);
  assert.ok(manager.getRestFallbackSymbols().includes('DASH_LOW'));
});

test('4. Promotes REST Fallback Symbols When Active Stream Slot Frees Up', () => {
  const manager = StreamSubscriptionManager.getInstance();
  manager.resetForTests(2);

  manager.subscribe('TSLA', 'ACTIVE_VIEW');
  manager.subscribe('MSFT', 'ACTIVE_VIEW');
  manager.subscribe('FALLBACK1', 'DASHBOARD'); // goes to fallback

  assert.ok(manager.getRestFallbackSymbols().includes('FALLBACK1'));

  // User closes TSLA chart
  manager.unsubscribe('TSLA');

  // FALLBACK1 should be promoted into active stream
  assert.equal(manager.isStreamActive('FALLBACK1'), true, 'FALLBACK1 must be promoted to stream');
  assert.equal(manager.getActiveStreamSymbols().length, 2);
  assert.equal(manager.getRestFallbackSymbols().length, 0);
});
