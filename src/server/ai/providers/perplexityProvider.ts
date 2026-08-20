import { HttpProvider } from './httpProvider.js';
import { AIProviderError } from '../errors.js';
import type { Citation, ProviderRequest, ProviderResponse } from '../types.js';

export class PerplexityProvider extends HttpProvider {
  readonly id = 'perplexity' as const;
  readonly name = 'perplexity' as const;
  readonly supportsCitations = true;
  readonly supportsStructuredOutput = false;

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const model = this.config.model(this.name);
    const apiKey = this.config.apiKey(this.name);

    const { json, latencyMs } = await this.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content:
              'Provide current web research with source URLs. Never present invented prices or market metrics as facts.',
          },
          { role: 'user', content: request.query },
        ],
        max_tokens: request.maxOutputTokens,
      },
      { authorization: `Bearer ${apiKey}` },
      request
    );

    const text = json.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new AIProviderError(this.name, 'invalid_response', 'Perplexity response did not contain text content.');
    }

    const citations: Citation[] = (json.citations || []).map((url: string) => ({
      url,
      provider: this.name,
      evidenceType: 'web',
    }));

    return {
      provider: this.name,
      model: json.model || model,
      text,
      citations,
      usage: json.usage
        ? {
            inputTokens: json.usage.prompt_tokens,
            outputTokens: json.usage.completion_tokens,
            totalTokens: json.usage.total_tokens,
          }
        : undefined,
      latencyMs,
      finishStatus: 'completed',
      warnings: [],
    };
  }
}
