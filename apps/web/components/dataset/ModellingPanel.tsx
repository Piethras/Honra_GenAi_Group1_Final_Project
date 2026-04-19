'use client';

import { useState } from 'react';
import { Loader2, Brain, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ReferenceLine
} from 'recharts';

interface Props {
  datasetId: string;
  schema: any[];
  onResult?: (result: any) => void;
}

interface ModelResult {
  modelType: string;
  targetColumn: string;
  trainSize: number;
  testSize: number;
  explanation: string;
  featureImportance: { feature: string; importance: number }[];
  // Regression
  r2Score?: number;
  rmse?: number;
  predictionSamples?: { actual: number; predicted: number }[];
  // Classification
  accuracy?: number;
  classes?: string[];
  classDistribution?: { class: string; count: number }[];
}

export default function ModellingPanel({ datasetId, schema }: Props) {
  const [targetColumn, setTargetColumn] = useState('');
  const [modelType, setModelType] = useState<'regression' | 'classification'>('regression');
  const [result, setResult] = useState<ModelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numericColumns = schema?.filter((c: any) => c.type === 'number').map((c: any) => c.name) || [];
  const allColumns = schema?.map((c: any) => c.name) || [];

  const trainModel = async () => {
    if (!targetColumn) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/datasets/modelling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, targetColumn, modelType }),
      });
      const json = await res.json();
      if (json.success) {
  setResult(json.data);
  onResult?.(json.data);
} else {
        setError(json.error?.message || 'Modelling failed.');
      }
    } catch (e) {
      setError('Failed to train model.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">

      {/* Configuration */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-50 rounded-xl p-2">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Train a Prediction Model</h3>
            <p className="text-xs text-gray-500">Select a target column and model type to get predictions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Target column */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              What do you want to predict?
            </label>
            <select
              value={targetColumn}
              onChange={e => setTargetColumn(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select target column</option>
              {allColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Model type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Model type
            </label>
            <select
              value={modelType}
              onChange={e => setModelType(e.target.value as 'regression' | 'classification')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="regression">Regression (predict a number)</option>
              <option value="classification">Classification (predict a category)</option>
            </select>
          </div>

          {/* Train button */}
          <div className="flex items-end">
            <button
              onClick={trainModel}
              disabled={!targetColumn || loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Training...</>
                : <><Brain className="w-4 h-4" /> Train Model</>
              }
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
          {modelType === 'regression'
            ? 'Use regression when predicting a numeric value (e.g. sales amount, price, quantity).'
            : 'Use classification when predicting a category (e.g. ship mode, segment, country).'}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-gray-500 py-8 justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-sm">Training model and generating explanation...</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Performance Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="font-semibold text-gray-900 mb-4">Model Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-600 mb-1">Model</div>
                <div className="text-sm font-semibold text-purple-900">{result.modelType}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Predicting</div>
                <div className="text-sm font-semibold text-gray-900">{result.targetColumn}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Training rows</div>
                <div className="text-sm font-semibold text-gray-900">{result.trainSize}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Testing rows</div>
                <div className="text-sm font-semibold text-gray-900">{result.testSize}</div>
              </div>
            </div>

            {/* Metric */}
            {result.r2Score !== undefined && (
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-4 text-center ${result.r2Score > 0.7 ? 'bg-green-50' : result.r2Score > 0.4 ? 'bg-amber-50' : 'bg-red-50'}`}>
                  <div className="text-xs text-gray-500 mb-1">R² Score (accuracy)</div>
                  <div className={`text-3xl font-bold ${result.r2Score > 0.7 ? 'text-green-700' : result.r2Score > 0.4 ? 'text-amber-700' : 'text-red-700'}`}>
                    {(result.r2Score * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.r2Score > 0.7 ? 'Good fit' : result.r2Score > 0.4 ? 'Moderate fit' : 'Weak fit'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-1">RMSE (avg error)</div>
                  <div className="text-3xl font-bold text-gray-900">{result.rmse?.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">Lower is better</div>
                </div>
              </div>
            )}

            {result.accuracy !== undefined && (
              <div className={`rounded-lg p-4 text-center ${result.accuracy > 70 ? 'bg-green-50' : result.accuracy > 50 ? 'bg-amber-50' : 'bg-red-50'}`}>
                <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                <div className={`text-4xl font-bold ${result.accuracy > 70 ? 'text-green-700' : result.accuracy > 50 ? 'text-amber-700' : 'text-red-700'}`}>
                  {result.accuracy}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {result.accuracy > 70 ? 'Good performance' : result.accuracy > 50 ? 'Moderate performance' : 'Needs improvement'}
                </div>
              </div>
            )}
          </div>

          {/* AI Explanation */}
          {result.explanation && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">AI Explanation</span>
              </div>
              <p className="text-sm text-purple-800 leading-relaxed">{result.explanation}</p>
            </div>
          )}

          {/* Feature Importance */}
          {result.featureImportance && result.featureImportance.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-1">Feature Importance</h4>
              <p className="text-xs text-gray-500 mb-4">Which columns influence the prediction the most</p>
              <ResponsiveContainer width="100%" height={Math.max(180, result.featureImportance.length * 40)}>
                <BarChart
                  data={result.featureImportance.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    formatter={(v: any) => [Number(v).toFixed(4), 'Importance']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                    {result.featureImportance.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#7C3AED' : i === 1 ? '#8B5CF6' : '#A78BFA'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Prediction Samples (regression) */}
          {result.predictionSamples && result.predictionSamples.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-1">Prediction Samples</h4>
              <p className="text-xs text-gray-500 mb-4">Comparison of actual vs predicted values on test data</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">#</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Actual</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Predicted</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.predictionSamples.map((s, i) => {
                      const diff = Math.abs(s.actual - s.predicted);
                      const pct = s.actual !== 0 ? (diff / Math.abs(s.actual)) * 100 : 0;
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-3 font-medium text-gray-900">{s.actual.toLocaleString()}</td>
                          <td className="py-2 px-3 text-purple-700 font-medium">{s.predicted.toLocaleString()}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${pct < 20 ? 'bg-green-100 text-green-700' : pct < 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {pct.toFixed(1)}% off
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Class Distribution (classification) */}
          {result.classDistribution && result.classDistribution.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-1">Class Distribution</h4>
              <p className="text-xs text-gray-500 mb-4">How many rows belong to each category</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={result.classDistribution} margin={{ top: 4, right: 20, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {result.classDistribution.map((_, i) => (
                      <Cell key={i} fill={['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626'][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}