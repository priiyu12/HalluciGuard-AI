export default function ExportActions({ result }) {
  if (!result) return null;

  const copySummary = async () => {
    const summary = `HalluciGuard AI Report\nRisk: ${result.risk_score}/100 (${result.risk_level})\nMode: ${result.analysis_mode}\nVerdict: ${result.verdict}`;
    await navigator.clipboard.writeText(summary);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `halluciguard-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={copySummary}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Copy Summary
      </button>
      <button
        type="button"
        onClick={exportJson}
        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
      >
        Export JSON
      </button>
    </div>
  );
}
