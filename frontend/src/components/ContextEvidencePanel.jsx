export default function ContextEvidencePanel({ evidence }) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-premium overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">Context Evidence Panel</h3>
        <p className="mt-1 text-xs text-slate-500">Mode 2 retrieval and faithfulness labels against pasted context.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {evidence.map((item, index) => (
          <div key={`${item.claim}-${index}`} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass(item.status)}`}>
                {item.status}
              </span>
              <span className="text-sm font-semibold text-slate-900">{item.claim}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{item.reason}</p>
            <div className="mt-3 space-y-2">
              {item.evidence?.map((chunk) => (
                <div key={chunk.chunk} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Match score {Math.round((chunk.score || 0) * 100)}%
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700">{chunk.chunk}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusClass(status) {
  if (status === 'Supported') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Contradicted') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}
