export default function UncertaintyBreakdown({ breakdown }) {
  if (!breakdown || Object.keys(breakdown).length === 0) return null;

  const rows = [
    ['Sample disagreement', breakdown.sample_disagreement_score],
    ['Entity instability', breakdown.entity_instability_score],
    ['Semantic variance', breakdown.semantic_variance_score],
    ['Contradiction uncertainty', breakdown.contradiction_uncertainty_score],
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-premium p-5">
      <h3 className="text-sm font-bold text-slate-900">Uncertainty Breakdown</h3>
      <p className="mt-1 text-xs text-slate-500">{breakdown.explanation}</p>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
              <span>{label}</span>
              <span>{value}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
