import app from '../server';
import { normalizeApiUrl } from './index';

export default function handler(req: any, res: any) {
  if (req.url) {
    req.url = normalizeApiUrl(req.url);
  }
  return app(req, res);
}
