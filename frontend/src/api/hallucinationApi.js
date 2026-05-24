const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Sends a request to the FastAPI backend to analyze the LLM answer.
 */
export async function analyzeResponse({ question, llmAnswer, sampleAnswers, contextText }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        llm_answer: llmAnswer,
        sample_answers: sampleAnswers,
        context_text: contextText,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Unknown server error.' }));
      throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(
        'Backend server is offline or unreachable. Please verify that the backend is running on http://localhost:8000.',
        { cause: error },
      );
    }
    throw error;
  }
}

export async function runBenchmark() {
  const response = await fetch(`${API_BASE_URL}/api/benchmark/run`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: 'Unknown benchmark error.' }));
    throw new Error(errData.detail || `Benchmark error: ${response.status}`);
  }
  return await response.json();
}

export async function getHistory() {
  const response = await fetch(`${API_BASE_URL}/api/history`);
  if (!response.ok) {
    throw new Error(`History error: ${response.status}`);
  }
  return await response.json();
}

export async function clearHistory() {
  const response = await fetch(`${API_BASE_URL}/api/history`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`History delete error: ${response.status}`);
  }
  return await response.json();
}

export async function runDemoModelComparison() {
  const response = await fetch(`${API_BASE_URL}/api/models/compare/demo`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: 'Unknown model comparison error.' }));
    throw new Error(errData.detail || `Model comparison error: ${response.status}`);
  }
  return await response.json();
}

export async function compareModelOutputs(cases) {
  const response = await fetch(`${API_BASE_URL}/api/models/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cases }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: 'Unknown model comparison error.' }));
    throw new Error(errData.detail || `Model comparison error: ${response.status}`);
  }
  return await response.json();
}

export async function runQueryOnModels({ question, domain, selectedModels, sampleAnswers, contextText }) {
  const response = await fetch(`${API_BASE_URL}/api/models/run-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      domain,
      selected_models: selectedModels,
      sample_answers: sampleAnswers,
      context_text: contextText,
    }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ detail: 'Unknown live model query error.' }));
    throw new Error(errData.detail || `Live model query error: ${response.status}`);
  }
  return await response.json();
}

/**
 * Performs a health check request to determine the backend server status.
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      return { status: 'unhealthy', model_mode: 'unknown', message: 'Backend returned unhealthy status' };
    }
    return await response.json();
  } catch {
    return { status: 'offline', model_mode: 'unknown', message: 'Backend is offline' };
  }
}
