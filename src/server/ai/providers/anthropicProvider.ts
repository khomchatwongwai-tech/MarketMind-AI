import { HttpProvider } from './httpProvider.js';
import { AIProviderError } from '../errors.js';
import type { ProviderRequest, ProviderResponse } from '../types.js';

export class AnthropicProvider extends HttpProvider {
  readonly id = 'anthropic' as const;
  readonly name = 'anthropic' as const;
  readonly supportsCitations = false;
  readonly supportsStructuredOutput = true;

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    const model = this.config.model(this.name);
    const apiKey = this.config.apiKey(this.name);

    const { json, latencyMs } = await this.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: request.maxOutputTokens,
        messages: [{ role: 'user', content: request.query }],
      },
      {
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
      },
      request
    );

    const text = json.content
      ?.filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n');

    if (!text || !text.trim()) {
      throw new AIProviderError(this.name, 'invalid_response', 'Anthropic response did not contain text content.');
    }

    return {
      provider: this.name,
      model: json.model || model,
      text,
      citations: [],
      usage: json.usage
        ? {
            inputTokens: json.usage.input_tokens,
            outputTokens: json.usage.output_tokens,
            totalTokens: (json.usage.input_tokens || 0) + (json.usage.output_tokens || 0),
          }
        : undefined,
      latencyMs,
      finishStatus: 'completed',
      warnings: [],
    };
  }
}
