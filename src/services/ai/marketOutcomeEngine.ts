import type { ConsensusResult, ProviderOpinion } from '../../server/ai/types';
import type { MarketMindEventCluster, NewsArticle, VerificationStatus } from '../../types/newsIntelligence';
import { MarketMindNewsEngine } from '../MarketMindNewsEngine';

export type MarketOutcome = {
  ticker?: string; market?: string; direction: 'BULLISH' | 'NEUTRAL' | 'BEARISH'; confidence: number;
  bullishProbability: number; neutralProbability: number; bearishProbability: number;
  timeHorizon: 'INTRADAY' | '1_3_DAYS' | '1_2_WEEKS' | 'LONGER_TERM'; summary: string;
  whatHappened: string[]; whyItMatters: string[]; positiveCatalysts: string[]; negativeCatalysts: string[]; risks: string[]; invalidationConditions: string[]; affectedAssets: string[];
  verification: { status: VerificationStatus; independentSourceCount: number; primarySourceCount: number };
  aiConsensus: { providersUsed: string[]; providersUnavailable: string[]; agreementScore: number; disagreementScore: number; uncertaintyFlag: boolean };
  marketConfirmation?: { priceMove?: number | null; volumeRatio?: number | null; vixMove?: number | null; yieldMoveBps?: number | null; breadthSignal?: string | null; sectorSignal?: string | null };
  evidence: Array<{ source: string; title: string; url: string; publishedAt: string; tier: string }>;
  confidenceExplanation: string[]; disclaimer: string; generatedAt: string;
};
export type MarketReactionEvidence = { priceMove?: number | null; volumeRatio?: number | null; vixMove?: number | null; yieldMoveBps?: number | null; breadthSignal?: string | null; sectorSignal?: string | null; verified: boolean };

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
const probabilities = (direction: MarketOutcome['direction'], confidence: number): [number, number, number] => { const leading = Math.max(34, Math.min(90, Math.round(confidence))); const remainder = 100 - leading; if (direction === 'NEUTRAL') { const bullish = Math.floor(remainder / 2); return [bullish, leading, remainder - bullish]; } const neutral = Math.round(remainder * 0.55); const other = remainder - neutral; return direction === 'BULLISH' ? [leading, neutral, other] : [other, neutral, leading]; };

export function buildMarketOutcome(input: { ticker?: string; market?: string; articles: NewsArticle[]; clusters?: MarketMindEventCluster[]; consensus: ConsensusResult; marketReaction?: MarketReactionEvidence; now?: Date }): MarketOutcome {
  if (!input.consensus.opinions.length) throw new Error('MARKET_OUTCOME_UNAVAILABLE: no real AI provider opinion.');
  const independent = MarketMindNewsEngine.independentSources(input.articles); if (!independent.length) throw new Error('MARKET_OUTCOME_UNAVAILABLE: no attributable news evidence.');
  const verification = MarketMindNewsEngine.evaluateVerificationStatus(input.articles); const primaryCount = independent.filter(item => item.sourceTier === 'TIER_1_PRIMARY').length;
  let confidence = input.consensus.weightedConfidence; const explanation: string[] = [];
  if (independent.length === 1) { confidence -= 18; explanation.push('Reduced because only one independent source is available.'); }
  if (verification === 'UNVERIFIED' || verification === 'DEVELOPING') { confidence -= 12; explanation.push('Reduced because reporting is not fully confirmed.'); }
  if (verification === 'CONFLICTED') { confidence -= 20; explanation.push('Reduced because reputable reports conflict.'); }
  if (verification === 'STALE') { confidence -= 20; explanation.push('Reduced because the evidence is stale.'); }
  if (input.consensus.disagreementScore >= 50) { confidence -= 15; explanation.push('Reduced because AI providers disagree.'); }
  if (!input.marketReaction?.verified) { confidence -= 10; explanation.push('Reduced because verified live market reaction is unavailable.'); }
  confidence = Math.max(5, Math.min(95, Math.round(confidence)));
  const [bullishProbability, neutralProbability, bearishProbability] = probabilities(input.consensus.finalDirection, confidence);
  const opinions: ProviderOpinion[] = input.consensus.opinions; const catalysts = unique(opinions.flatMap(item => item.catalysts)); const risks = unique(opinions.flatMap(item => item.risks));
  return { ticker: input.ticker, market: input.market, direction: input.consensus.finalDirection, confidence, bullishProbability, neutralProbability, bearishProbability, timeHorizon: opinions[0]?.timeHorizon || '1_3_DAYS', summary: `The verified evidence supports a ${input.consensus.finalDirection.toLowerCase()} probabilistic assessment with ${confidence}% confidence.`, whatHappened: unique((input.clusters || []).flatMap(cluster => cluster.verifiedFacts)).slice(0, 8), whyItMatters: catalysts.slice(0, 8), positiveCatalysts: input.consensus.finalDirection === 'BEARISH' ? [] : catalysts.slice(0, 8), negativeCatalysts: input.consensus.finalDirection === 'BULLISH' ? [] : catalysts.slice(0, 8), risks, invalidationConditions: unique(opinions.flatMap(item => item.invalidationConditions)), affectedAssets: unique(opinions.flatMap(item => item.affectedAssets)), verification: { status: verification, independentSourceCount: independent.length, primarySourceCount: primaryCount }, aiConsensus: { providersUsed: input.consensus.providersUsed, providersUnavailable: input.consensus.providersUnavailable, agreementScore: input.consensus.providerAgreementScore, disagreementScore: input.consensus.disagreementScore, uncertaintyFlag: input.consensus.uncertaintyFlag }, marketConfirmation: input.marketReaction?.verified ? { priceMove: input.marketReaction.priceMove ?? null, volumeRatio: input.marketReaction.volumeRatio ?? null, vixMove: input.marketReaction.vixMove ?? null, yieldMoveBps: input.marketReaction.yieldMoveBps ?? null, breadthSignal: input.marketReaction.breadthSignal ?? null, sectorSignal: input.marketReaction.sectorSignal ?? null } : { priceMove: null, volumeRatio: null, vixMove: null, yieldMoveBps: null, breadthSignal: null, sectorSignal: null }, evidence: independent.map(article => ({ source: article.source, title: article.headline, url: article.url, publishedAt: article.publishedAt, tier: article.sourceTier })), confidenceExplanation: explanation.length ? explanation : ['Supported by corroborated evidence, provider agreement, and verified market reaction.'], disclaimer: 'This is a probabilistic analytical assessment for research and education, not a guarantee or investment advice.', generatedAt: (input.now || new Date()).toISOString() };
}
