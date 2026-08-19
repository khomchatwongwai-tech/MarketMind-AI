import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CapacitorPlatform } from '../src/services/mobile/capacitorPlatform';
import { ApiClient } from '../src/services/apiClient';

test('Production API Routing - vercel.json exists and contains required proxy rewrites', () => {
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  assert.equal(fs.existsSync(vercelJsonPath), true, 'vercel.json must exist in repository root');

  const content = fs.readFileSync(vercelJsonPath, 'utf8');
  const parsed = JSON.parse(content);

  assert.ok(Array.isArray(parsed.rewrites), 'vercel.json must have a rewrites array');

  const apiRewrite = parsed.rewrites.find((r: any) => r.source === '/api/:path*');
  assert.ok(apiRewrite, 'vercel.json must rewrite /api/:path*');
  assert.ok(
    apiRewrite.destination.includes('onrender.com'),
    'apiRewrite destination must point to Render backend server'
  );

  const wsRewrite = parsed.rewrites.find((r: any) => r.source === '/ws/:path*');
  assert.ok(wsRewrite, 'vercel.json must rewrite /ws/:path*');
  assert.ok(
    wsRewrite.destination.includes('onrender.com'),
    'wsRewrite destination must point to Render backend server'
  );
});

test('Production API Routing - CapacitorPlatform resolves production backend URL for web host', () => {
  const originalWindow = (global as any).window;

  // Mock production browser environment
  (global as any).window = {
    location: {
      hostname: 'getmarketmindai.com',
      protocol: 'https:',
      host: 'getmarketmindai.com',
    },
  };

  const apiBase = CapacitorPlatform.getApiBaseUrl();
  assert.equal(apiBase, 'https://marketmind-ai.onrender.com');

  const wsUrl = CapacitorPlatform.getWebSocketUrl('/ws/massive');
  assert.equal(wsUrl, 'wss://marketmind-ai.onrender.com/ws/massive');

  const fullApiUrl = ApiClient.buildApiUrl('/api/market/live/SPY');
  assert.equal(fullApiUrl, 'https://marketmind-ai.onrender.com/api/market/live/SPY');

  // Restore window
  (global as any).window = originalWindow;
});

test('Production API Routing - server.ts mounts all mandatory endpoints', () => {
  const serverPath = path.join(process.cwd(), 'server.ts');
  const serverContent = fs.readFileSync(serverPath, 'utf8');

  assert.ok(
    serverContent.includes('/api/market/live/:ticker'),
    'server.ts must contain /api/market/live/:ticker route'
  );
  assert.ok(
    serverContent.includes('/api/instruments/search'),
    'server.ts must contain /api/instruments/search route'
  );
  assert.ok(
    serverContent.includes('/api/market/candles/:ticker'),
    'server.ts must contain /api/market/candles/:ticker route'
  );
  assert.ok(
    serverContent.includes('/api/market/quote/:symbol'),
    'server.ts must contain /api/market/quote/:symbol route'
  );
  assert.ok(
    serverContent.includes('MassiveWebSocketManager'),
    'server.ts must integrate MassiveWebSocketManager for WebSocket streaming'
  );
  assert.ok(
    serverContent.includes('.vercel.app'),
    'server.ts CORS middleware must support Vercel preview origins'
  );
});
