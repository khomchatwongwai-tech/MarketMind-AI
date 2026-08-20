import app from '../server';

export function normalizeApiUrl(rawUrl: string): string {
  if (rawUrl && !rawUrl.startsWith('/api')) {
    return '/api' + (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl);
  }
  return rawUrl;
}

export default function handler(req: any, res: any) {
  if (req.url) {
    req.url = normalizeApiUrl(req.url);
  }
  return app(req, res);
}
