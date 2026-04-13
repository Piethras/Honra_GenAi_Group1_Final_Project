import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { apiError } from '@/types';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const { queryIds, insightIds, title } = await req.json();

  const [queries, insights] = await Promise.all([
    queryIds?.length
      ? db.query.findMany({ where: { id: { in: queryIds }, userId: user.id } })
      : Promise.resolve([]),
    insightIds?.length
      ? db.insight.findMany({ where: { id: { in: insightIds } } })
      : Promise.resolve([]),
  ]);

  const wb = XLSX.utils.book_new();

  // Queries sheet
  if (queries.length > 0) {
    const queryRows = queries.map(q => ({
      Question: q.questionText,
      Answer: q.answerText || '',
      Status: q.status,
      'Duration (ms)': q.durationMs || '',
      Date: new Date(q.createdAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(queryRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Queries');
  }

  // Insights sheet
  if (insights.length > 0) {
    const insightRows = insights.map(i => ({
      Title: i.title,
      Description: i.description,
      Type: i.type,
      Confidence: i.confidence,
      Date: new Date(i.createdAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(insightRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Insights');
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Save report record
  await db.report.create({
    data: {
      title: title || 'Analysis Report',
      format: 'xlsx',
      userId: user.id,
      content: { queryIds, insightIds },
    },
  });

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${(title || 'report').replace(/[^a-z0-9]/gi, '_')}.xlsx"`,
    },
  });
}
