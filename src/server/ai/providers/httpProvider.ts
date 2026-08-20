import { aiConfig } from '../config.js';
import { AIProviderError } from '../errors.js';
import type { AIProvider, AIProviderName, ProviderHealth, ProviderRequest, ProviderResponse } from '../types.js';

export abstract class HttpProvider implements AIProvider {
  abstract readonly id: AIProviderName;
  abstract readonly name: AIProviderName;
  abstract readonly supportsCitations: boolean;
  abstract readonly supportsStructuredOutput: boolean;

  protected readonly config = aiConfig();
  get timeoutMs(): number {
    return this.config.timeoutMs;
  }

  isAvailable(): boolean {
    return (
      this.config.enabledProviders.includes(this.name) &&
      Boolean(this.config.apiKey(this.name))
    );
  }

  async getHealth(): Promise<ProviderHealth> {
    const configured = Boolean(this.config.apiKey(this.name));
    const enabled = this.config.enabledProviders.includes(this.name);
    const healthy = configured && enabled;

    return {
      provider: this.name,
      status: healthy ? 'HEALTHY' : configured ? 'DEGRADED' : 'OFFLINE',
      configured,
      enabled,
      healthy,
      consecutiveFailures: 0,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  protected async post(
    url: string,
    body: unknown,
    headers: Record<string, string>,
    request: ProviderRequest
  ): Promise<{ json: any; latencyMs: number }> {
    if (!this.isAvailable()) {
      throw new AIProviderError(this.name, 'unavailable', `${this.name} is not configured or missing API key.`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const started = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const kind =
          response.status === 429
            ? 'rate_limit'
            : response.status === 401 || response.status === 403
            ? 'unavailable'
            : response.status >= 500
            ? 'transient'
            : 'invalid_response';

        throw new AIProviderError(
          this.name,
          kind,
          `${this.name} request failed with status ${response.status}.`
        );
      }

      if (!json) {
        throw new AIProviderError(this.name, 'invalid_response', `${this.name} returned an invalid payload.`);
      }

      return { json, latencyMs: Date.now() - started };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new AIProviderError(this.name, 'timeout', `${this.name} timed out after ${this.config.timeoutMs}ms.`);
      }
      throw new AIProviderError(this.name, 'transient', `${this.name} request failed: ${(error as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  abstract generate(request: ProviderRequest): Promise<ProviderResponse>;
}
