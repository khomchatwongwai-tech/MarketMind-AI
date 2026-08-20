import { normalizeApiUrl } from '../src/utils/apiUrlNormalizer.js';

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import('../server.js').then((m) => m.app || m.default).catch((err) => {
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.url) {
      req.url = normalizeApiUrl(req.url);
    }
    const app = await getApp();
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Slug Execution Failure]:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'SERVERLESS_EXECUTION_ERROR',
        message: error?.message || String(error),
        stack: error?.stack || String(error),
      }));
    }
  }
}
