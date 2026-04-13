'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#be185d'];

interface Props {
  type: string;
  data: Record<string, unknown>[];
  config: {
    columns?: string[];
    xKey?: string;
    yKey?: string;
  } | null;
}

function inferKeys(data: Record<string, unknown>[], config: Props['config']) {
  const keys = Object.keys(data[0] || {});
  const xKey = config?.xKey || keys[0] || 'x';
  const dataKeys = (config?.columns || keys).filter(k => k !== xKey && typeof data[0]?.[k] === 'number');
  return { xKey, dataKeys: dataKeys.length ? dataKeys : keys.slice(1) };
}

export default function ChartRenderer({ type, data, config }: Props) {
  if (!data || data.length === 0) return null;

  const { xKey, dataKeys } = inferKeys(data, config);

  const commonProps = {
    data,
    margin: { top: 5, right: 20, left: 0, bottom: 5 },
  };

  if (type === 'table' || !['bar', 'line', 'pie', 'scatter', 'area'].includes(type)) {
    const cols = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {cols.map(c => (
                <th key={c} className="px-3 py-2 text-left font-medium text-gray-600">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.slice(0, 50).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {cols.map(c => (
                  <td key={c} className="px-3 py-2 text-gray-700">{String(row[c] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {dataKeys.length > 1 && <Legend />}
            {dataKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        ) : type === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {dataKeys.length > 1 && <Legend />}
            {dataKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {dataKeys.length > 1 && <Legend />}
            {dataKeys.map((k, i) => (
              <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length] + '22'} strokeWidth={2} />
            ))}
          </AreaChart>
        ) : type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey={dataKeys[0] || 'value'} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis dataKey={dataKeys[0]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Scatter data={data} fill={COLORS[0]} />
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
