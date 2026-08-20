import { createOrchestrator } from './orchestrator.js'; import { ConsensusEngine } from './consensusEngine.js'; import { OpenAIProvider } from './providers/openaiProvider.js'; import { GeminiProvider } from './providers/geminiProvider.js'; import { AnthropicProvider } from './providers/anthropicProvider.js'; import { PerplexityProvider } from './providers/perplexityProvider.js';
export const aiProviders = [new OpenAIProvider(), new GeminiProvider(), new AnthropicProvider(), new PerplexityProvider()];
export const multiAIOrchestrator = createOrchestrator(aiProviders);
export const multiAIConsensus = new ConsensusEngine(aiProviders);
