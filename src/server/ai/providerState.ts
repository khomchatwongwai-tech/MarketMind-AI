import type { AIProviderName, ProviderHealth } from './types.js';

type State = { failures: number; circuitOpenedAt?: number; lastSuccessAt?: string; latencyMs?: number };

export class ProviderStateRegistry {
  private readonly states = new Map<AIProviderName, State>();
  constructor(private readonly failureThreshold = 3, private readonly resetMs = 60_000) {}
  private state(provider: AIProviderName) { const state = this.states.get(provider) || { failures: 0 }; this.states.set(provider, state); return state; }
  isCircuitOpen(provider: AIProviderName, now = Date.now()) { const state = this.state(provider); if (!state.circuitOpenedAt) return false; if (now - state.circuitOpenedAt >= this.resetMs) { state.circuitOpenedAt = undefined; state.failures = 0; return false; } return true; }
  success(provider: AIProviderName, latencyMs: number) { const state = this.state(provider); state.failures = 0; state.circuitOpenedAt = undefined; state.lastSuccessAt = new Date().toISOString(); state.latencyMs = latencyMs; }
  failure(provider: AIProviderName) { const state = this.state(provider); state.failures += 1; if (state.failures >= this.failureThreshold) state.circuitOpenedAt = Date.now(); }
  health(provider: AIProviderName, configured: boolean): ProviderHealth { const state = this.state(provider); const open = this.isCircuitOpen(provider); return { provider, configured, status: open ? 'CIRCUIT_OPEN' : configured ? state.failures ? 'DEGRADED' : 'AVAILABLE' : 'UNAVAILABLE', consecutiveFailures: state.failures, lastCheckedAt: new Date().toISOString(), lastSuccessAt: state.lastSuccessAt, latencyMs: state.latencyMs }; }
}
