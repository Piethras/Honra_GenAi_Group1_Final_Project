'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import ChartRenderer from '../charts/ChartRenderer';
import type { QueryResult } from '@/types';

interface Dataset {
  id: string;
  name: string;
  rowCount: number | null;
  columnCount: number | null;
}

interface HistoryItem {
  id: string;
  questionText: string;
  answerText: string | null;
  chartConfig: any;
  status: string;
  createdAt: string | Date;
  durationMs?: number | null;
}

interface Props {
  datasets: Dataset[];
  preselectedDatasetId?: string;
  initialHistory?: HistoryItem[];
  userPlan: string;
  queryCount: number;
}

const EXAMPLE_QUESTIONS = [
  'What is the total revenue by month?',
  'Show me the top 10 products by sales',
  'What is the average value per category?',
  'Are there any outliers in the data?',
  'Show the distribution of values',
];

export default function QueryInterface({
  datasets,
  preselectedDatasetId,
  initialHistory = [],
  userPlan,
  queryCount,
}: Props) {
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    preselectedDatasetId || datasets[0]?.id || ''
  );
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<(QueryResult & { questionText: string; queryId: string })[]>([]);
  const [expandedCode, setExpandedCode] = useState<Set<string>>(new Set());
  const [localQueryCount, setLocalQueryCount] = useState(queryCount);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAtLimit = userPlan === 'FREE' && localQueryCount >= 20;

  const submit = async (q?: string) => {
    const text = (q || question).trim();
    if (!text || !selectedDatasetId || loading || isAtLimit) return;

    setLoading(true);
    setError('');
    setQuestion('');

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, datasetId: selectedDatasetId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'Query failed');

      setResults(prev => [{ ...json.data, questionText: text }, ...prev]);
      setLocalQueryCount(c => c + 1);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const toggleCode = (id: string) => {
    setExpandedCode(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Dataset selector */}
      {datasets.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Dataset</label>
          <select
            value={selectedDatasetId}
            onChange={e => setSelectedDatasetId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {datasets.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Quota warning */}
      {userPlan === 'FREE' && (
        <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
          isAtLimit ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        }`}>
          <Zap className="w-4 h-4 shrink-0" />
          {isAtLimit
            ? 'Monthly query limit reached. Upgrade to Pro for unlimited queries.'
            : `${20 - localQueryCount} queries remaining this month.`}
        </div>
      )}

      {/* Example suggestions */}
      {results.length === 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => submit(q)}
                disabled={loading || isAtLimit}
                className="text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question about your data... (e.g. What is the total revenue by region?)"
            disabled={loading || isAtLimit}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={() => submit()}
          disabled={!question.trim() || loading || isAtLimit}
          className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 text-gray-500 mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm">Analysing your data with AI...</span>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 + i * 8}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Results — current session */}
      {results.map((result, i) => (
        <div key={result.queryId || i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="font-medium text-gray-900 text-sm">Q: {result.questionText}</p>
          </div>
          <div className="p-5">
            {result.answer && (
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{result.answer}</p>
            )}
            {result.data && result.data.length > 0 && (
              <div className="mb-4">
                <ChartRenderer
                  type={result.chartType}
                  data={result.data}
                  config={result.chartConfig}
                />
              </div>
            )}
            {result.generatedCode && (
              <div>
                <button
                  onClick={() => toggleCode(result.queryId || String(i))}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
                >
                  {expandedCode.has(result.queryId || String(i))
                    ? <><ChevronUp className="w-3 h-3" /> Hide generated code</>
                    : <><ChevronDown className="w-3 h-3" /> Show generated code</>}
                </button>
                {expandedCode.has(result.queryId || String(i)) && (
                  <pre className="mt-2 bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto">
                    {result.generatedCode}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* History — from previous sessions */}
      {initialHistory.filter(item => item.status === 'SUCCESS').length > 0 && results.length === 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Previous queries</p>
         {initialHistory.filter(item => item.status === 'SUCCESS').map((item, i) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <p className="font-medium text-gray-900 text-sm">Q: {item.questionText}</p>
              </div>
              <div className="p-5">
                {item.answerText && (
                  <p className="text-gray-700 text-sm leading-relaxed">{item.answerText}</p>
                )}
                {item.chartConfig && (
                  <p className="text-xs text-gray-400 mt-2">
                    Chart: {item.chartConfig.type} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
