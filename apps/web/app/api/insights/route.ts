import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getSignedUrl } from '@/lib/storage';
import { callAIEngine } from '@/lib/ai';
import { apiError, apiSuccess } from '@/types';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const { datasetId } = await req.json();

  const dataset = await db.dataset.findFirst({
    where: { id: datasetId, userId: user.id, status: 'READY' },
  });
  if (!dataset) return Response.json(apiError('NOT_FOUND', 'Dataset not found'), { status: 404 });

  const fileUrl = await getSignedUrl(dataset.fileUrl);

  const result = await callAIEngine<{ insights: any[] }>('/insights', {
    datasetId,
    fileUrl,
    fileType: dataset.fileType,
  });

  // Replace existing insights
  await db.insight.deleteMany({ where: { datasetId } });
  const created = await db.insight.createMany({
    data: result.insights.map((ins: any) => ({
      title: ins.title,
      description: ins.description,
      type: ins.type,
      confidence: ins.confidence,
      chartConfig: ins.chartConfig || null,
      datasetId,
    })),
  });

  const insights = await db.insight.findMany({ where: { datasetId } });
  return Response.json(apiSuccess(insights));
}
