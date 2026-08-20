import type { AIProviderName } from './types.js';
const names: AIProviderName[] = ['openai', 'gemini', 'anthropic', 'perplexity'];
const keyByProvider: Record<AIProviderName, string> = { openai: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', perplexity: 'PERPLEXITY_API_KEY' };
const modelByProvider: Record<AIProviderName, string> = { openai: 'gpt-4.1-mini', gemini: 'gemini-2.5-flash', anthropic: 'claude-sonnet-4-20250514', perplexity: 'sonar' };
const positive = (value: string | undefined, fallback: number) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; };
export function aiConfig(env = process.env) {
  const enabled = (env.AI_ENABLED_PROVIDERS || 'gemini').split(',').map(v => v.trim().toLowerCase()).filter((v): v is AIProviderName => names.includes(v as AIProviderName));
  return { enabledProviders: enabled, maxAttempts: Math.min(4, positive(env.AI_MAX_PROVIDER_ATTEMPTS, 2)), retriesPerProvider: Math.min(3, positive(env.AI_RETRIES_PER_PROVIDER, 2)), circuitFailureThreshold: Math.min(10, positive(env.AI_CIRCUIT_FAILURE_THRESHOLD, 3)), circuitResetMs: positive(env.AI_CIRCUIT_RESET_MS, 60_000), timeoutMs: positive(env.AI_REQUEST_TIMEOUT_MS, 15_000), maxOutputTokens: Math.min(8_192, positive(env.AI_MAX_OUTPUT_TOKENS, 1_200)), dailyRequestLimit: positive(env.AI_DAILY_REQUEST_LIMIT, 1_000), cacheEnabled: env.AI_CACHE_ENABLED !== 'false', apiKey: (provider: AIProviderName) => env[keyByProvider[provider]], model: (provider: AIProviderName) => env[`${provider.toUpperCase()}_MODEL`] || modelByProvider[provider], dailyCostCap: (provider: AIProviderName) => positive(env[`AI_${provider.toUpperCase()}_DAILY_COST_USD`], 25) };
}
export const providerSecretName = (provider: AIProviderName) => keyByProvider[provider];
