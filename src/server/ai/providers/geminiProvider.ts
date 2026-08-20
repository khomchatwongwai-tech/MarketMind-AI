import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config.js';
import { AIProviderError } from '../errors.js';
import type { AIProvider, AIProviderName, ProviderHealth, ProviderRequest, ProviderResponse } from '../types.js';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini' as const;
  readonly name = 'gemini' as const;
  readonly supportsCitations = true;
  readonly supportsStructuredOutput = true;

  private readonly config = aiConfig();

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

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    if (!this.isAvailable()) {
      throw new AIProviderError(this.name, 'unavailable', 'Gemini is not configured or missing API key.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const started = Date.now();

    try {
      const apiKey = this.config.apiKey(this.name)!;
      const client = new GoogleGenAI({ apiKey });

      const response = await client.models.generateContent({
        model: this.config.model(this.name),
        contents: request.query,
        config: {
          maxOutputTokens: request.maxOutputTokens,
          abortSignal: controller.signal,
        } as any,
      });

      const text = response.text;
      if (!text) {
        throw new AIProviderError(this.name, 'invalid_response', 'Gemini response did not include text.');
      }

      const usage: any = response.usageMetadata;
      return {
        provider: this.name,
        model: this.config.model(this.name),
        text,
        citations: [],
        usage: usage
          ? {
              inputTokens: usage.promptTokenCount,
              outputTokens: usage.candidatesTokenCount,
              totalTokens: usage.totalTokenCount,
            }
          : undefined,
        latencyMs: Date.now() - started,
        finishStatus: 'completed',
        warnings: [],
      };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new AIProviderError(this.name, 'timeout', `Gemini request timed out after ${this.config.timeoutMs}ms.`);
      }
      throw new AIProviderError(this.name, 'transient', `Gemini request failed: ${(error as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
