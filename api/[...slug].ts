import app from '../server';
import { normalizeApiUrl } from './index';

export default function handler(req: any, res: any) {
  try {
    if (req.url) {
      req.url = normalizeApiUrl(req.url);
    }
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Catch-All Execution Failure]:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'SERVERLESS_EXECUTION_ERROR',
        message: error?.message || 'Internal serverless handler error'
      }));
    }
  }
}
