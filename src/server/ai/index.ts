import { createOrchestrator } from './orchestrator'; import { ConsensusEngine } from './consensusEngine'; import { OpenAIProvider } from './providers/openaiProvider'; import { GeminiProvider } from './providers/geminiProvider'; import { AnthropicProvider } from './providers/anthropicProvider'; import { PerplexityProvider } from './providers/perplexityProvider';
export const aiProviders = [new OpenAIProvider(), new GeminiProvider(), new AnthropicProvider(), new PerplexityProvider()];
export const multiAIOrchestrator = createOrchestrator(aiProviders);
export const multiAIConsensus = new ConsensusEngine(aiProviders);
