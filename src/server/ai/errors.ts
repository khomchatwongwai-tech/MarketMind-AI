import type { AIProviderName } from './types';
export class AIProviderError extends Error {
  constructor(public readonly provider: AIProviderName, public readonly kind: 'unavailable' | 'timeout' | 'rate_limit' | 'transient' | 'invalid_response', message: string) { super(message); this.name = 'AIProviderError'; }
}
export const publicAIError = () => ({ error: 'AI intelligence is temporarily unavailable. Please try again later.', code: 'AI_UNAVAILABLE' });
export const publicMarketDataError = () => ({ error: 'Verified current market data is unavailable, so MarketMind cannot provide a current-market analysis.', code: 'MARKET_DATA_UNAVAILABLE' });
