import type { AIProvider, AIProviderName, Citation, ConsensusResult, ProviderOpinion, ProviderRequest } from './types.js';

const directions: ProviderOpinion['direction'][] = ['BULLISH', 'NEUTRAL', 'BEARISH'];
const horizon = new Set<ProviderOpinion['timeHorizon']>(['INTRADAY', '1_3_DAYS', '1_2_WEEKS', 'LONGER_TERM']);
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 20) : []);

export function parseProviderOpinion(provider: AIProviderName, text: string, citations: string[] = []): ProviderOpinion {
  let raw: any;
  try {
    raw = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
  } catch {
    throw new Error(`${provider} did not return a valid structured opinion.`);
  }

  const direction = directions.includes(raw.direction) ? raw.direction : 'NEUTRAL';

  return {
    provider,
    direction,
    confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 0))),
    catalysts: strings(raw.catalysts),
    risks: strings(raw.risks),
    invalidationConditions: strings(raw.invalidationConditions),
    affectedAssets: strings(raw.affectedAssets),
    timeHorizon: horizon.has(raw.timeHorizon) ? raw.timeHorizon : '1_3_DAYS',
    citations,
  };
}

export function computeConsensus(
  opinions: ProviderOpinion[],
  unavailable: AIProviderName[] = [],
  independentSourceCount = 0
): ConsensusResult {
  if (!opinions.length) throw new Error('No real provider opinions are available.');

  const counts = directions.map((direction) => ({
    direction,
    count: opinions.filter((item) => item.direction === direction).length,
  }));

  const winner = counts.sort((a, b) => b.count - a.count)[0];
  const agreement = Math.round((winner.count / opinions.length) * 100);
  const disagreement = 100 - agreement;
  const confidence = Math.round(opinions.reduce((sum, item) => sum + item.confidence, 0) / opinions.length);
  const evidenceStrength = independentSourceCount >= 3 ? 'STRONG' : independentSourceCount >= 2 ? 'MODERATE' : 'WEAK';

  const conflictingClaims: string[] = [];
  if (disagreement > 0) {
    conflictingClaims.push('Providers differ on directional posture (bullish vs. bearish drivers).');
  }

  const synthesisText = opinions
    .map((op) => `[${op.provider.toUpperCase()}]: ${op.direction} (${op.confidence}% confidence) - Catalysts: ${op.catalysts.join(', ')}`)
    .join('\n\n');

  const citations: Citation[] = opinions.flatMap((op) =>
    (op.citations || []).map((url) => ({ url, provider: op.provider, evidenceType: 'web' }))
  );

  return {
    generatedAt: new Date().toISOString(),
    finalSynthesis: `### Multi-AI Consensus (${winner.direction})\n\n${synthesisText}`,
    opinions,
    providerAgreementScore: agreement,
    disagreementScore: disagreement,
    weightedConfidence: Math.max(0, Math.min(100, confidence - Math.round(disagreement * 0.25))),
    finalDirection: winner.direction,
    uncertaintyFlag: disagreement >= 50 || independentSourceCount < 2,
    providersUsed: opinions.map((item) => item.provider),
    providersUnavailable: unavailable,
    agreementLevel: agreement >= 80 ? 'HIGH' : agreement >= 60 ? 'MODERATE' : 'LOW',
    evidenceStrength,
    conflictingClaims,
    citations,
  };
}

export class ConsensusEngine {
  constructor(private readonly providers: AIProvider[]) {}

  async analyze(request: ProviderRequest, minimum = 2, independentSourceCount = 0): Promise<ConsensusResult> {
    const available = this.providers.filter((provider) => provider.isAvailable());
    const unavailable = this.providers.filter((provider) => !provider.isAvailable()).map((provider) => provider.name);

    const settled = await Promise.allSettled(
      available.map((provider) =>
        provider.generate({
          ...request,
          query: `${request.query}\nReturn JSON only with direction, confidence, catalysts, risks, invalidationConditions, affectedAssets, and timeHorizon.`,
        })
      )
    );

    const opinions: ProviderOpinion[] = [];
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        try {
          opinions.push(
            parseProviderOpinion(
              result.value.provider,
              result.value.text,
              result.value.citations.map((c) => c.url)
            )
          );
        } catch {
          unavailable.push(available[index].name);
        }
      } else {
        unavailable.push(available[index].name);
      }
    });

    if (opinions.length < minimum) {
      throw new Error(`Insufficient real providers for consensus (need at least ${minimum}, got ${opinions.length}).`);
    }

    return computeConsensus(opinions, [...new Set(unavailable)], independentSourceCount);
  }
}
