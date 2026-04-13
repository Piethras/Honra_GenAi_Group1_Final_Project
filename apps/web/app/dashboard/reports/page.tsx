import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { FileText, Download } from 'lucide-react';

export default async function ReportsPage() {
  const { userId } = auth();
  if (!userId) return null;

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return null;

  const reports = await db.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Your exported analysis reports.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 mb-2">No reports yet.</p>
          <p className="text-sm text-gray-400">
            Open a dataset, run some queries, then export a PDF or Excel report.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center px-6 py-4 hover:bg-gray-50">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{report.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {report.format.toUpperCase()} · {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {report.exportUrl && (
                  <a
                    href={report.exportUrl}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
