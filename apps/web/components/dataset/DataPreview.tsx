'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { ColumnSchema } from '@/types';

interface Props {
  dataset: {
    id: string;
    status: string;
    schema: any;
    rowCount: number | null;
  };
}

const TYPE_COLORS: Record<string, string> = {
  number: 'bg-blue-50 text-blue-700',
  string: 'bg-green-50 text-green-700',
  date: 'bg-purple-50 text-purple-700',
  boolean: 'bg-amber-50 text-amber-700',
  unknown: 'bg-gray-50 text-gray-600',
};

export default function DataPreview({ dataset }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const schema: ColumnSchema[] = dataset.schema || [];
  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    if (dataset.status !== 'READY') return;
    setLoading(true);
    setError('');
    fetch(`/api/datasets/${dataset.id}/preview?page=${page}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setRows(json.data.rows || []);
          setTotal(json.data.total || dataset.rowCount || 0);
        } else {
          setError(json.error?.message || 'Failed to load preview');
        }
      })
      .catch(() => setError('Failed to load preview'))
      .finally(() => setLoading(false));
  }, [dataset.id, dataset.status, page]);

  if (dataset.status === 'PROCESSING') {
    return (
      <div className="flex items-center gap-3 p-8 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Processing your dataset... this usually takes 10–30 seconds.
      </div>
    );
  }

  if (dataset.status === 'ERROR') {
    return (
      <div className="p-8 text-red-600">
        There was an error processing this dataset. Please try uploading again.
      </div>
    );
  }

  return (
    <div>
      {/* Schema pills */}
      {schema.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {schema.map((col) => (
            <div key={col.name} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TYPE_COLORS[col.type] || TYPE_COLORS.unknown}`}>
                {col.type}
              </span>
              <span className="text-sm text-gray-700 font-medium">{col.name}</span>
              {col.nullCount > 0 && (
                <span className="text-xs text-amber-500">{col.nullCount} nulls</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="p-6 text-red-600 text-sm">{error}</div>
      ) : rows.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {Object.keys(rows[0]).map(col => (
                    <th key={col} className="text-left px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                        {val === null || val === undefined ? (
                          <span className="text-gray-300 italic text-xs">null</span>
                        ) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} rows
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-sm p-6">No data to preview.</p>
      )}
    </div>
  );
}
