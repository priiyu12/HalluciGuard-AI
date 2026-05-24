import { useEffect, useState } from 'react';
import AnalysisModeBadge from '../components/AnalysisModeBadge';
import ClaimAnalysisTable from '../components/ClaimAnalysisTable';
import ContextEvidencePanel from '../components/ContextEvidencePanel';
import EntityWarnings from '../components/EntityWarnings';
import ExportActions from '../components/ExportActions';
import HighlightedAnswer from '../components/HighlightedAnswer';
import InputPanel from '../components/InputPanel';
import Loader from '../components/Loader';
import Navbar from '../components/Navbar';
import RiskScoreCard from '../components/RiskScoreCard';
import TechnicalDetails from '../components/TechnicalDetails';
import UncertaintyBreakdown from '../components/UncertaintyBreakdown';
import VerdictCard from '../components/VerdictCard';
import { analyzeResponse, checkBackendHealth, clearHistory, getHistory, runBenchmark } from '../api/hallucinationApi';
import demoCasesData from '../../../data/demo_cases.json';

export default function Home() {
  const [activePage, setActivePage] = useState('analyze');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [modelMode, setModelMode] = useState('unknown');
  const [appError, setAppError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    let cancelled = false;
    checkBackendHealth()
      .then((health) => {
        if (cancelled) return;
        setBackendStatus(health.status === 'ok' ? 'online' : 'offline');
        setModelMode(health.model_mode || 'unknown');
      })
      .catch(() => {
        if (!cancelled) setBackendStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuditSubmit = async ({ question, llmAnswer, sampleAnswers, contextText }) => {
    setLoading(true);
    setAppError(null);
    setWarning(null);
    setResult(null);

    if (sampleAnswers.length === 0) {
      setWarning('No sample answers provided. Running limited single-answer analysis. Self-consistency detection will be weaker.');
    } else if (sampleAnswers.length === 1) {
      setWarning('At least 2 sample answers are recommended for reliable reference-free detection.');
    }

    try {
      const responseData = await analyzeResponse({ question, llmAnswer, sampleAnswers, contextText });
      setResult(responseData);
    } catch (err) {
      setAppError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        modelMode={modelMode}
        backendStatus={backendStatus}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        {activePage === 'analyze' && (
          <AnalyzePage
            loading={loading}
            result={result}
            warning={warning}
            appError={appError}
            backendStatus={backendStatus}
            modelMode={modelMode}
            onSubmit={handleAuditSubmit}
            demoCases={demoCasesData}
          />
        )}
        {activePage === 'evaluation' && <EvaluationLab />}
        {activePage === 'history' && <HistoryPage />}
        {activePage === 'methodology' && <MethodologyPage />}
      </main>
    </div>
  );
}

function AnalyzePage({ loading, result, warning, appError, backendStatus, modelMode, onSubmit, demoCases }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-lg bg-slate-950 p-6 text-white shadow-premium md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">HalluciGuard AI v2</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Audit LLM Answers Before You Trust Them</h1>
          <p className="mt-2 text-sm leading-relaxed text-indigo-100/80">
            Run custom reference-free audits, add optional context for faithfulness checks, and inspect claim-level evidence instead of relying on demo-only flows.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <InputPanel onSubmit={onSubmit} loading={loading || backendStatus === 'offline'} demoCases={demoCases} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-7">
          {backendStatus === 'offline' && <Alert tone="rose" title="Backend Server Offline" message="Start the backend server on http://localhost:8000 to run analysis." />}
          {warning && <Alert tone="amber" title="Confidence Warning" message={warning} />}
          {appError && <Alert tone="rose" title="Error Encountered" message={appError} />}
          {loading && <Loader />}
          {!loading && !appError && !result && <EmptyState />}
          {!loading && result && <Results result={result} modelMode={modelMode} />}
        </div>
      </div>
    </div>
  );
}

function Results({ result, modelMode }) {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <AnalysisModeBadge mode={result.analysis_mode} confidenceNote={result.confidence_note} />
      <ExportActions result={result} />
      <RiskScoreCard
        riskScore={result.risk_score}
        riskLevel={result.risk_level}
        uncertaintyScore={result.uncertainty_score}
        similarityScore={result.similarity_score}
      />
      <VerdictCard verdict={result.verdict} disclaimer={result.disclaimer} />
      <UncertaintyBreakdown breakdown={result.uncertainty_breakdown} />
      <ContextEvidencePanel evidence={result.context_evidence} />
      <HighlightedAnswer highlightedAnswer={result.highlighted_answer} />
      <ClaimAnalysisTable claims={result.claims} />
      <EntityWarnings warnings={result.entity_warnings} />
      <TechnicalDetails result={result} modelMode={modelMode} />
    </div>
  );
}

function EvaluationLab() {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      setBenchmark(await runBenchmark());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Evaluation Lab" subtitle="Run the 50-case benchmark across baseline and upgraded scoring strategies." />
      <button onClick={handleRun} disabled={loading} className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
        {loading ? 'Running Benchmark...' : 'Run Benchmark'}
      </button>
      {error && <Alert tone="rose" title="Benchmark Error" message={error} />}
      {benchmark && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Object.entries(benchmark.models).map(([name, metrics]) => (
            <MetricCard key={name} name={name} metrics={metrics} />
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getHistory()
      .then((data) => {
        if (!cancelled) setItems(data.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClear = async () => {
    await clearHistory();
    setItems([]);
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="History" subtitle="Recently stored local analysis reports from this backend." />
      <button onClick={handleClear} className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        Clear History
      </button>
      {error && <Alert tone="rose" title="History Error" message={error} />}
      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-premium">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{item.question || 'Untitled analysis'}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {item.risk_score}/100 {item.risk_level}
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-slate-600">{item.llm_answer}</p>
          </div>
        ))}
        {items.length === 0 && <EmptyState title="No History Yet" message="Run an analysis to store a local report." />}
      </div>
    </section>
  );
}

function MethodologyPage() {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Methodology" subtitle="How HalluciGuard AI v2 scores reliability without paid APIs." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          ['Mode 1: Reference-Free', 'Compares the target answer to alternate samples for semantic stability, entity/date/number consistency, contradiction risk, and uncertainty.'],
          ['Mode 2: Context-Grounded', 'Retrieves matching chunks from pasted context and labels each claim as Supported, Contradicted, or Not Enough Evidence.'],
          ['Atomic Claims', 'Complex sentences are split into smaller factual clauses so one bad detail does not hide inside an otherwise good sentence.'],
          ['Benchmarking', 'The Evaluation Lab computes accuracy, precision, recall, F1, and confusion matrices across 50 fixed handcrafted cases.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ name, metrics }) {
  const matrix = metrics.confusion_matrix;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
      <h3 className="text-sm font-bold capitalize text-slate-900">{name.replaceAll('_', ' ')}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Accuracy" value={metrics.accuracy} />
        <Metric label="Precision" value={metrics.precision} />
        <Metric label="Recall" value={metrics.recall} />
        <Metric label="F1" value={metrics.f1_score} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
        <div className="rounded bg-emerald-50 p-3 text-emerald-700">TP {matrix.tp}</div>
        <div className="rounded bg-slate-50 p-3 text-slate-700">TN {matrix.tn}</div>
        <div className="rounded bg-amber-50 p-3 text-amber-700">FP {matrix.fp}</div>
        <div className="rounded bg-rose-50 p-3 text-rose-700">FN {matrix.fn}</div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{Math.round((value || 0) * 100)}%</div>
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Alert({ tone, title, message }) {
  const color = tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800';
  return (
    <div className={`rounded-lg border p-4 text-xs shadow-sm ${color}`}>
      <span className="font-semibold">{title}</span>
      <p className="mt-1 leading-relaxed">{message}</p>
    </div>
  );
}

function EmptyState({ title = 'Ready for Custom Audit', message = 'Type any question, answer, and optional samples. Demo cases are just editable autofill shortcuts.' }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white px-4 py-16 text-center shadow-sm">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">{message}</p>
    </div>
  );
}
