import type { AIProviderName, ProviderUsage } from './types.js';
export class CostController {
  private readonly requests = new Map<string, { day: string; count: number }>();
  private readonly providerSpend = new Map<AIProviderName, { day: string; usd: number }>();
  constructor(private readonly dailyLimit: number) {}
  allow(userId: string) { const day = new Date().toISOString().slice(0, 10); const current = this.requests.get(userId); const count = current?.day === day ? current.count : 0; if (count >= this.dailyLimit) return false; this.requests.set(userId, { day, count: count + 1 }); return true; }
  canSpend(provider: AIProviderName, capUsd: number) { const current = this.providerSpend.get(provider); return !current || current.day !== new Date().toISOString().slice(0, 10) || current.usd < capUsd; }
  record(provider: AIProviderName, usage?: ProviderUsage, explicitCost?: number) { const day = new Date().toISOString().slice(0, 10); const estimated = explicitCost ?? (((usage?.inputTokens || 0) * 0.000002) + ((usage?.outputTokens || 0) * 0.000008)); const current = this.providerSpend.get(provider); const usd = current?.day === day ? current.usd : 0; this.providerSpend.set(provider, { day, usd: usd + estimated }); return estimated; }
}
