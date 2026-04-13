'use client';

import { useState } from 'react';
import { TrendingUp, AlertTriangle, BarChart2, GitBranch, RefreshCw } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  trend: <TrendingUp className="w-4 h-4" />,
  outlier: <AlertTriangle className="w-4 h-4" />,
  summary: <BarChart2 className="w-4 h-4" />,
  correlation: <GitBranch className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  trend: 'bg-blue-50 text-blue-700 border-blue-100',
  outlier: 'bg-amber-50 text-amber-700 border-amber-100',
  summary: 'bg-purple-50 text-purple-700 border-purple-100',
  correlation: 'bg-green-50 text-green-700 border-green-100',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'bg-green-50 text-green-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-gray-50 text-gray-600',
};

interface Insight {
  id: string;
  title: string;
  description: string;
  type: string;
  confidence: string;
}

interface Props {
  insights: Insight[];
  datasetId: string;
}

export default function InsightsPanel({ insights, datasetId }: Props) {
  const [localInsights, setLocalInsights] = useState(insights);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId }),
      });
      const json = await res.json();
      if (json.success) setLocalInsights(json.data);
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  if (localInsights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-500 mb-4">No insights generated yet.</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generate insights
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {localInsights.length} AI-generated insights from your dataset.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localInsights.map((insight) => (
          <div
            key={insight.id}
            className={`border rounded-xl p-5 ${TYPE_COLORS[insight.type] || 'bg-gray-50 text-gray-700 border-gray-100'}`}
          >
            <div className="flex items-start gap-2 mb-2">
              <div className="mt-0.5 shrink-0">{TYPE_ICONS[insight.type] || <BarChart2 className="w-4 h-4" />}</div>
              <h3 className="font-semibold text-sm leading-tight">{insight.title}</h3>
            </div>
            <p className="text-sm opacity-80 leading-relaxed mb-3">{insight.description}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide opacity-60 font-medium">{insight.type}</span>
              <span className="text-xs opacity-40">·</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_COLORS[insight.confidence]}`}>
                {insight.confidence} confidence
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
