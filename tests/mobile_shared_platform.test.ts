import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiClient } from '../src/services/apiClient';
import { CapacitorPlatform } from '../src/services/mobile/capacitorPlatform';
import { SecureStorage } from '../src/services/mobile/secureStorage';
import { DeepLinkManager } from '../src/services/mobile/deepLinking';
import { NotificationService } from '../src/services/mobile/notificationService';
import { StreamSubscriptionManager } from '../src/server/streamSubscriptionManager';
import { InstrumentDirectoryService } from '../src/services/marketProviders/InstrumentDirectoryService';

test('1. Shared API Client - Base URL Resolution across Web and Native', () => {
  // On Node/Web dev, returns appropriate base or origin
  const baseUrl = CapacitorPlatform.getApiBaseUrl();
  assert.ok(typeof baseUrl === 'string');

  // WebSocket URL resolution
  const wsUrl = CapacitorPlatform.getWebSocketUrl();
  assert.ok(wsUrl.includes('/ws/market-stream'), `Expected /ws/market-stream in wsUrl, got ${wsUrl}`);
});

test('2. Shared API Client - Injects Authorization Token and Rejects Expired Sessions', async () => {
  const client = ApiClient.getInstance();
  let capturedHeaders: Record<string, string> = {};

  // Mock global fetch for testing
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any, init?: any) => {
    capturedHeaders = init?.headers || {};
    if (String(url).includes('/api/auth-test-401')) {
      return new Response(JSON.stringify({ error: 'Token expired' }), { status: 401 });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  try {
    client.setTokenProvider(async () => 'test-firebase-jwt-token-12345');

    // Authenticated request
    await client.get('/api/test-route');
    assert.equal(capturedHeaders['Authorization'], 'Bearer test-firebase-jwt-token-12345');

    // 401 Expired Token Request must throw and clear session
    await assert.rejects(
      async () => client.get('/api/auth-test-401'),
      /UNAUTHORIZED/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('3. Shared Instrument Catalog Search over HTTP Client', async () => {
  // Test directory service integration across 5000+ universe
  const searchResults = InstrumentDirectoryService.search('NVDA');
  assert.ok(searchResults.results.length > 0);
  assert.equal(searchResults.results[0].symbol, 'NVDA', 'Exact match must rank 1st');

  const spyResults = InstrumentDirectoryService.search('SPY');
  assert.ok(spyResults.results.some((i) => i.symbol === 'SPY'));
});

test('4. Secure Storage - Blocks Secret Leakage & Persists User Session Safely', async () => {
  // 1. Normal user preferences should store safely
  await SecureStorage.setItem('preferred_theme', 'dark');
  const theme = await SecureStorage.getItem('preferred_theme');
  assert.equal(theme, 'dark');

  // 2. Sensitive master API secrets MUST be blocked from device persistence
  await SecureStorage.setItem('ALPACA_API_SECRET', 'super-secret-key-12345');
  const leakedSecret = await SecureStorage.getItem('ALPACA_API_SECRET');
  assert.equal(leakedSecret, null, 'Provider API secrets must NEVER be persisted in client storage');

  // 3. Clear auth session removes auth token
  await SecureStorage.setItem('auth_token', 'jwt-token-abc');
  await SecureStorage.clearAuthSession();
  const clearedTok = await SecureStorage.getItem('auth_token');
  assert.equal(clearedTok, null, 'Auth token must be cleared upon logout');
});

test('5. Deep Link Parser - Custom Scheme & Universal Links', () => {
  // 1. Custom URL Scheme: marketmind://stock/NVDA
  const route1 = DeepLinkManager.parseUrl('marketmind://stock/NVDA');
  assert.equal(route1.type, 'STOCK');
  assert.equal(route1.symbol, 'NVDA');

  // 2. Universal Link: https://marketmind.ai/stock/AAPL
  const route2 = DeepLinkManager.parseUrl('https://marketmind.ai/stock/AAPL');
  assert.equal(route2.type, 'STOCK');
  assert.equal(route2.symbol, 'AAPL');

  // 3. Watchlist Link: marketmind://watchlist
  const route3 = DeepLinkManager.parseUrl('marketmind://watchlist');
  assert.equal(route3.type, 'WATCHLIST');

  // 4. Invalid Link
  const route4 = DeepLinkManager.parseUrl('marketmind://invalid-route');
  assert.equal(route4.type, 'UNKNOWN');
});

test('6. Shared Free-Tier WebSocket Cap (30 Symbols) Managed Centrally', () => {
  const manager = StreamSubscriptionManager.getInstance();
  manager.resetForTests(30);

  // Web user opens 10 symbols
  for (let i = 1; i <= 10; i++) {
    manager.subscribe(`WEB_${i}`, 'WATCHLIST');
  }

  // iOS user opens 10 symbols
  for (let i = 1; i <= 10; i++) {
    manager.subscribe(`IOS_${i}`, 'WATCHLIST');
  }

  // Android user opens 10 symbols
  for (let i = 1; i <= 10; i++) {
    manager.subscribe(`AND_${i}`, 'WATCHLIST');
  }

  assert.equal(manager.getActiveStreamSymbols().length, 30, 'Total active streams across all clients cannot exceed 30');

  // 31st symbol opened on mobile device at highest priority (ACTIVE_VIEW)
  const result = manager.subscribe('NVDA', 'ACTIVE_VIEW');
  assert.equal(result.status, 'SUBSCRIBED_STREAM');
  assert.equal(manager.getActiveStreamSymbols().length, 30, 'Stream cap strictly preserved at 30');
  assert.ok(manager.isStreamActive('NVDA'));
});

test('7. Push Notification Service - Status & External Verification Handling', async () => {
  const regResult = await NotificationService.registerForPushNotifications();
  assert.ok(
    ['GRANTED', 'DENIED', 'EXTERNAL_VERIFICATION_REQUIRED', 'UNSUPPORTED'].includes(regResult.status),
    `Invalid push notification status: ${regResult.status}`
  );
});
