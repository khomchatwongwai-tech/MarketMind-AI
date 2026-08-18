/**
 * MarketMind AI - Production Preflight Verification Engine
 * 
 * Strict preflight validation for production deployment.
 * Enforces zero fabricated data, HTTPS Supabase endpoints, Stripe credentials,
 * Firebase project configs, and market data providers.
 * 
 * SECURITY MANDATE: Never output API keys, secrets, tokens, or credential values
 * in logs or error messages. Reference only variable names and configuration keys.
 */

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function normalizeSupabaseUrl(rawUrl: string): string {
  try {
    const trimmed = rawUrl.trim();
    const parsed = new URL(trimmed);
    let pathname = parsed.pathname;
    while (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    if (pathname === '/') {
      pathname = '';
    }
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${pathname}`;
  } catch {
    return rawUrl.trim();
  }
}

export function validateProductionEnvironment(
  customEnv?: NodeJS.ProcessEnv | Record<string, string | undefined>
): PreflightResult {
  const env = customEnv || process.env;
  const errors: string[] = [];
  const warnings: string[] = [];

  const isProduction = env.NODE_ENV === 'production';

  // 1. Simulation Data Gating: Must strictly equal literal string "false"
  const simData = env.ALLOW_SIMULATED_MARKET_DATA;
  if (simData === undefined || simData === null || simData === '') {
    errors.push('Missing required production environment variable: ALLOW_SIMULATED_MARKET_DATA (must be strictly set to "false")');
  } else if (simData !== 'false') {
    errors.push('ALLOW_SIMULATED_MARKET_DATA must be strictly equal to literal string "false" in production (simulated/invented market data is barred)');
  }

  // 2. Supabase Browser & Server URLs + Keys
  const viteSupabaseUrl = env.VITE_SUPABASE_URL;
  const viteSupabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  const serverSupabaseUrl = env.SUPABASE_URL;
  const serverSupabaseKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!viteSupabaseUrl || viteSupabaseUrl.trim() === '') {
    errors.push('Missing required production environment variable: VITE_SUPABASE_URL');
  } else {
    try {
      const parsedUrl = new URL(viteSupabaseUrl.trim());
      if (parsedUrl.protocol !== 'https:') {
        errors.push('VITE_SUPABASE_URL must use HTTPS protocol in production');
      }
    } catch {
      errors.push('VITE_SUPABASE_URL is not a valid URL');
    }
  }

  if (!viteSupabaseKey || viteSupabaseKey.trim() === '') {
    errors.push('Missing required production environment variable: VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  if (!serverSupabaseUrl || serverSupabaseUrl.trim() === '') {
    errors.push('Missing required production environment variable: SUPABASE_URL');
  } else {
    try {
      const parsedUrl = new URL(serverSupabaseUrl.trim());
      if (parsedUrl.protocol !== 'https:') {
        errors.push('SUPABASE_URL must use HTTPS protocol in production');
      }
    } catch {
      errors.push('SUPABASE_URL is not a valid URL');
    }
  }

  if (!serverSupabaseKey || serverSupabaseKey.trim() === '') {
    errors.push('Missing required production environment variable: SUPABASE_SECRET_KEY');
  }

  // Matching Supabase URL Check: VITE_SUPABASE_URL and SUPABASE_URL must point to the same project
  if (viteSupabaseUrl && serverSupabaseUrl) {
    const normalizedVite = normalizeSupabaseUrl(viteSupabaseUrl);
    const normalizedServer = normalizeSupabaseUrl(serverSupabaseUrl);

    try {
      const vUrl = new URL(viteSupabaseUrl.trim());
      const sUrl = new URL(serverSupabaseUrl.trim());
      if (vUrl.protocol === 'https:' && sUrl.protocol === 'https:' && normalizedVite !== normalizedServer) {
        errors.push('VITE_SUPABASE_URL and SUPABASE_URL must point to the exact same Supabase project URL');
      }
    } catch {
      // invalid URL already flagged above
    }
  }

  // 3. AI / Gemini Intelligence
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '') {
    if (isProduction) {
      errors.push('Missing required production environment variable: GEMINI_API_KEY');
    } else {
      warnings.push('GEMINI_API_KEY is not set; server-side AI intelligence will run in offline mode.');
    }
  }

  // 4. Stripe Production Billing
  if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.trim() === '') {
    if (isProduction) {
      errors.push('Missing required production environment variable: STRIPE_SECRET_KEY');
    } else {
      warnings.push('STRIPE_SECRET_KEY is not configured; billing checkout will return unconfigured notice.');
    }
  }

  if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.trim() === '') {
    if (isProduction) {
      errors.push('Missing required production environment variable: STRIPE_WEBHOOK_SECRET');
    } else {
      warnings.push('STRIPE_WEBHOOK_SECRET is not configured.');
    }
  }

  // Stripe Monthly & Annual Price IDs
  const requiredStripePriceKeys = [
    'STRIPE_PRICE_BASIC_MONTHLY',
    'STRIPE_PRICE_BASIC_ANNUAL',
    'STRIPE_PRICE_PRO_MONTHLY',
    'STRIPE_PRICE_PRO_ANNUAL',
    'STRIPE_PRICE_PREMIUM_MONTHLY',
    'STRIPE_PRICE_PREMIUM_ANNUAL',
    'STRIPE_PRICE_ULTRA_MONTHLY',
    'STRIPE_PRICE_ULTRA_ANNUAL',
  ];

  for (const priceKey of requiredStripePriceKeys) {
    if (!env[priceKey] || env[priceKey]?.trim() === '') {
      if (isProduction) {
        errors.push(`Missing required production environment variable: ${priceKey}`);
      } else {
        warnings.push(`Stripe price configuration missing: ${priceKey}`);
      }
    }
  }

  // 5. Market Data Feeds (Massive/Polygon or Alpaca)
  const hasMassiveOrPolygon = Boolean(env.MASSIVE_API_KEY?.trim() || env.POLYGON_API_KEY?.trim());
  const hasAlpaca = Boolean(env.ALPACA_API_KEY?.trim() && env.ALPACA_API_SECRET?.trim());

  if (!hasMassiveOrPolygon && !hasAlpaca) {
    if (isProduction) {
      errors.push('Production requires at least one primary market data feed: MASSIVE_API_KEY, POLYGON_API_KEY, or complete ALPACA_API_KEY and ALPACA_API_SECRET pair');
    } else {
      warnings.push('No dedicated market data API keys found; market data will rely on secondary live endpoints.');
    }
  }

  // 6. Firebase Configuration
  if (!env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID.trim() === '') {
    if (isProduction) {
      errors.push('Missing required production environment variable: FIREBASE_PROJECT_ID');
    } else {
      warnings.push('FIREBASE_PROJECT_ID not set; defaulting to platform project identifier.');
    }
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_KEY && env.FIREBASE_SERVICE_ACCOUNT_KEY.trim() !== '') {
    try {
      JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch {
      errors.push('FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON format');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export function runProductionPreflight(
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>
): PreflightResult {
  return validateProductionEnvironment(env);
}

export function enforceProductionPreflight(
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>
): void {
  const result = validateProductionEnvironment(env);
  if (!result.ok) {
    const message = `[PRODUCTION PREFLIGHT FAILED]\n${result.errors.map((e) => `  - ${e}`).join('\n')}`;
    throw new Error(message);
  }
}
