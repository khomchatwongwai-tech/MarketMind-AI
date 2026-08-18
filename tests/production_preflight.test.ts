import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProductionEnvironment,
  runProductionPreflight,
  normalizeSupabaseUrl,
} from '../src/server/productionPreflight';

const validProductionEnv: Record<string, string> = {
  NODE_ENV: 'production',
  APP_URL: 'https://marketmind.ai',
  FIREBASE_PROJECT_ID: 'ai-studio-marketmindai-52b43fbe-5366-4a57-8a3b-5ac098b91d46',
  FIREBASE_SERVICE_ACCOUNT_KEY: '{"project_id":"ai-studio-marketmindai-52b43fbe-5366-4a57-8a3b-5ac098b91d46"}',
  VITE_SUPABASE_URL: 'https://abcdefghijklm.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_pub_test_secret_12345_should_never_leak',
  SUPABASE_URL: 'https://abcdefghijklm.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_sec_test_secret_67890_should_never_leak',
  GEMINI_API_KEY: 'gemini_secret_key_abcdef_never_leak',
  STRIPE_SECRET_KEY: 'sk_live_test_secret_12345_never_leak',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret_67890_never_leak',
  STRIPE_PRICE_BASIC_MONTHLY: 'price_basic_m_1',
  STRIPE_PRICE_BASIC_ANNUAL: 'price_basic_a_1',
  STRIPE_PRICE_PRO_MONTHLY: 'price_pro_m_1',
  STRIPE_PRICE_PRO_ANNUAL: 'price_pro_a_1',
  STRIPE_PRICE_PREMIUM_MONTHLY: 'price_prem_m_1',
  STRIPE_PRICE_PREMIUM_ANNUAL: 'price_prem_a_1',
  STRIPE_PRICE_ULTRA_MONTHLY: 'price_ultra_m_1',
  STRIPE_PRICE_ULTRA_ANNUAL: 'price_ultra_a_1',
  MASSIVE_API_KEY: 'massive_key_12345_never_leak',
  ALLOW_SIMULATED_MARKET_DATA: 'false',
};

