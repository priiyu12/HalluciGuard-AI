export default function AnalysisModeBadge({ mode, confidenceNote }) {
  const label = {
    full_reference_free: 'Full Reference-Free Analysis',
    partial_reference_free: 'Partial Analysis',
    single_answer_limited: 'Limited Single-Answer Analysis',
  }[mode] || 'Analysis';

  const classes = {
    full_reference_free: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partial_reference_free: 'bg-amber-50 text-amber-700 border-amber-200',
    single_answer_limited: 'bg-slate-50 text-slate-700 border-slate-200',
  }[mode] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className={`rounded-lg border px-4 py-3 ${classes}`}>
      <div className="text-xs font-bold uppercase tracking-wide">{label}</div>
      {confidenceNote && <p className="mt-1 text-xs leading-relaxed">{confidenceNote}</p>}
    </div>
  );
}
