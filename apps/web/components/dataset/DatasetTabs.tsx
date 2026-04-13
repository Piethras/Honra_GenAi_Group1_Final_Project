'use client';

import { useState } from 'react';
import DataPreview from './DataPreview';
import InsightsPanel from './InsightsPanel';
import QueryInterface from '../query/QueryInterface';
import ExportPanel from './ExportPanel';

interface Props {
  dataset: {
    id: string;
    name: string;
    status: string;
    fileType: string;
    rowCount: number | null;
    columnCount: number | null;
    schema: any;
    insights: any[];
    queries: any[];
  };
  userId: string;
  userPlan: string;
  queryCount: number;
}

const TABS = ['Preview', 'Insights', 'Query', 'Export'] as const;
type Tab = typeof TABS[number];

export default function DatasetTabs({ dataset, userId, userPlan, queryCount }: Props) {
  const [tab, setTab] = useState<Tab>('Preview');

  const isReady = dataset.status === 'READY';

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={!isReady && t !== 'Preview'}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {t}
            {t === 'Insights' && dataset.insights.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {dataset.insights.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Preview' && <DataPreview dataset={dataset} />}
      {tab === 'Insights' && <InsightsPanel insights={dataset.insights} datasetId={dataset.id} />}
      {tab === 'Query' && (
        <QueryInterface
          datasets={[{ id: dataset.id, name: dataset.name, rowCount: dataset.rowCount, columnCount: dataset.columnCount }]}
          preselectedDatasetId={dataset.id}
          initialHistory={dataset.queries}
          userPlan={userPlan}
          queryCount={queryCount}
        />
      )}
      {tab === 'Export' && (
        <ExportPanel
          datasetId={dataset.id}
          queries={dataset.queries}
          insights={dataset.insights}
        />
      )}
    </div>
  );
}
