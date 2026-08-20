import serverModule from '../dist/server.cjs';
import { normalizeApiUrl } from '../src/utils/apiUrlNormalizer.js';

export default function handler(req: any, res: any) {
  try {
    if (req.url) {
      req.url = normalizeApiUrl(req.url);
    }
    const app = serverModule.app || serverModule.default || serverModule;
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
