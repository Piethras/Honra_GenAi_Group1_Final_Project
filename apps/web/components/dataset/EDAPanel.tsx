'use client';

import { useState } from 'react';
import { Loader2, BarChart2, TrendingUp, FileText, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

interface StatSummary {
  column: string;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  missing: number;
}

interface Distribution {
  column: string;
  type: string;
  values: string[];
  counts: number[];
}

interface Correlation {
  colA: string;
  colB: string;
  correlation: number;
  strength: string;
  direction: string;
}

interface EDAResult {
  rowCount: number;
  columnCount: number;
  numericColumns: number;
  stats: StatSummary[];
  distributions: Distribution[];
  correlations: Correlation[];
  narrative: string;
}

interface Props {
  datasetId: string;
  onResult?: (result: any) => void;
}

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#9333EA', '#65A30D'];

export default function EDAPanel({ datasetId }: Props) {
  const [result, setResult] = useState<EDAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runEDA = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/datasets/eda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId }),
      });
      const json = await res.json();
      if (json.success) {
  setResult(json.data);
  onResult?.(json.data);
} else {
        setError(json.error?.message || 'EDA failed.');
      }
    } catch (e) {
      setError('Failed to run exploratory analysis.');
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (val: number) => {
    const abs = Math.abs(val);
    if (abs > 0.7) return '#059669';
    if (abs > 0.4) return '#D97706';
    return '#6B7280';
  };

  if (!result && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart2 className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="font-semibold text-gray-900 mb-2">Exploratory Data Analysis</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          Automatically analyse your dataset — statistics, distributions, correlations, and an AI-written summary.
        </p>
        <button
          onClick={runEDA}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <BarChart2 className="w-5 h-5" />
          Run Analysis
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-500 py-16 justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-sm">Analysing your dataset... this may take a few seconds.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
        {error}
        <button onClick={runEDA} className="ml-3 underline">Try again</button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Exploratory Analysis</h3>
            <p className="text-xs text-gray-500">{result.rowCount.toLocaleString()} rows · {result.columnCount} columns · {result.numericColumns} numeric</p>
          </div>
        </div>
        <button
          onClick={runEDA}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* AI Narrative */}
      {result.narrative && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">AI Dataset Summary</span>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">{result.narrative}</p>
        </div>
      )}

      {/* Stats Cards */}
      {result.stats.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Numeric Column Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.stats.map((stat) => (
              <div key={stat.column} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900 text-sm">{stat.column}</span>
                  {stat.missing > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {stat.missing} missing
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Mean', value: stat.mean },
                    { label: 'Median', value: stat.median },
                    { label: 'Std Dev', value: stat.std },
                    { label: 'Min', value: stat.min },
                    { label: 'Max', value: stat.max },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distributions */}
      {result.distributions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Value Distributions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.distributions.map((dist, idx) => {
              const chartData = dist.values.map((v, i) => ({
                name: v.length > 12 ? v.substring(0, 12) + '...' : v,
                count: dist.counts[i],
              }));
              return (
                <div key={dist.column} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 text-sm">{dist.column}</span>
                    <span className="text-xs text-gray-400">{dist.type}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Correlations */}
      {result.correlations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">Column Correlations</h4>
          <p className="text-xs text-gray-500 mb-3">
            Shows how strongly pairs of numeric columns are related. Values close to 1 or -1 mean strong relationships.
          </p>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <ResponsiveContainer width="100%" height={Math.max(200, result.correlations.length * 40)}>
              <BarChart
                data={result.correlations.map(c => ({
                  name: `${c.colA} & ${c.colB}`,
                  value: c.correlation,
                  abs: Math.abs(c.correlation),
                }))}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip
                  formatter={(value: any) => [Number(value).toFixed(3), 'Correlation']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {result.correlations.map((c, i) => (
                    <Cell key={i} fill={getCorrelationColor(c.correlation)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 justify-end">
              {[
                { color: '#059669', label: 'Strong (>0.7)' },
                { color: '#D97706', label: 'Moderate (0.4–0.7)' },
                { color: '#6B7280', label: 'Weak (<0.4)' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}