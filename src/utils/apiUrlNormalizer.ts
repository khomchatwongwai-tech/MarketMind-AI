export function normalizeApiUrl(rawUrl: string): string {
  if (!rawUrl) return '/api';
  if (!rawUrl.startsWith('/api')) {
    return '/api' + (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl);
  }
  return rawUrl;
}
