import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFirebaseServiceAccount } from '../src/server/firebaseAdmin';
import { validateProductionEnvironment } from '../src/server/productionPreflight';
import { getStripePriceId, isAllowedPriceId } from '../src/server/stripeService';

const validAccount = JSON.stringify({ project_id: 'marketmind', client_email: 'firebase-admin@example.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n' });
const completeEnv = (): NodeJS.ProcessEnv => ({ NODE_ENV: 'production', APP_URL: 'https://marketmind.example',
  FIREBASE_PROJECT_ID: 'marketmind', FIREBASE_DATABASE_ID: '(default)', FIREBASE_SERVICE_ACCOUNT_KEY: validAccount,
  GEMINI_API_KEY: 'configured', STRIPE_SECRET_KEY: 'sk_test_configured', STRIPE_WEBHOOK_SECRET: 'whsec_configured',
  STRIPE_PRICE_BASIC: 'price_basic_m', STRIPE_PRICE_PRO: 'price_pro_m', STRIPE_PRICE_PREMIUM: 'price_premium_m',
  STRIPE_PRICE_BASIC_ANNUAL: 'price_basic_y', STRIPE_PRICE_PRO_ANNUAL: 'price_pro_y', STRIPE_PRICE_PREMIUM_ANNUAL: 'price_premium_y',
  MASSIVE_API_KEY: 'configured', ALLOW_SIMULATED_MARKET_DATA: 'false' });

test('production preflight accepts complete configuration without revealing values', () => {
  assert.deepEqual(validateProductionEnvironment(completeEnv()), []);
  const env = completeEnv(); delete env.STRIPE_WEBHOOK_SECRET;
  const errors = validateProductionEnvironment(env);
  assert.ok(errors.includes('STRIPE_WEBHOOK_SECRET is required'));
  assert.equal(errors.join(' ').includes('whsec_configured'), false);
});

test('production preflight blocks simulation and missing market providers', () => {
  const env = completeEnv(); delete env.MASSIVE_API_KEY; env.ALLOW_SIMULATED_MARKET_DATA = 'true';
  assert.ok(validateProductionEnvironment(env).includes('MASSIVE_API_KEY, POLYGON_API_KEY, or a complete Alpaca credential pair is required'));
  assert.ok(validateProductionEnvironment(env).includes('ALLOW_SIMULATED_MARKET_DATA must equal false'));
});

test('Firebase service accounts fail closed on malformed or mismatched credentials', () => {
  assert.throws(() => parseFirebaseServiceAccount('{', 'marketmind'), /valid JSON/);
  assert.throws(() => parseFirebaseServiceAccount(validAccount, 'another-project'), /does not match/);
});

test('annual Stripe prices never fall back to monthly prices', () => {
  const previous = { ...process.env };
  process.env.STRIPE_PRICE_BASIC = 'price_monthly'; delete process.env.STRIPE_PRICE_BASIC_ANNUAL;
  assert.equal(getStripePriceId('basic', 'annual'), null);
  process.env.STRIPE_PRICE_BASIC_ANNUAL = 'price_annual';
  assert.equal(getStripePriceId('basic', 'annual'), 'price_annual');
  assert.equal(isAllowedPriceId('attacker_price'), false);
  process.env = previous;
});

test('monthly and annual checkout select only their matching configured prices', () => {
  const previous = { ...process.env };
  process.env.STRIPE_PRICE_PRO = 'price_pro_monthly'; process.env.STRIPE_PRICE_PRO_ANNUAL = 'price_pro_annual';
  assert.equal(getStripePriceId('pro', 'monthly'), 'price_pro_monthly');
  assert.equal(getStripePriceId('pro', 'annual'), 'price_pro_annual');
  delete process.env.STRIPE_PRICE_PRO;
  assert.equal(getStripePriceId('pro', 'monthly'), null);
  assert.equal(getStripePriceId('pro', 'annual'), 'price_pro_annual');
  process.env = previous;
});
