const navItems = [
  { id: 'analyze', label: 'Analyze' },
  { id: 'evaluation', label: 'Evaluation Lab' },
  { id: 'modelLab', label: 'Model Lab' },
  { id: 'history', label: 'History' },
  { id: 'methodology', label: 'Methodology' },
];

export default function Navbar({ modelMode, backendStatus, activePage, onNavigate }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900">HalluciGuard AI</span>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              MVP
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Reference-Free Hallucination Detector</p>
        </div>
        
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activePage === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {backendStatus === 'offline' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Backend Offline
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Backend Online ({modelMode === 'sentence-transformers' ? 'Transformers' : 'TF-IDF Fallback'})
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
