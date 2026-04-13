import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import QueryInterface from '@/components/query/QueryInterface';

export default async function QueryPage() {
  const { userId } = auth();
  if (!userId) return null;

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return null;

  const datasets = await db.dataset.findMany({
    where: { userId: user.id, status: 'READY' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, rowCount: true, columnCount: true },
  });

  return (
    <div className="p-8 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Query your data</h1>
        <p className="text-gray-500 mt-1">Ask questions in plain English and get instant answers.</p>
      </div>
      <QueryInterface
        datasets={datasets}
        userPlan={user.plan}
        queryCount={user.queryCount}
      />
    </div>
  );
}
