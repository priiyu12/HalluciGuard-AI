import { getRiskColorClass } from '../utils/riskUtils';

export default function ClaimAnalysisTable({ claims }) {
  if (!claims || claims.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-premium overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h3 className="text-sm font-bold text-slate-900">Claim-wise Analysis</h3>
        <p className="text-xs text-slate-500 mt-0.5">Individual sentences extracted from the answer and audited for consistency.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Claim / Sentence</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Support</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contradiction</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {claims.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-slate-800 max-w-sm whitespace-normal leading-relaxed">
                  {item.claim}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getRiskColorClass(item.risk)}`}>
                    {item.risk}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                  {item.support_score}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                  {item.contradiction_score}%
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs whitespace-normal leading-relaxed">
                  {item.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
