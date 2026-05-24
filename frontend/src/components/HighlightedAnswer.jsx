export default function HighlightedAnswer({ highlightedAnswer }) {
  if (!highlightedAnswer || highlightedAnswer.length === 0) return null;

  const getHighlightClass = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200/80 cursor-help';
      case 'medium':
        return 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200/80 cursor-help';
      case 'low':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200/80 cursor-help';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-premium p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Factual Risk Map</h3>
        <p className="text-xs text-slate-500 mt-0.5">Visual representation of audited claims colored by their verified consistency level.</p>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 leading-relaxed text-sm select-text">
        {highlightedAnswer.map((span, idx) => (
          <span
            key={idx}
            title={`${span.risk} Risk Claim`}
            className={`inline-block px-1.5 py-0.5 mx-0.5 rounded border font-medium transition-colors ${getHighlightClass(span.risk)}`}
          >
            {span.text}
          </span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 text-xs font-semibold text-slate-500 pt-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-300"></span>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-amber-100 border border-amber-300"></span>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-rose-100 border border-rose-300"></span>
          <span>High Risk</span>
        </div>
      </div>
    </div>
  );
}
