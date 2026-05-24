export default function VerdictCard({ verdict, disclaimer }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-premium p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Verdict</h3>
        <p className="mt-2 text-sm font-semibold text-slate-800 leading-relaxed">{verdict}</p>
      </div>
      
      {disclaimer && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] leading-normal text-slate-400 italic">
            <strong>Risk Disclaimer:</strong> {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
