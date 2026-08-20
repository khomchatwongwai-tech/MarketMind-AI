import type { ClassifiedIntent } from '../../services/ai/intentRouter.js';

export type AIProviderName = 'openai' | 'gemini' | 'anthropic' | 'perplexity';

export interface Citation {
  url: string;
  title?: string;
  provider: AIProviderName;
  evidenceType?: 'web' | 'internal-data';
  publicationTimestamp?: string;
}

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface ProviderHealth {
  provider: AIProviderName;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'CIRCUIT_OPEN';
  configured: boolean;
  enabled: boolean;
  healthy: boolean;
  consecutiveFailures: number;
  lastCheckedAt: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  latencyMs?: number;
  failureReason?: string;
}

export interface ProviderResponse {
  provider: AIProviderName;
  model: string;
  text: string;
  citations: Citation[];
  usage?: ProviderUsage;
  estimatedCostUsd?: number;
  latencyMs: number;
  finishStatus: 'completed' | 'length' | 'unavailable';
  warnings: string[];
}

export interface ProviderRequest {
  query: string;
  intent: ClassifiedIntent;
  context?: Record<string, unknown>;
  requestId: string;
  maxOutputTokens: number;
  temperature?: number;
}

export interface AIProvider {
  readonly id: AIProviderName;
  readonly name: AIProviderName;
  readonly supportsCitations: boolean;
  readonly supportsStructuredOutput: boolean;
  readonly timeoutMs: number;

  isAvailable(): boolean;
  getHealth(): Promise<ProviderHealth>;
  generate(request: ProviderRequest): Promise<ProviderResponse>;
  research?(request: ProviderRequest): Promise<ProviderResponse>;
}

export interface OrchestratedResponse {
  answer: string;
  intent: ClassifiedIntent['intent'];
  provider: AIProviderName;
  model: string;
  citations: Citation[];
  evidence: Array<{ type: 'web' | 'internal-data'; source: string }>;
  marketDataSources: string[];
  cached: boolean;
  latencyMs: number;
  warnings: string[];
  consensusMode?: boolean;
}

export type ProviderOpinion = {
  provider: AIProviderName;
  direction: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  confidence: number;
  catalysts: string[];
  risks: string[];
  invalidationConditions: string[];
  affectedAssets: string[];
  timeHorizon: 'INTRADAY' | '1_3_DAYS' | '1_2_WEEKS' | 'LONGER_TERM';
  citations?: string[];
};

export interface ConsensusResult {
  generatedAt: string;
  finalSynthesis: string;
  providersUsed: AIProviderName[];
  providersUnavailable: AIProviderName[];
  agreementLevel: 'HIGH' | 'MODERATE' | 'LOW';
  providerAgreementScore: number;
  disagreementScore: number;
  weightedConfidence: number;
  finalDirection: ProviderOpinion['direction'];
  uncertaintyFlag: boolean;
  evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  conflictingClaims: string[];
  citations: Citation[];
  opinions: ProviderOpinion[];
}
