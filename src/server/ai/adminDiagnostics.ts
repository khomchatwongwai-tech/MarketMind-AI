import { aiConfig } from './config.js';
import type { AIProvider, ProviderHealth } from './types.js';

export interface SanitizedAIHealthReport {
  timestamp: string;
  primaryProvider: string;
  fallbackOrder: string[];
  providers: ProviderHealth[];
}

export async function getSanitizedAIHealthReport(providers: AIProvider[]): Promise<SanitizedAIHealthReport> {
  const config = aiConfig();
  const healthList = await Promise.all(providers.map((p) => p.getHealth()));

  const primary = config.enabledProviders[0] || 'gemini';
  const fallbacks = config.enabledProviders.slice(1);

  return {
    timestamp: new Date().toISOString(),
    primaryProvider: primary,
    fallbackOrder: fallbacks,
    providers: healthList.map((h) => ({
      provider: h.provider,
      status: h.status,
      configured: h.configured,
      enabled: h.enabled,
      healthy: h.healthy,
      consecutiveFailures: h.consecutiveFailures,
      lastCheckedAt: h.lastCheckedAt,
      lastSuccessAt: h.lastSuccessAt,
      lastFailureAt: h.lastFailureAt,
      latencyMs: h.latencyMs,
      failureReason: h.failureReason,
    })),
  };
}
