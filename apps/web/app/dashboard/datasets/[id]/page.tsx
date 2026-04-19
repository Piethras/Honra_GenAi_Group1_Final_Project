import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Database } from 'lucide-react';
import DatasetTabs from '@/components/dataset/DatasetTabs';

interface Props {
  params: { id: string };
}

export default async function DatasetDetailPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return null;

  const dataset = await db.dataset.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      insights: { orderBy: { createdAt: 'asc' } },
      queries: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!dataset) notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/dashboard/datasets"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to datasets
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{dataset.name}</h1>
            <p className="text-sm text-gray-500">
              {dataset.fileType.toUpperCase()} · {dataset.fileSizeKb} KB
              {dataset.rowCount && ` · ${dataset.rowCount.toLocaleString()} rows`}
              {dataset.columnCount && ` · ${dataset.columnCount} columns`}
            </p>
          </div>
          <span
            className={`ml-auto text-xs px-3 py-1.5 rounded-full font-medium ${
              dataset.status === 'READY'
                ? 'bg-green-50 text-green-700'
                : dataset.status === 'ERROR'
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {dataset.status.toLowerCase()}
          </span>
        </div>
      </div>

      <DatasetTabs
        dataset={dataset as any}
        userId={user.id}
        userPlan={user.plan}
        queryCount={user.queryCount}
      />
    </div>
  );
}