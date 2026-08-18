/**
 * MarketMind AI - Environment & Production Configuration
 * Authoritative source of truth for runtime mode, simulation gating, and version metadata.
 */

export interface EnvironmentConfig {
  appVersion: string;
  buildId: string;
  isDemoMode: boolean;
  allowSimulatedMarketData: boolean;
  isProduction: boolean;
  apiBaseUrl: string;
  defaultTimezone: string;
}

const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
const nodeEnv = isNode ? process.env : ({} as Record<string, string | undefined>);

function getClientEnv(): Record<string, any> {
  if (isNode) return {};
  try {
    // Safe client env access in Vite environment
    const meta = import.meta as any;
    if (meta && meta.env) {
      return meta.env as Record<string, any>;
    }
    return {};
  } catch {
    return {};
  }
}

const clientEnv = getClientEnv();

const isDev = isNode
  ? nodeEnv.NODE_ENV !== 'production'
  : Boolean(clientEnv.DEV);

const envDemoMode = isNode
  ? nodeEnv.DEMO_MODE === 'true'
  : clientEnv.VITE_DEMO_MODE === 'true';

const envAllowSim = isNode
  ? nodeEnv.ALLOW_SIMULATED_MARKET_DATA === 'true'
  : clientEnv.VITE_ALLOW_SIMULATED_MARKET_DATA === 'true';

// Client-side demo mode state with local override support for testing
let clientDemoOverride: boolean | null = null;

export const AppConfig: EnvironmentConfig = {
  appVersion: 'Ultra 10 (v1.0.0)',
  buildId: '2026.08.15-PRD-U10',
  get isDemoMode(): boolean {
    // In production, demo mode is disabled by default
    if (!isDev) return false;
    if (clientDemoOverride !== null) return clientDemoOverride;
    return envDemoMode;
  },
  get allowSimulatedMarketData(): boolean {
    // Production MUST fail closed: never generate fake market data in production
    if (!isDev) return false;
    if (clientDemoOverride !== null) return clientDemoOverride;
    return envAllowSim;
  },
  isProduction: !isDev,
  apiBaseUrl: '/api',
  defaultTimezone: 'America/New_York',
};

export function setClientDemoMode(enabled: boolean) {
  clientDemoOverride = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('marketmind_demo_mode', enabled ? 'true' : 'false');
  }
}

export function initClientDemoMode(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('marketmind_demo_mode');
    if (saved !== null) {
      clientDemoOverride = saved === 'true';
      return clientDemoOverride;
    }
  }
  return AppConfig.isDemoMode;
}
