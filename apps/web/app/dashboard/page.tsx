import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Database, BarChart3, FileText, Zap } from 'lucide-react';

async function getDashboardData(clerkId: string) {
  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      datasets: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      queries: { select: { id: true } },
      reports: { select: { id: true } },
    },
  });
  return user;
}

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) return null;

  const user = await getDashboardData(userId);
  if (!user) return null;

  const stats = [
    { label: 'Datasets', value: user.datasets.length, icon: Database, color: 'bg-blue-50 text-blue-600' },
    { label: 'Queries', value: user.queries.length, icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
    { label: 'Reports', value: user.reports.length, icon: FileText, color: 'bg-green-50 text-green-600' },
    {
      label: 'Queries left',
      value: user.plan === 'FREE' ? Math.max(0, 20 - user.queryCount) : '∞',
      icon: Zap,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your data.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent datasets */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Datasets</h2>
          <Link href="/dashboard/datasets" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {user.datasets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-gray-500 mb-4">No datasets yet. Upload your first CSV or Excel file.</p>
            <Link
              href="/dashboard/datasets"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Upload dataset
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {user.datasets.map((ds: any) => (
              <Link
                key={ds.id}
                href={`/dashboard/datasets/${ds.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-600 text-sm">{ds.name}</div>
                    <div className="text-xs text-gray-400">
                      {ds.rowCount ? `${ds.rowCount.toLocaleString()} rows` : 'Processing...'} · {ds.fileSizeKb} KB
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    ds.status === 'READY'
                      ? 'bg-green-50 text-green-700'
                      : ds.status === 'ERROR'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {ds.status.toLowerCase()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
