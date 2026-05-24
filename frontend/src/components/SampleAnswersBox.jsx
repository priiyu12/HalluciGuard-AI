export default function SampleAnswersBox({ value, onChange, disabled, count = 0 }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="sample-answers" className="block text-sm font-semibold text-slate-900">
          Bulk Sample Answers
        </label>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
          count >= 2 
            ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/10' 
            : 'bg-amber-50 text-amber-800 ring-amber-600/10'
        }`}>
          {count} {count === 1 ? 'sample' : 'samples'}
        </span>
      </div>
      
      <textarea
        id="sample-answers"
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="One answer per line, or separate longer answers with ---"
        className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 transition-colors"
      />
      <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-slate-500 gap-1 mt-1">
        <span>Enter each alternative response on a new line or separate using <code>---</code></span>
        {count === 1 && (
          <span className="text-amber-600 font-medium">At least 2 samples are recommended for reliability</span>
        )}
        {count === 0 && (
          <span className="text-slate-500 font-medium">Samples are optional, but improve reference-free detection</span>
        )}
      </div>
    </div>
  );
}
