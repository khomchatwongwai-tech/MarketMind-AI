import type { MarketOutcome } from '../services/ai/marketOutcomeEngine';

export function MarketOutcomeCard({ outcome }: { outcome: MarketOutcome }) {
  return <section aria-label="Market outcome" className="rounded-xl border border-slate-700 bg-slate-950 p-5 text-slate-100">
    <header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase text-slate-400">{outcome.ticker || outcome.market} outlook</p><h2 className="text-2xl font-semibold">{outcome.direction}</h2></div><div className="text-right"><strong>{outcome.confidence}%</strong><p className="text-xs text-slate-400">Confidence</p></div></header>
    <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div>Bullish<br/><strong>{outcome.bullishProbability}%</strong></div><div>Neutral<br/><strong>{outcome.neutralProbability}%</strong></div><div>Bearish<br/><strong>{outcome.bearishProbability}%</strong></div></div>
    <p className="mt-4">{outcome.summary}</p>
    <dl className="mt-4 grid gap-2 text-sm"><div><dt className="text-slate-400">Verification</dt><dd>{outcome.verification.status} · {outcome.verification.independentSourceCount} independent sources · {outcome.verification.primarySourceCount} primary</dd></div><div><dt className="text-slate-400">AI consensus</dt><dd>{outcome.aiConsensus.providersUsed.join(', ')} · {outcome.aiConsensus.agreementScore}% agreement</dd></div><div><dt className="text-slate-400">Last updated</dt><dd>{new Date(outcome.generatedAt).toLocaleString()}</dd></div></dl>
    {outcome.aiConsensus.uncertaintyFlag && <p role="alert" className="mt-3 rounded bg-amber-950 p-2 text-amber-200">Providers disagree or source evidence is limited. Review the risks and evidence before relying on this assessment.</p>}
    <h3 className="mt-4 font-medium">Invalidation conditions</h3><ul className="list-disc pl-5">{outcome.invalidationConditions.map(item => <li key={item}>{item}</li>)}</ul>
    <h3 className="mt-4 font-medium">Sources</h3><ul className="space-y-1">{outcome.evidence.map(item => <li key={`${item.url}-${item.title}`}><a className="underline" href={item.url} target="_blank" rel="noreferrer">{item.source}: {item.title}</a></li>)}</ul>
    <p className="mt-4 text-xs text-slate-400">{outcome.disclaimer}</p>
  </section>;
}