describe('Production Preflight & Security Hardening Tests', () => {
  it('Valid production environment passes all preflight checks', () => {
    const result = validateProductionEnvironment(validProductionEnv);
    assert.equal(result.ok, true, `Expected valid env to pass, but got errors: ${result.errors.join(', ')}`);
    assert.equal(result.errors.length, 0);
  });

  it('Missing VITE_SUPABASE_URL fails production preflight', () => {
    const env = { ...validProductionEnv, VITE_SUPABASE_URL: '' };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('VITE_SUPABASE_URL')));
  });

  it('Missing VITE_SUPABASE_PUBLISHABLE_KEY fails production preflight', () => {
    const env = { ...validProductionEnv, VITE_SUPABASE_PUBLISHABLE_KEY: '' };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('VITE_SUPABASE_PUBLISHABLE_KEY')));
  });

  it('HTTP VITE_SUPABASE_URL fails (must use HTTPS)', () => {
    const env = {
      ...validProductionEnv,
      VITE_SUPABASE_URL: 'http://abcdefghijklm.supabase.co',
      SUPABASE_URL: 'http://abcdefghijklm.supabase.co',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('VITE_SUPABASE_URL must use HTTPS')));
  });

  it('Invalid VITE_SUPABASE_URL fails parsing', () => {
    const env = {
      ...validProductionEnv,
      VITE_SUPABASE_URL: 'not-a-valid-url-at-all',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('VITE_SUPABASE_URL is not a valid URL')));
  });

  it('Browser Supabase URL different from SUPABASE_URL fails project match check', () => {
    const env = {
      ...validProductionEnv,
      VITE_SUPABASE_URL: 'https://project-a.supabase.co',
      SUPABASE_URL: 'https://project-b.supabase.co',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some((e) =>
        e.includes('VITE_SUPABASE_URL and SUPABASE_URL must point to the exact same Supabase project URL')
      )
    );
  });

  it('Matching HTTPS Supabase URLs pass (including with trailing slashes)', () => {
    const env = {
      ...validProductionEnv,
      VITE_SUPABASE_URL: 'https://abcdefghijklm.supabase.co/',
      SUPABASE_URL: 'https://abcdefghijklm.supabase.co',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, true, `Errors: ${result.errors.join(', ')}`);
  });

  it('ALLOW_SIMULATED_MARKET_DATA=true fails production preflight', () => {
    const env = {
      ...validProductionEnv,
      ALLOW_SIMULATED_MARKET_DATA: 'true',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('ALLOW_SIMULATED_MARKET_DATA')));
  });

  it('Missing ALLOW_SIMULATED_MARKET_DATA fails production preflight', () => {
    const env = { ...validProductionEnv };
    delete (env as any).ALLOW_SIMULATED_MARKET_DATA;
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('ALLOW_SIMULATED_MARKET_DATA')));
  });

  it('Secret values NEVER appear in returned error messages or logs', () => {
    const sensitiveTokens = [
      'sb_pub_test_secret_12345_should_never_leak',
      'sb_sec_test_secret_67890_should_never_leak',
      'gemini_secret_key_abcdef_never_leak',
      'sk_live_test_secret_12345_never_leak',
      'whsec_test_secret_67890_never_leak',
      'massive_key_12345_never_leak',
    ];

    // Intentionally trigger validation errors while sensitive variables exist in env
    const badEnv = {
      ...validProductionEnv,
      ALLOW_SIMULATED_MARKET_DATA: 'invalid_mode',
      VITE_SUPABASE_URL: 'http://invalid-url-leak-check.supabase.co',
      SUPABASE_URL: 'https://different-host.supabase.co',
    };

    const result = validateProductionEnvironment(badEnv);
    assert.equal(result.ok, false);

    const allErrorMessageText = result.errors.join(' ') + ' ' + result.warnings.join(' ');
    for (const secret of sensitiveTokens) {
      assert.equal(
        allErrorMessageText.includes(secret),
        false,
        `Security violation: Secret ${secret} leaked into preflight message!`
      );
    }
  });

  it('Existing Firebase, Stripe, Gemini, and market-data validation passes when configured', () => {
    const result = runProductionPreflight(validProductionEnv);
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
  });

  it('Missing Stripe Price IDs fails production preflight', () => {
    const env = {
      ...validProductionEnv,
      STRIPE_PRICE_ULTRA_ANNUAL: '',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('STRIPE_PRICE_ULTRA_ANNUAL')));
  });

  it('Missing market data provider (neither Massive/Polygon nor Alpaca pair) fails production preflight', () => {
    const env = {
      ...validProductionEnv,
      MASSIVE_API_KEY: '',
      POLYGON_API_KEY: '',
      ALPACA_API_KEY: '',
      ALPACA_API_SECRET: '',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('market data feed')));
  });

  it('Alpaca provider pair passes market data preflight check without Massive', () => {
    const env = {
      ...validProductionEnv,
      MASSIVE_API_KEY: '',
      POLYGON_API_KEY: '',
      ALPACA_API_KEY: 'alpaca_key_test',
      ALPACA_API_SECRET: 'alpaca_secret_test',
    };
    const result = validateProductionEnvironment(env);
    assert.equal(result.ok, true, `Errors: ${result.errors.join(', ')}`);
  });

  it('normalizeSupabaseUrl cleans paths and handles cases predictably', () => {
    assert.equal(normalizeSupabaseUrl('https://abc.supabase.co/'), 'https://abc.supabase.co');
    assert.equal(normalizeSupabaseUrl('HTTPS://ABC.SUPABASE.CO///'), 'https://abc.supabase.co');
    assert.equal(normalizeSupabaseUrl('https://abc.supabase.co'), 'https://abc.supabase.co');
  });
});
