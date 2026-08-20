process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CapacitorPlatform } from '../src/services/mobile/capacitorPlatform.js';
import { ApiClient } from '../src/services/apiClient.js';
import app from '../server.js';
import { LiveMarketDataService, setLiveMarketDataServiceForTests } from '../src/server/liveMarketDataService.js';
import { DataProviderRouter } from '../src/services/marketProviders/DataProviderRouter.js';

setLiveMarketDataServiceForTests(new LiveMarketDataService({
  env: { YAHOO_MARKET_DATA_ENABLED: 'false' },
  fetchFn: async () => { throw new Error('network must not be called'); },
  logger: () => undefined,
}));
DataProviderRouter.resetForTests();

test('Production API Routing - vercel.json & api/index.ts configured for Serverless API execution', () => {
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  assert.equal(fs.existsSync(vercelJsonPath), true, 'vercel.json must exist in repository root');

  const content = fs.readFileSync(vercelJsonPath, 'utf8');
  const parsed = JSON.parse(content);
  assert.equal(Array.isArray(parsed.rewrites), true, 'vercel.json must define rewrites');
  const hasApiRewrite = parsed.rewrites.some((r: any) => r.source === '/api/(.*)' && (r.destination === '/api' || r.destination === '/api/index.ts'));
  assert.equal(hasApiRewrite, true, 'vercel.json must include /api/(.*) rewrite destination pointing to /api');

  const apiIndexPath = path.join(process.cwd(), 'api', 'index.ts');
  assert.equal(fs.existsSync(apiIndexPath), true, 'api/index.ts serverless function entrypoint must exist');

  const apiSlugPath = path.join(process.cwd(), 'api', '[...slug].ts');
  assert.equal(fs.existsSync(apiSlugPath), true, 'api/[...slug].ts catch-all serverless function entrypoint must exist');
});

test('Production API Routing - Serverless handler normalizes stripped req.url to start with /api', async () => {
  const { normalizeApiUrl } = await import('../src/utils/apiUrlNormalizer.js');
  assert.equal(typeof normalizeApiUrl, 'function', 'apiUrlNormalizer must export normalizeApiUrl helper');

  assert.equal(normalizeApiUrl('/market/live/SPY'), '/api/market/live/SPY', 'Must prepend /api to stripped subpaths');
  assert.equal(normalizeApiUrl('market/live/SPY'), '/api/market/live/SPY', 'Must format clean relative paths');
  assert.equal(normalizeApiUrl('/api/market/live/SPY'), '/api/market/live/SPY', 'Must preserve existing /api prefix');
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
  const routesToTest = [
    '/api/market/live/SPY',
    '/api/market/candles/SPY?timeframe=5m&extended=true',
    '/api/instruments/search?limit=40',
    '/api/market/tape',
  ];

  for (const route of routesToTest) {
    let statusCode = 200;
    let jsonBody: any = null;

    const req: any = {
      method: 'GET',
      url: route,
      originalUrl: route,
      headers: { host: 'market-mind-ai-xi.vercel.app' },
      query: {},
    };

    await new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      const res: any = {
        statusCode: 200,
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(data: any) {
          jsonBody = data;
          done();
          return this;
        },
        setHeader() {
          return this;
        },
        sendStatus(code: number) {
          statusCode = code;
          done();
          return this;
        },
        send(data: any) {
          jsonBody = data;
          done();
          return this;
        },
      };

      app(req, res, () => done());
      setTimeout(done, 1000);
    });

    assert.notEqual(statusCode, 404, `Route ${route} returned 404! Express route must be mounted.`);
    assert.ok(statusCode === 200 || statusCode === 503, `Route ${route} returned unexpected status ${statusCode}`);
  }
});
