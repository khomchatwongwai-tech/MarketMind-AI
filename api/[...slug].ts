import { createRequire } from 'module';
import { normalizeApiUrl } from '../src/utils/apiUrlNormalizer.js';

const require = createRequire(import.meta.url);
let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    try {
      // @ts-ignore - Pre-bundled production server file generated during build
      const serverModule: any = require('../dist/server.cjs');
      appInstance = serverModule.app || serverModule.default?.app || serverModule;
    } catch (requireErr: any) {
      console.error('[Vercel Serverless CJS Require Error]:', requireErr?.message || requireErr);
      try {
        // @ts-ignore
        const serverModule: any = await import('../dist/server.cjs');
        appInstance = serverModule.app || serverModule.default?.app || serverModule.default;
      } catch (importErr: any) {
        console.error('[Vercel Serverless CJS Import Error]:', importErr?.message || importErr);
        const serverModule = await import('../server.js');
        appInstance = serverModule.app || serverModule.default;
      }
    }
  }
  return appInstance;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.url) {
      req.url = normalizeApiUrl(req.url);
    }
    const app = await getApp();
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless Catch-All Execution Failure]:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'SERVERLESS_EXECUTION_ERROR',
        message: error?.message || String(error),
      }));
    }
  }
}
