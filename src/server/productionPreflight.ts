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
  const alpacaConfigured = Boolean(env.ALPACA_API_KEY?.trim() && env.ALPACA_API_SECRET?.trim());
  if (!env.MASSIVE_API_KEY?.trim() && !env.POLYGON_API_KEY?.trim() && !alpacaConfigured) {
    errors.push('MASSIVE_API_KEY, POLYGON_API_KEY, or a complete Alpaca credential pair is required');
  }
  if (Boolean(env.ALPACA_API_KEY?.trim()) !== Boolean(env.ALPACA_API_SECRET?.trim())) errors.push('ALPACA_API_KEY and ALPACA_API_SECRET must be configured together');
  if (env.ALLOW_SIMULATED_MARKET_DATA !== 'false') errors.push('ALLOW_SIMULATED_MARKET_DATA must equal false');
  if (env.APP_URL) {
    try { if (new URL(env.APP_URL).protocol !== 'https:') errors.push('APP_URL must use HTTPS'); }
    catch { errors.push('APP_URL must be a valid URL'); }
  }
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try { parseFirebaseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_KEY, env.FIREBASE_PROJECT_ID); }
    catch (error) { errors.push((error as Error).message); }
  }
  for (const name of REQUIRED.filter((value) => value.startsWith('STRIPE_PRICE_'))) {
    if (env[name] && !env[name]!.startsWith('price_')) errors.push(`${name} must be a Stripe price ID`);
  }
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_')) errors.push('STRIPE_SECRET_KEY has an invalid format');
  if (env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) errors.push('STRIPE_WEBHOOK_SECRET has an invalid format');
  return [...new Set(errors)];
}

export function assertProductionEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const errors = validateProductionEnvironment(env);
  if (errors.length) throw new Error(`Production configuration invalid: ${errors.join('; ')}`);
}
