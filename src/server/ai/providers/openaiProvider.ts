import { HttpProvider } from './httpProvider.js';
import { AIProviderError } from '../errors.js';
import type { ProviderRequest, ProviderResponse } from '../types.js';

export class OpenAIProvider extends HttpProvider {
  readonly id = 'openai' as const;
  readonly name = 'openai' as const;
  readonly supportsCitations = false;
  readonly supportsStructuredOutput = true;

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const model = this.config.model(this.name);
    const apiKey = this.config.apiKey(this.name);

    const { json, latencyMs } = await this.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: request.query }],
        max_tokens: request.maxOutputTokens,
        temperature: request.temperature ?? 0.7,
      },
      { authorization: `Bearer ${apiKey}` },
      request
    );

    const text = json.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new AIProviderError(this.name, 'invalid_response', 'OpenAI response did not contain text content.');
    }

    return {
      provider: this.name,
      model: json.model || model,
      text,
      citations: [],
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
