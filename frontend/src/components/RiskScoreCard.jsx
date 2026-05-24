import { getRiskTextColor, getRiskColorClass } from '../utils/riskUtils';

export default function RiskScoreCard({ riskScore, riskLevel, uncertaintyScore, similarityScore }) {
  const textColor = getRiskTextColor(riskLevel);

  // Circumference of the circle = 2 * PI * r = 2 * 3.14159 * 52 = 326.7
  const strokeDasharray = 326.7;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * riskScore) / 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-premium p-6 flex flex-col md:flex-row items-center gap-8">
      {/* Risk Circle Meter */}
      <div className="relative flex items-center justify-center h-32 w-32 shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="52"
            className="text-slate-100"
            strokeWidth="7"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r="52"
            className={`${textColor} transition-all duration-500`}
            strokeWidth="7"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{riskScore}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Risk Score</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 w-full flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-slate-900">Hallucination Risk</h3>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getRiskColorClass(riskLevel)}`}>
              {riskLevel} Risk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Based on semantic consistency and factual contradiction extraction across alternative answers.</p>
        </div>

        {/* Meters for subscores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Uncertainty Score</span>
              <span>{uncertaintyScore}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${uncertaintyScore}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-400 leading-normal">Lack of consensus or low semantic overlap across samples.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Semantic Support Score</span>
              <span>{similarityScore}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${similarityScore}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-400 leading-normal">Average support/matching rate of target claims in samples.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
