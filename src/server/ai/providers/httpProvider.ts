import { aiConfig } from '../config';
import { AIProviderError } from '../errors';
import type { AIProvider, AIProviderName, ProviderRequest, ProviderResponse } from '../types';

export abstract class HttpProvider implements AIProvider {
  abstract readonly name: AIProviderName;
  protected readonly config = aiConfig();
  isAvailable() { return this.config.enabledProviders.includes(this.name) && Boolean(this.config.apiKey(this.name)); }
  protected async post(url: string, body: unknown, headers: Record<string, string>, request: ProviderRequest): Promise<{ json: any; latencyMs: number }> {
    if (!this.isAvailable()) throw new AIProviderError(this.name, 'unavailable', `${this.name} is not configured.`);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.config.timeoutMs); const started = Date.now();
    try { const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: controller.signal }); const json = await response.json().catch(() => null); if (!response.ok) { const kind = response.status === 429 ? 'rate_limit' : response.status >= 500 ? 'transient' : 'invalid_response'; throw new AIProviderError(this.name, kind, `${this.name} request failed with status ${response.status}.`); } if (!json) throw new AIProviderError(this.name, 'invalid_response', `${this.name} returned an invalid response.`); return { json, latencyMs: Date.now() - started }; } catch (error) { if (error instanceof AIProviderError) throw error; if ((error as Error).name === 'AbortError') throw new AIProviderError(this.name, 'timeout', `${this.name} timed out.`); throw new AIProviderError(this.name, 'transient', `${this.name} request failed.`); } finally { clearTimeout(timer); }
  }
  abstract generate(request: ProviderRequest): Promise<ProviderResponse>;
}
