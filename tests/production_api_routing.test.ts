import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CapacitorPlatform } from '../src/services/mobile/capacitorPlatform';
import { ApiClient } from '../src/services/apiClient';
import app from '../server';

test('Production API Routing - vercel.json & api/index.ts configured for Serverless API execution', () => {
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  assert.equal(fs.existsSync(vercelJsonPath), true, 'vercel.json must exist in repository root');

  const content = fs.readFileSync(vercelJsonPath, 'utf8');
  const parsed = JSON.parse(content);
  assert.ok(Array.isArray(parsed.rewrites), 'vercel.json must have a rewrites array');

  const apiRewrite = parsed.rewrites.find((r: any) => r.source === '/api/(.*)' || r.source === '/api/:path*');
  assert.ok(apiRewrite, 'vercel.json must rewrite /api/*');

  const apiIndexPath = path.join(process.cwd(), 'api', 'index.ts');
  assert.equal(fs.existsSync(apiIndexPath), true, 'api/index.ts serverless function entrypoint must exist');
});

test('Production API Routing - CapacitorPlatform returns clean relative URL on web', () => {
  const originalWindow = (global as any).window;

  (global as any).window = {
    location: {
      hostname: 'market-mind-ai-xi.vercel.app',
      protocol: 'https:',
      host: 'market-mind-ai-xi.vercel.app',
      origin: 'https://market-mind-ai-xi.vercel.app',
    },
  };

  const apiBase = CapacitorPlatform.getApiBaseUrl();
  assert.equal(apiBase, '', 'Web browser must return relative "" so API requests hit Vercel serverless / proxy');

  const fullApiUrl = ApiClient.buildApiUrl('/api/market/live/SPY');
  assert.equal(fullApiUrl, '/api/market/live/SPY');

  (global as any).window = originalWindow;
});

test('Production API Routing - server.ts mounts all 4 required REST endpoints', () => {
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
    serverContent.includes('/api/market/tape'),
    'server.ts must contain /api/market/tape route'
  );
  assert.ok(
    serverContent.includes('MassiveWebSocketManager'),
    'server.ts must integrate MassiveWebSocketManager'
  );
});

test('Production API Routing - Express app handles required REST endpoints without 404', async () => {
  // Test mock request execution against Express app instance
  const routesToTest = [
    '/api/market/live/SPY',
    '/api/market/candles/SPY?timeframe=5m&extended=true',
    '/api/instruments/search?limit=40',
    '/api/market/tape',
  ];

  for (const route of routesToTest) {
    let statusCode = 0;
    let jsonBody: any = null;

    const req: any = {
      method: 'GET',
      url: route,
      originalUrl: route,
      headers: { host: 'market-mind-ai-xi.vercel.app' },
      query: {},
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        jsonBody = data;
        return this;
      },
      setHeader() {},
      sendStatus(code: number) {
        statusCode = code;
        return this;
      },
      send() {},
    };

    // Execute route through Express app
    await new Promise<void>((resolve) => {
      app(req, res, () => resolve());
      // Give async route handlers time to respond
      setTimeout(resolve, 50);
    });

    assert.notEqual(statusCode, 404, `Route ${route} returned 404! Express route must be mounted.`);
    assert.ok(statusCode === 200 || statusCode === 503, `Route ${route} returned unexpected status ${statusCode}`);
  }
});
