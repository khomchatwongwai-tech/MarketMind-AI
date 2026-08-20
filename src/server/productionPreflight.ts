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

  // 3. AI providers. Only explicitly enabled providers are mandatory.
  const providerSecrets: Record<string, string> = {
    openai: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', perplexity: 'PERPLEXITY_API_KEY',
  };
  const enabledProviders = (env.AI_ENABLED_PROVIDERS || 'gemini').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  for (const provider of enabledProviders) {
    const secretName = providerSecrets[provider];
    if (!secretName) { errors.push(`AI_ENABLED_PROVIDERS contains unsupported provider: ${provider}`); continue; }
    if (!env[secretName] || env[secretName]?.trim() === '') {
      if (isProduction) errors.push(`Missing required production environment variable: ${secretName}`);
      else warnings.push(`${secretName} is not set; enabled ${provider} requests will fail closed.`);
    }
  }

  // 4. Stripe Production Billing
  const allowOptionalBilling = env.ALLOW_OPTIONAL_BILLING === 'true' || env.ALLOW_UNCONFIGURED_BILLING === 'true';

  if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.trim() === '') {
    if (isProduction && !allowOptionalBilling) {
      errors.push('Missing required production environment variable: STRIPE_SECRET_KEY');
    } else {
      warnings.push('STRIPE_SECRET_KEY is not configured; billing checkout will return unconfigured notice.');
    }
  }

  if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.trim() === '') {
    if (isProduction && !allowOptionalBilling) {
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
      if (isProduction && !allowOptionalBilling) {
        errors.push(`Missing required production environment variable: ${priceKey}`);
      } else {
        warnings.push(`Stripe price configuration missing: ${priceKey}`);
      }
    }
  }

  // 5. Market Data Feeds (Massive/Polygon or Alpaca)
  const configuredSecret = (value: string | undefined) => {
    const trimmed = value?.trim() || '';
    const lower = trimmed.toLowerCase();
    return (
      trimmed.length >= 8 &&
      !lower.includes('placeholder') &&
      !lower.includes('example') &&
      !lower.includes('api_key') &&
      !lower.startsWith('your_')
    );
  };
  const hasMassiveOrPolygon = configuredSecret(env.MASSIVE_API_KEY) || configuredSecret(env.POLYGON_API_KEY);
  const hasAlpacaKey = configuredSecret(env.ALPACA_API_KEY);
  const hasAlpacaSecret = configuredSecret(env.ALPACA_API_SECRET);
  const hasAlpaca = hasAlpacaKey && hasAlpacaSecret;

  if (hasAlpacaKey !== hasAlpacaSecret) {
    errors.push('ALPACA_API_KEY and ALPACA_API_SECRET must be configured as a complete credential pair');
  }

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

  if (!env.FIREBASE_DATABASE_ID || env.FIREBASE_DATABASE_ID.trim() === '') {
    warnings.push('FIREBASE_DATABASE_ID not specified; using default database instance.');
  }

  // 7. APP_URL & Host Configuration
  if (isProduction) {
    if (!env.APP_URL || env.APP_URL.trim() === '') {
      errors.push('Missing required production environment variable: APP_URL');
    } else {
      try {
        const parsedAppUrl = new URL(env.APP_URL.trim());
        if (parsedAppUrl.protocol !== 'https:' && parsedAppUrl.hostname !== 'localhost') {
          errors.push('APP_URL must use HTTPS protocol in production');
        }
      } catch {
        errors.push('APP_URL is not a valid URL');
      }
    }
  }

  // 8. Market Data Mode Consistency
  const marketMode = env.MARKET_DATA_MODE;
  const viteMarketMode = env.VITE_MARKET_DATA_MODE;
  const supportedMarketModes = new Set(['real_time', 'live', 'delayed']);
  if (isProduction && marketMode && !supportedMarketModes.has(marketMode)) {
    errors.push('MARKET_DATA_MODE must be real_time, live, or delayed for the production live-market pipeline');
  }
  if (marketMode && viteMarketMode && marketMode !== viteMarketMode) {
    errors.push('MARKET_DATA_MODE and VITE_MARKET_DATA_MODE must match');
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
