import { useMemo, useState } from 'react';
import SampleAnswersBox from './SampleAnswersBox';

export default function InputPanel({ onSubmit, loading, demoCases = [] }) {
  const [activeInputTab, setActiveInputTab] = useState('custom');
  const [question, setQuestion] = useState('');
  const [llmAnswer, setLlmAnswer] = useState('');
  const [sampleAnswers, setSampleAnswers] = useState('');
  const [sampleFields, setSampleFields] = useState(['', '']);
  const [contextText, setContextText] = useState('');
  const [validationError, setValidationError] = useState('');

  const parsedSamples = useMemo(
    () => normalizeSamples(sampleAnswers, sampleFields),
    [sampleAnswers, sampleFields],
  );

  const handleAutofill = (demo) => {
    setQuestion(demo.question);
    setLlmAnswer(demo.llm_answer);
    setSampleAnswers(demo.sample_answers.join('\n'));
    setSampleFields(demo.sample_answers.length ? demo.sample_answers : ['', '']);
    setValidationError('');
    setActiveInputTab('custom');
  };

  const updateSampleField = (index, value) => {
    setSampleFields((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addSampleField = () => {
    setSampleFields((current) => [...current, '']);
  };

  const removeSampleField = (index) => {
    setSampleFields((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setValidationError('Question is required.');
      return;
    }
    if (!llmAnswer.trim()) {
      setValidationError('LLM answer is required.');
      return;
    }
    setValidationError('');
    onSubmit({
      question,
      llmAnswer,
      sampleAnswers: parsedSamples,
      contextText,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-premium p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Analysis Setup</h2>
        <p className="text-xs text-slate-500 mt-0.5">Run custom audits by default, or load an editable demo case.</p>
      </div>

      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveInputTab('custom')}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${activeInputTab === 'custom' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Custom Analysis
        </button>
        <button
          type="button"
          onClick={() => setActiveInputTab('demos')}
          className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${activeInputTab === 'demos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Demo Cases
        </button>
      </div>

      {activeInputTab === 'demos' && (
        <div className="grid grid-cols-1 gap-2">
          {demoCases.map((demo) => (
            <button
              key={demo.id}
              type="button"
              onClick={() => handleAutofill(demo)}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
            >
              <span className="block text-xs font-bold text-slate-900">{demo.label}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{demo.description}</span>
            </button>
          ))}
        </div>
      )}

      {validationError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-medium">
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="question" className="block text-sm font-semibold text-slate-900">
            Question
          </label>
          <textarea
            id="question"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Ask any question the LLM answered..."
            className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="llm-answer" className="block text-sm font-semibold text-slate-900">
            LLM Answer
          </label>
          <textarea
            id="llm-answer"
            rows={4}
            value={llmAnswer}
            onChange={(e) => setLlmAnswer(e.target.value)}
            disabled={loading}
            placeholder="Paste the answer you want to audit..."
            className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 transition-colors"
          />
        </div>

        <SampleAnswersBox
          value={sampleAnswers}
          onChange={setSampleAnswers}
          disabled={loading}
          count={parsedSamples.length}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-900">Sample Answer Fields</label>
            <button
              type="button"
              onClick={addSampleField}
              disabled={loading}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Add Sample
            </button>
          </div>
          {sampleFields.map((sample, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                rows={2}
                value={sample}
                onChange={(e) => updateSampleField(index, e.target.value)}
                disabled={loading}
                placeholder={`Sample answer ${index + 1}`}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => removeSampleField(index)}
                disabled={loading || sampleFields.length === 1}
                className="h-10 rounded-md border border-slate-200 px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="context-text" className="block text-sm font-semibold text-slate-900">
            Optional Context Text
          </label>
          <textarea
            id="context-text"
            rows={4}
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            disabled={loading}
            placeholder="Paste source text for context-grounded Mode 2 analysis..."
            className="block w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all-300"
        >
          {loading ? 'Analyzing Hallucination Risk...' : 'Analyze Answer'}
        </button>
      </form>
    </div>
  );
}

function normalizeSamples(textAreaValue, fieldValues) {
  const textareaSamples = textAreaValue.includes('---')
    ? textAreaValue.split('---')
    : textAreaValue.split('\n');
  const combined = [...textareaSamples, ...fieldValues];
  return combined.map((sample) => sample.trim()).filter(Boolean);
}
