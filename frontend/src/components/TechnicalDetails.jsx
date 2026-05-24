export default function TechnicalDetails({ result, modelMode }) {
  if (!result) return null;

  return (
    <details className="bg-white border border-slate-200 rounded-lg shadow-premium">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-slate-900">
        Technical Details
      </summary>
      <div className="border-t border-slate-100 px-5 py-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Embedding mode" value={modelMode || 'unknown'} />
          <Detail label="Analyzed claims" value={result.claims?.length ?? 0} />
          <Detail label="Risk score" value={`${result.risk_score ?? 0}/100`} />
          <Detail label="Semantic support" value={`${result.similarity_score ?? 0}%`} />
          <Detail label="Uncertainty" value={`${result.uncertainty_score ?? 0}%`} />
          <Detail label="Entity warnings" value={result.entity_warnings?.length ?? 0} />
        </dl>
      </div>
    </details>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
