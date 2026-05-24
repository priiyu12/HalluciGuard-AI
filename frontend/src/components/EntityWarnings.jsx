export default function EntityWarnings({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-premium p-5">
        <h3 className="text-sm font-bold text-slate-900">Entity, Date, and Number Warnings</h3>
        <p className="mt-2 text-xs text-slate-500">
          No direct entity, date, number, organization, or location conflicts were detected across the provided samples.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-premium overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-900">Entity, Date, and Number Warnings</h3>
        <p className="mt-1 text-xs text-slate-500">
          Concrete factual values in the audited answer that diverge from alternate samples.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {warnings.map((warning, index) => (
          <div key={`${warning.type}-${warning.original}-${index}`} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                {warning.type}
              </span>
              <span className="text-sm font-semibold text-slate-900">{warning.original}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{warning.message}</p>
            {warning.conflicting_values?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {warning.conflicting_values.slice(0, 8).map((value) => (
                  <span key={value} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                    {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
