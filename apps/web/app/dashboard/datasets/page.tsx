import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Database, Trash2 } from 'lucide-react';
import UploadZone from '@/components/dataset/UploadZone';

async function getDatasets(clerkId: string) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return [];
  return db.dataset.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function DatasetsPage() {
  const { userId } = auth();
  if (!userId) return null;

  const datasets = await getDatasets(userId);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
        <p className="text-gray-500 mt-1">Upload and manage your data files.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Upload new dataset</h2>
        <UploadZone />
      </div>

      {datasets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Your datasets ({datasets.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {datasets.map((ds) => (
              <div key={ds.id} className="flex items-center px-6 py-4 hover:bg-gray-50 group">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mr-4 shrink-0">
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/datasets/${ds.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 text-sm block truncate"
                  >
                    {ds.name}
                  </Link>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {ds.fileType.toUpperCase()} · {ds.fileSizeKb} KB
                    {ds.rowCount && ` · ${ds.rowCount.toLocaleString()} rows`}
                    {ds.columnCount && ` · ${ds.columnCount} columns`}
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium mr-4 ${
                    ds.status === 'READY'
                      ? 'bg-green-50 text-green-700'
                      : ds.status === 'ERROR'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {ds.status.toLowerCase()}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(ds.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
