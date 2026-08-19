import type { ClassifiedIntent } from '../../services/ai/intentRouter';

export type AIProviderName = 'openai' | 'gemini' | 'anthropic' | 'perplexity';
export interface Citation { url: string; title?: string; provider: AIProviderName; evidenceType?: 'web' | 'internal-data'; }
export interface ProviderUsage { inputTokens?: number; outputTokens?: number; totalTokens?: number; }
export interface ProviderHealth { provider: AIProviderName; status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' | 'CIRCUIT_OPEN'; configured: boolean; consecutiveFailures: number; lastCheckedAt: string; lastSuccessAt?: string; latencyMs?: number; }
export interface ProviderResponse { provider: AIProviderName; model: string; text: string; citations: Citation[]; usage?: ProviderUsage; estimatedCostUsd?: number; latencyMs: number; finishStatus: 'completed' | 'length' | 'unavailable'; warnings: string[]; }
export interface ProviderRequest { query: string; intent: ClassifiedIntent; context?: Record<string, unknown>; requestId: string; maxOutputTokens: number; }
export interface AIProvider { name: AIProviderName; isAvailable(): boolean; getHealth?(): Promise<ProviderHealth>; generate(request: ProviderRequest): Promise<ProviderResponse>; }
export interface OrchestratedResponse { answer: string; intent: ClassifiedIntent['intent']; provider: AIProviderName; model: string; citations: Citation[]; evidence: Array<{ type: 'web' | 'internal-data'; source: string }>; marketDataSources: string[]; cached: boolean; latencyMs: number; warnings: string[]; }

export type ProviderOpinion = { provider: AIProviderName; direction: 'BULLISH' | 'NEUTRAL' | 'BEARISH'; confidence: number; catalysts: string[]; risks: string[]; invalidationConditions: string[]; affectedAssets: string[]; timeHorizon: 'INTRADAY' | '1_3_DAYS' | '1_2_WEEKS' | 'LONGER_TERM'; citations?: string[]; };
export type ConsensusResult = { opinions: ProviderOpinion[]; providerAgreementScore: number; disagreementScore: number; weightedConfidence: number; finalDirection: ProviderOpinion['direction']; uncertaintyFlag: boolean; providersUsed: AIProviderName[]; providersUnavailable: AIProviderName[]; evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK'; };
