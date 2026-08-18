import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFirebaseServiceAccount } from '../src/server/firebaseAdmin';
import { validateProductionEnvironment } from '../src/server/productionPreflight';
import { getStripePriceId, isAllowedPriceId } from '../src/server/stripeService';

const validAccount = JSON.stringify({ project_id: 'marketmind', client_email: 'firebase-admin@example.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n' });
const completeEnv = (): NodeJS.ProcessEnv => ({
  NODE_ENV: 'production',
  APP_URL: 'https://marketmind.example',
  FIREBASE_PROJECT_ID: 'marketmind',
  FIREBASE_DATABASE_ID: '(default)',
  FIREBASE_SERVICE_ACCOUNT_KEY: validAccount,
  VITE_SUPABASE_URL: 'https://marketmind.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_pub_secret_configured',
  SUPABASE_URL: 'https://marketmind.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_configured',
  GEMINI_API_KEY: 'configured',
  STRIPE_SECRET_KEY: 'sk_test_configured',
  STRIPE_WEBHOOK_SECRET: 'whsec_configured',
  STRIPE_PRICE_BASIC_MONTHLY: 'price_basic_m',
  STRIPE_PRICE_BASIC_ANNUAL: 'price_basic_y',
  STRIPE_PRICE_PRO_MONTHLY: 'price_pro_m',
  STRIPE_PRICE_PRO_ANNUAL: 'price_pro_y',
  STRIPE_PRICE_PREMIUM_MONTHLY: 'price_premium_m',
  STRIPE_PRICE_PREMIUM_ANNUAL: 'price_premium_y',
  STRIPE_PRICE_ULTRA_MONTHLY: 'price_ultra_m',
  STRIPE_PRICE_ULTRA_ANNUAL: 'price_ultra_y',
  MASSIVE_API_KEY: 'configured',
  ALLOW_SIMULATED_MARKET_DATA: 'false',
});

test('production preflight accepts complete configuration without revealing values', () => {
  const result = validateProductionEnvironment(completeEnv());
  assert.equal(result.ok, true, `Errors: ${result.errors.join(', ')}`);
  assert.deepEqual(result.errors, []);

  const env = completeEnv();
  delete env.STRIPE_WEBHOOK_SECRET;
  const errorResult = validateProductionEnvironment(env);
  assert.equal(errorResult.ok, false);
  assert.ok(errorResult.errors.some((e) => e.includes('STRIPE_WEBHOOK_SECRET')));
  assert.equal(errorResult.errors.join(' ').includes('whsec_configured'), false);
});

test('production preflight blocks simulation and missing market providers', () => {
  const env = completeEnv();
  delete env.MASSIVE_API_KEY;
  env.ALLOW_SIMULATED_MARKET_DATA = 'true';
  const result = validateProductionEnvironment(env);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('MASSIVE_API_KEY') && e.includes('ALPACA_API_KEY')));
  assert.ok(result.errors.some((e) => e.includes('ALLOW_SIMULATED_MARKET_DATA must be strictly equal to literal string "false"')));
});

test('Firebase service accounts fail closed on malformed or mismatched credentials', () => {
  assert.throws(() => parseFirebaseServiceAccount('{', 'marketmind'), /valid JSON/);
  assert.throws(() => parseFirebaseServiceAccount(validAccount, 'another-project'), /does not match/);
});

test('annual Stripe prices never fall back to monthly prices', () => {
  const previous = { ...process.env };
  process.env.STRIPE_PRICE_BASIC_MONTHLY = 'price_monthly';
  delete process.env.STRIPE_PRICE_BASIC_ANNUAL;
  assert.equal(getStripePriceId('basic', 'annual'), null);
  process.env.STRIPE_PRICE_BASIC_ANNUAL = 'price_annual';
  assert.equal(getStripePriceId('basic', 'annual'), 'price_annual');
  assert.equal(isAllowedPriceId('attacker_price'), false);
  process.env = previous;
});

test('monthly and annual checkout select only their matching configured prices', () => {
  const previous = { ...process.env };
  process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_monthly';
  process.env.STRIPE_PRICE_PRO_ANNUAL = 'price_pro_annual';
  assert.equal(getStripePriceId('pro', 'monthly'), 'price_pro_monthly');
  assert.equal(getStripePriceId('pro', 'annual'), 'price_pro_annual');
  delete process.env.STRIPE_PRICE_PRO_MONTHLY;
  assert.equal(getStripePriceId('pro', 'monthly'), null);
  assert.equal(getStripePriceId('pro', 'annual'), 'price_pro_annual');
  process.env = previous;
});
