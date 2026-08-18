import type { ClassifiedIntent } from '../../services/ai/intentRouter';

export type AIProviderName = 'openai' | 'gemini' | 'anthropic' | 'perplexity';
export interface Citation { url: string; title?: string; provider: AIProviderName; evidenceType?: 'web' | 'internal-data'; }
export interface ProviderUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number; }
export interface ProviderResponse { provider: AIProviderName; model: string; text: string; citations: Citation[]; usage?: ProviderUsage; estimatedCostUsd?: number; latencyMs: number; finishStatus: 'completed' | 'length' | 'unavailable'; warnings: string[]; }
export interface ProviderRequest { query: string; intent: ClassifiedIntent; context?: Record<string, unknown>; requestId: string; maxOutputTokens: number; }
export interface AIProvider { name: AIProviderName; isAvailable(): boolean; generate(request: ProviderRequest): Promise<ProviderResponse>; }
export interface OrchestratedResponse { answer: string; intent: ClassifiedIntent['intent']; provider: AIProviderName; model: string; citations: Citation[]; evidence: Array<{ type: 'web' | 'internal-data'; source: string }>; marketDataSources: string[]; cached: boolean; latencyMs: number; warnings: string[]; }
