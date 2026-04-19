'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Trash2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ColumnProfile {
  name: string;
  type: string;
  missing: number;
  missingPct: number;
  unique: number;
  duplicateRows: number;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
}

interface Profile {
  rowCount: number;
  columnCount: number;
  totalDuplicates: number;
  totalMissing: number;
  columns: ColumnProfile[];
}

interface Suggestion {
  column: string;
  issue: string;
  action: string;
  reason: string;
}

interface Operation {
  type: string;
  column?: string;
  strategy?: string;
}

interface Props {
  datasetId: string;
  fileUrl: string;
  fileType: string;
  datasetName: string;
}

export default function CleaningPanel({ datasetId, fileUrl, fileType, datasetName }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch('/api/datasets/clean?action=profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId }),
      });
      const json = await res.json();
      if (json.success) setProfile(json.data);
    } catch (e) {
      setError('Failed to load dataset profile.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const getSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch('/api/datasets/clean?action=suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId }),
      });
      const json = await res.json();
      if (json.success) setSuggestions(json.data.suggestions);
    } catch (e) {
      setError('Failed to get AI suggestions.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleOperation = (op: Operation) => {
    const key = `${op.type}-${op.column || 'all'}`;
    const exists = operations.find(o => `${o.type}-${o.column || 'all'}` === key);
    if (exists) {
      setOperations(operations.filter(o => `${o.type}-${o.column || 'all'}` !== key));
    } else {
      setOperations([...operations, op]);
    }
  };

  const isSelected = (op: Operation) => {
    const key = `${op.type}-${op.column || 'all'}`;
    return operations.some(o => `${o.type}-${o.column || 'all'}` === key);
  };

  const applyAndSave = async () => {
    if (operations.length === 0) return;
    setApplying(true);
    setError('');
    try {
      const res = await fetch('/api/datasets/clean?action=apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, operations }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error?.message || 'Cleaning failed.');
      }
    } catch (e) {
      setError('Failed to apply cleaning operations.');
    } finally {
      setApplying(false);
    }
  };

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      fill_missing_mean: 'Fill with mean',
      fill_missing_median: 'Fill with median',
      fill_missing_mode: 'Fill with mode',
      remove_duplicates: 'Remove duplicates',
      remove_outliers: 'Remove outliers',
      drop_column: 'Drop column',
    };
    return labels[action] || action;
  };

  const actionToOperation = (suggestion: Suggestion): Operation => {
    if (suggestion.action === 'remove_duplicates') {
      return { type: 'remove_duplicates' };
    }
    if (suggestion.action === 'fill_missing_mean') {
      return { type: 'fill_missing', column: suggestion.column, strategy: 'mean' };
    }
    if (suggestion.action === 'fill_missing_median') {
      return { type: 'fill_missing', column: suggestion.column, strategy: 'median' };
    }
    if (suggestion.action === 'fill_missing_mode') {
      return { type: 'fill_missing', column: suggestion.column, strategy: 'mode' };
    }
    if (suggestion.action === 'remove_outliers') {
      return { type: 'remove_outliers', column: suggestion.column };
    }
    if (suggestion.action === 'drop_column') {
      return { type: 'drop_column', column: suggestion.column };
    }
    return { type: suggestion.action, column: suggestion.column };
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center gap-3 text-gray-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm">Analysing dataset...</span>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Cleaning complete!</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{result.originalRows}</div>
              <div className="text-xs text-green-600">Original rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{result.finalRows}</div>
              <div className="text-xs text-green-600">Final rows</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{result.rowsRemoved}</div>
              <div className="text-xs text-green-600">Rows removed</div>
            </div>
          </div>
          <div className="space-y-1">
            {result.changes.map((change: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                {change}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            <span>A new cleaned dataset <strong>{datasetName.replace(/\.[^.]+$/, '')}_cleaned.csv</strong> has been saved to your datasets.</span>
          </div>
        </div>
        <button
          onClick={() => { setResult(null); setOperations([]); loadProfile(); }}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Clean again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Dataset Health Summary */}
      {profile && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Dataset health summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total rows', value: profile.rowCount, color: 'text-gray-900' },
              { label: 'Total columns', value: profile.columnCount, color: 'text-gray-900' },
              { label: 'Missing values', value: profile.totalMissing, color: profile.totalMissing > 0 ? 'text-amber-600' : 'text-green-600' },
              { label: 'Duplicate rows', value: profile.totalDuplicates, color: profile.totalDuplicates > 0 ? 'text-amber-600' : 'text-green-600' },
            ].map(stat => (
              <div key={stat.label} className="text-center bg-gray-50 rounded-lg p-3">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Column table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Column</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Missing</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Unique</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Quick fix</th>
                </tr>
              </thead>
              <tbody>
                {profile.columns.map((col, i) => (
                  <tr key={col.name} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-3 font-medium text-gray-900">{col.name}</td>
                    <td className="py-2 px-3 text-gray-500">{col.type}</td>
                    <td className="py-2 px-3">
                      {col.missing > 0 ? (
                        <span className="text-amber-600 font-medium">{col.missing} ({col.missingPct}%)</span>
                      ) : (
                        <span className="text-green-600">None</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-500">{col.unique}</td>
                    <td className="py-2 px-3">
                      {col.missing > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {col.type.includes('float') || col.type.includes('int') ? (
                            <>
                              <button
                                onClick={() => toggleOperation({ type: 'fill_missing', column: col.name, strategy: 'mean' })}
                                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isSelected({ type: 'fill_missing', column: col.name, strategy: 'mean' }) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                              >
                                Fill mean
                              </button>
                              <button
                                onClick={() => toggleOperation({ type: 'fill_missing', column: col.name, strategy: 'median' })}
                                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isSelected({ type: 'fill_missing', column: col.name, strategy: 'median' }) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                              >
                                Fill median
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => toggleOperation({ type: 'fill_missing', column: col.name, strategy: 'mode' })}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isSelected({ type: 'fill_missing', column: col.name, strategy: 'mode' }) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
                            >
                              Fill mode
                            </button>
                          )}
                          <button
                            onClick={() => toggleOperation({ type: 'fill_missing', column: col.name, strategy: 'drop' })}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${isSelected({ type: 'fill_missing', column: col.name, strategy: 'drop' }) ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-600 hover:border-red-300'}`}
                          >
                            Drop rows
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Global actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.totalDuplicates > 0 && (
              <button
                onClick={() => toggleOperation({ type: 'remove_duplicates' })}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${isSelected({ type: 'remove_duplicates' }) ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-600 hover:border-red-300'}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove {profile.totalDuplicates} duplicates
              </button>
            )}
            <button
              onClick={() => toggleOperation({ type: 'fill_all_missing' })}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${isSelected({ type: 'fill_all_missing' }) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}
            >
              Fill all missing values
            </button>
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">AI cleaning suggestions</h3>
          <button
            onClick={getSuggestions}
            disabled={loadingSuggestions}
            className="flex items-center gap-2 text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loadingSuggestions ? 'Analysing...' : 'Get AI suggestions'}
          </button>
        </div>

        {suggestions.length === 0 && !loadingSuggestions && (
          <p className="text-sm text-gray-400">Click the button above to get AI-powered cleaning recommendations for your dataset.</p>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => toggleOperation(actionToOperation(s))}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected(actionToOperation(s)) ? 'bg-purple-50 border-purple-300' : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/50'}`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${isSelected(actionToOperation(s)) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                  {isSelected(actionToOperation(s)) && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{s.column === 'all' ? 'Entire dataset' : s.column}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{actionLabel(s.action)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{s.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply button */}
      {operations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Selected operations ({operations.length})
          </h3>
          <div className="space-y-1 mb-4">
            {operations.map((op, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {op.type === 'remove_duplicates' && 'Remove duplicate rows'}
                {op.type === 'fill_all_missing' && 'Fill all missing values'}
                {op.type === 'fill_missing' && `Fill missing in "${op.column}" using ${op.strategy}`}
                {op.type === 'remove_outliers' && `Remove outliers from "${op.column}"`}
                {op.type === 'drop_column' && `Drop column "${op.column}"`}
              </div>
            ))}
          </div>
          <button
            onClick={applyAndSave}
            disabled={applying}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {applying ? 'Cleaning & saving...' : `Apply & save as ${datasetName.replace(/\.[^.]+$/, '')}_cleaned.csv`}
          </button>
        </div>
      )}
    </div>
  );
}