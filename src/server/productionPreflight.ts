import { parseFirebaseServiceAccount } from './firebaseAdmin';

const REQUIRED = [
  'APP_URL', 'FIREBASE_PROJECT_ID', 'FIREBASE_DATABASE_ID', 'FIREBASE_SERVICE_ACCOUNT_KEY',
  'GEMINI_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_BASIC', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_PREMIUM',
  'STRIPE_PRICE_BASIC_ANNUAL', 'STRIPE_PRICE_PRO_ANNUAL', 'STRIPE_PRICE_PREMIUM_ANNUAL',
] as const;

export function validateProductionEnvironment(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== 'production') return [];
  const errors = REQUIRED.filter((name) => !env[name]?.trim()).map((name) => `${name} is required`);
  if (!env.MASSIVE_API_KEY?.trim() && !env.POLYGON_API_KEY?.trim()) errors.push('MASSIVE_API_KEY or POLYGON_API_KEY is required');
  if (env.ALLOW_SIMULATED_MARKET_DATA !== 'false') errors.push('ALLOW_SIMULATED_MARKET_DATA must equal false');
  if (env.APP_URL) {
    try { if (new URL(env.APP_URL).protocol !== 'https:') errors.push('APP_URL must use HTTPS'); }
    catch { errors.push('APP_URL must be a valid URL'); }
  }
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try { parseFirebaseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_KEY, env.FIREBASE_PROJECT_ID); }
    catch (error) { errors.push((error as Error).message); }
  }
  return [...new Set(errors)];
}

export function assertProductionEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const errors = validateProductionEnvironment(env);
  if (errors.length) throw new Error(`Production configuration invalid: ${errors.join('; ')}`);
}
