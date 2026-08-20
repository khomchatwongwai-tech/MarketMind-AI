import app from '../server';

export function normalizeApiUrl(rawUrl: string): string {
  if (!rawUrl) return '/api';
  if (!rawUrl.startsWith('/api')) {
    return '/api' + (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl);
  }
  return rawUrl;
}

export default function handler(req: any, res: any) {
  try {
    if (req.url) {
      req.url = normalizeApiUrl(req.url);
    }
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Execution Failure]:', error);
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
