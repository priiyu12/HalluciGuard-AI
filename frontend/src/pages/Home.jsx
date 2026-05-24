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
import { analyzeResponse, checkBackendHealth, clearHistory, getHistory, runBenchmark, runDemoModelComparison, compareModelOutputs, runQueryOnModels } from '../api/hallucinationApi';
import demoCasesData from '../../../data/demo_cases.json';

const MODEL_OPTIONS = ['GPT', 'Gemini', 'Claude', 'Perplexity', 'Mistral', 'LLaMA', 'RAG Pipeline'];

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
        {activePage === 'modelLab' && <ModelLabPage />}
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

function ModelLabPage() {
  const [comparison, setComparison] = useState(null);
  const [liveRun, setLiveRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [domain, setDomain] = useState('business');
  const [question, setQuestion] = useState('Who founded Tesla?');
  const [sampleAnswers, setSampleAnswers] = useState('Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003.\nElon Musk joined Tesla later as an investor and chairman.');
  const [contextText, setContextText] = useState('Tesla was founded in 2003 by Martin Eberhard and Marc Tarpenning. Elon Musk joined Tesla after the founding as an investor and chairman.');
  const [selectedModels, setSelectedModels] = useState(['GPT', 'Gemini', 'Claude', 'Perplexity', 'LLaMA', 'RAG Pipeline']);
  const [customModelName, setCustomModelName] = useState('');
  const [modelOutputs, setModelOutputs] = useState({
    GPT: 'Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003.',
    Gemini: 'Tesla was founded by Elon Musk in 2003.',
    Claude: 'Tesla was founded in 2003 by Martin Eberhard and Marc Tarpenning; Elon Musk joined later.',
    Perplexity: 'Tesla was founded by Martin Eberhard and Marc Tarpenning in 2003, with Elon Musk joining later as an investor.',
    LLaMA: 'Tesla was started by Martin Eberhard, Marc Tarpenning, and Elon Musk.',
    'RAG Pipeline': 'Tesla was founded in 2003 by Martin Eberhard and Marc Tarpenning.',
  });

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      setLiveRun(null);
      setComparison(await runDemoModelComparison());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveRun = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!question.trim()) {
        throw new Error('Question is required before running selected models.');
      }
      if (selectedModels.length === 0) {
        throw new Error('Select at least one model to query.');
      }
      setComparison(null);
      setLiveRun(await runQueryOnModels({
        question: question.trim(),
        domain: domain.trim() || 'general',
        selectedModels,
        sampleAnswers: parseSamples(sampleAnswers),
        contextText,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanSamples = parseSamples(sampleAnswers);
      const outputs = Object.fromEntries(
        selectedModels
          .map((model) => [model, modelOutputs[model]?.trim()])
          .filter(([, answer]) => Boolean(answer)),
      );

      if (!question.trim()) {
        throw new Error('Question is required for model comparison.');
      }
      if (Object.keys(outputs).length < 2) {
        throw new Error('Add answers for at least two selected models.');
      }

      setComparison(await compareModelOutputs([
        {
          id: `custom-${Date.now()}`,
          domain: domain.trim() || 'general',
          question: question.trim(),
          sample_answers: cleanSamples,
          context_text: contextText,
          model_outputs: outputs,
        },
      ]));
      setLiveRun(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelName) => {
    setSelectedModels((current) => (
      current.includes(modelName)
        ? current.filter((item) => item !== modelName)
        : [...current, modelName]
    ));
  };

  const addCustomModel = () => {
    const cleanName = customModelName.trim();
    if (!cleanName || selectedModels.includes(cleanName)) return;
    setSelectedModels((current) => [...current, cleanName]);
    setModelOutputs((current) => ({ ...current, [cleanName]: '' }));
    setCustomModelName('');
  };

  const updateOutput = (modelName, value) => {
    setModelOutputs((current) => ({ ...current, [modelName]: value }));
  };

  const exportComparison = () => {
    const exportData = liveRun || comparison;
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `halluciguard-model-comparison-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Model Testing Platform"
        subtitle="Choose models, enter their answers for the same question, and compare hallucination risk by model and domain."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Demo Multi-Model Batch</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Runs the same five prompts against GPT, Gemini, Claude, Perplexity, Mistral, LLaMA, and RAG-style outputs.
            </p>
            <button onClick={handleRun} disabled={loading} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
              {loading ? 'Scoring Models...' : 'Run Model Comparison'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
          <h2 className="text-sm font-bold text-slate-900">Live Model Query Runner</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Enter a domain and question, choose models, run the query, then compare model answers and hallucination risk. Provider API keys or local Ollama are required; missing providers are shown as unavailable.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Domain
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="business, legal, medical, coding..."
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 md:col-span-2">
              Question
              <textarea
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Question every model answered"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 md:col-span-2">
              Sample Answers
              <textarea
                rows={3}
                value={sampleAnswers}
                onChange={(e) => setSampleAnswers(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="One sample per line, or separate with ---"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 md:col-span-2">
              Optional Context for RAG / Faithfulness
              <textarea
                rows={3}
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Paste context if you want the RAG Pipeline and context faithfulness checks."
              />
            </label>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select Models</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {MODEL_OPTIONS.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => toggleModel(model)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedModels.includes(model)
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Other model name"
              />
              <button type="button" onClick={addCustomModel} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Add Other
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              Live run will query selected providers and auto-score each returned answer against the other model answers plus your optional samples. You can also paste/edit outputs below and use manual comparison.
            </div>
            {selectedModels.map((model) => (
              <label key={model} className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                {model} Output
                <textarea
                  rows={3}
                  value={modelOutputs[model] || ''}
                  onChange={(e) => updateOutput(model, e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder={`Paste ${model}'s answer`}
                />
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={handleLiveRun} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
              {loading ? 'Running Models...' : 'Run Query on Selected Models'}
            </button>
            <button onClick={handleCustomCompare} disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              Compare Pasted Outputs
            </button>
            <button onClick={exportComparison} disabled={!comparison && !liveRun} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Export Report
            </button>
          </div>
        </div>
      </div>
      {error && <Alert tone="rose" title="Model Lab Error" message={error} />}
      {liveRun && (
        <>
          <LiveModelResults liveRun={liveRun} />
        </>
      )}
      {comparison && (
        <>
          <Leaderboard comparison={comparison} />
          <DomainReliability domains={comparison.domain_reliability} />
          <ModelCaseMatrix caseResults={comparison.case_results} />
        </>
      )}
    </section>
  );
}

function Leaderboard({ comparison }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Leaderboard</h3>
          <p className="mt-1 text-xs text-slate-500">
            {comparison.models_compared} models compared across {comparison.total_cases} shared cases.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {comparison.leaderboard.map((model, index) => (
          <div key={model.model_name} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900">#{index + 1} {model.model_name}</span>
              <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                {model.reliability_score}% reliable
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Average hallucination risk</span>
                <span>{model.average_risk}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white">
                <div className={`h-2 rounded-full ${model.average_risk >= 66 ? 'bg-rose-500' : model.average_risk >= 31 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${model.average_risk}%` }} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
              <div className="rounded bg-emerald-50 p-2 text-emerald-700">Low {model.low_risk_cases}</div>
              <div className="rounded bg-amber-50 p-2 text-amber-700">Med {model.medium_risk_cases}</div>
              <div className="rounded bg-rose-50 p-2 text-rose-700">High {model.high_risk_cases}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveModelResults({ liveRun }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Model Answers and Risk</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {liveRun.completed_models} of {liveRun.total_models} providers returned answers. {liveRun.provider_note}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            Domain: {liveRun.domain}
          </span>
        </div>
        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Question</div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{liveRun.question}</p>
        </div>
      </div>

      {liveRun.leaderboard?.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
          <h3 className="text-sm font-bold text-slate-900">Live Risk Leaderboard</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {liveRun.leaderboard.map((model, index) => (
              <div key={model.model_name} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">#{index + 1} {model.model_name}</span>
                  <span className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{model.reliability_score}% reliable</span>
                </div>
                <div className="mt-3 text-xs font-semibold text-slate-700">Risk {model.risk_score}% ({model.risk_level})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {liveRun.model_results.map((result) => (
          <div key={result.model_name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{result.model_name}</h4>
                <p className="mt-1 text-[11px] text-slate-500">{result.provider || 'Provider unavailable'}</p>
              </div>
              {result.status === 'completed' ? (
                <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${result.risk_score >= 66 ? 'bg-rose-50 text-rose-700' : result.risk_score >= 31 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {result.risk_score}% {result.risk_level}
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">Unavailable</span>
              )}
            </div>
            {result.status === 'completed' ? (
              <>
                <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{result.answer}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">{result.verdict}</p>
              </>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{result.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DomainReliability({ domains }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
      <h3 className="text-sm font-bold text-slate-900">Domain-Wise Reliability</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Domain</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Model</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Average Risk</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Reliability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(domains).flatMap(([domain, models]) =>
              Object.entries(models).map(([modelName, scores]) => (
                <tr key={`${domain}-${modelName}`}>
                  <td className="px-3 py-2 font-semibold capitalize text-slate-800">{domain}</td>
                  <td className="px-3 py-2 text-slate-600">{modelName}</td>
                  <td className="px-3 py-2 text-slate-600">{scores.average_risk}%</td>
                  <td className="px-3 py-2 text-slate-600">{scores.reliability_score}%</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelCaseMatrix({ caseResults }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-premium">
      <h3 className="text-sm font-bold text-slate-900">Case-Level Model Risk</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {Object.entries(caseResults).map(([modelName, runs]) => (
          <div key={modelName} className="rounded-lg border border-slate-100">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-900">{modelName}</div>
            <div className="divide-y divide-slate-100">
              {runs.map((run) => (
                <div key={`${modelName}-${run.case_id}`} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-800">{run.case_id}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${run.risk_score >= 66 ? 'bg-rose-50 text-rose-700' : run.risk_score >= 31 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {run.risk_score}% {run.risk_level}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{run.question}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
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

function parseSamples(value) {
  if (!value.trim()) return [];
  const parts = value.includes('---') ? value.split('---') : value.split('\n');
  return parts.map((sample) => sample.trim()).filter(Boolean);
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
