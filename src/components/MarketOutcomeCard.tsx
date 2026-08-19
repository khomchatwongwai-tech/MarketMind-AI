import type { MarketOutcome } from '../services/ai/marketOutcomeEngine';
import { isFiniteMarketNumber, formatPercent, formatNumber } from '../utils/formatters';

export function MarketOutcomeCard({ outcome }: { outcome: MarketOutcome }) {
  const confidenceStr = isFiniteMarketNumber(outcome.confidence) ? `${Math.round(outcome.confidence)}%` : 'N/A';
  const bullishStr = isFiniteMarketNumber(outcome.bullishProbability) ? `${Math.round(outcome.bullishProbability)}%` : 'N/A';
  const neutralStr = isFiniteMarketNumber(outcome.neutralProbability) ? `${Math.round(outcome.neutralProbability)}%` : 'N/A';
  const bearishStr = isFiniteMarketNumber(outcome.bearishProbability) ? `${Math.round(outcome.bearishProbability)}%` : 'N/A';
  const agreementStr = isFiniteMarketNumber(outcome.aiConsensus?.agreementScore) ? `${Math.round(outcome.aiConsensus.agreementScore)}%` : 'N/A';
  const primaryCount = outcome.verification?.primarySourceCount ?? 0;
  const independentCount = outcome.verification?.independentSourceCount ?? 0;

  const dateStr = outcome.generatedAt
    ? (() => {
        try {
          const d = new Date(outcome.generatedAt);
          return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
        } catch {
          return 'N/A';
        }
      })()
    : 'N/A';

  const mc = outcome.marketConfirmation;

  return (
    <section aria-label="Market outcome" className="rounded-xl border border-slate-700 bg-slate-950 p-5 text-slate-100">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-slate-400">{outcome.ticker || outcome.market || 'Market'} outlook</p>
          <h2 className="text-2xl font-semibold">{outcome.direction || 'NEUTRAL'}</h2>
        </div>
        <div className="text-right">
          <strong>{confidenceStr}</strong>
          <p className="text-xs text-slate-400">Confidence</p>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          Bullish<br />
          <strong>{bullishStr}</strong>
        </div>
        <div>
          Neutral<br />
          <strong>{neutralStr}</strong>
        </div>
        <div>
          Bearish<br />
          <strong>{bearishStr}</strong>
        </div>
      </div>

      <p className="mt-4">{outcome.summary}</p>

      <dl className="mt-4 grid gap-2 text-sm">
        <div>
          <dt className="text-slate-400">Verification</dt>
          <dd>
            {outcome.verification?.status || 'UNVERIFIED'} &middot; {independentCount} independent sources &middot; {primaryCount} primary
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">AI consensus</dt>
          <dd>
            {(outcome.aiConsensus?.providersUsed || []).join(', ') || 'N/A'} &middot; {agreementStr} agreement
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Last updated</dt>
          <dd>{dateStr}</dd>
        </div>
      </dl>

      {mc && (
        <div className="mt-4 border-t border-slate-800 pt-3 text-xs">
          <dt className="text-slate-400 font-medium mb-1">Market Confirmation Signals</dt>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
            <div>Price Move: <strong>{formatPercent(mc.priceMove)}</strong></div>
            <div>Volume Ratio: <strong>{isFiniteMarketNumber(mc.volumeRatio) ? `${mc.volumeRatio.toFixed(2)}x` : 'N/A'}</strong></div>
            <div>VIX Move: <strong>{formatPercent(mc.vixMove)}</strong></div>
            <div>Yield Move: <strong>{isFiniteMarketNumber(mc.yieldMoveBps) ? `${formatNumber(mc.yieldMoveBps)} bps` : 'N/A'}</strong></div>
            <div>Breadth: <strong>{mc.breadthSignal || 'N/A'}</strong></div>
            <div>Sector: <strong>{mc.sectorSignal || 'N/A'}</strong></div>
          </div>
        </div>
      )}

      {outcome.aiConsensus?.uncertaintyFlag && (
        <p role="alert" className="mt-3 rounded bg-amber-950 p-2 text-amber-200">
          Providers disagree or source evidence is limited. Review the risks and evidence before relying on this assessment.
        </p>
      )}

      {outcome.invalidationConditions && outcome.invalidationConditions.length > 0 && (
        <>
          <h3 className="mt-4 font-medium">Invalidation conditions</h3>
          <ul className="list-disc pl-5">
            {outcome.invalidationConditions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}

      {outcome.evidence && outcome.evidence.length > 0 && (
        <>
          <h3 className="mt-4 font-medium">Sources</h3>
          <ul className="space-y-1">
            {outcome.evidence.map((item) => (
              <li key={`${item.url}-${item.title}`}>
                <a className="underline" href={item.url} target="_blank" rel="noreferrer">
                  {item.source}: {item.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 text-xs text-slate-400">{outcome.disclaimer}</p>
    </section>
  );
}
