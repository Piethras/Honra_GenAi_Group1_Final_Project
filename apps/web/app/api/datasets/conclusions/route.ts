import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { callAIEngine } from '@/lib/ai';
import { getSignedUrl } from '@/lib/storage';
import { apiError, apiSuccess } from '@/types';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const { datasetId, edaSummary, modelResults, cleaningSummary } = await req.json();

  const dataset = await db.dataset.findFirst({
    where: { id: datasetId, userId: user.id },
    include: {
      queries: {
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });

  if (!dataset) return Response.json(apiError('NOT_FOUND', 'Dataset not found'), { status: 404 });

  const fileUrl = await getSignedUrl(dataset.fileUrl, 3600);

  const result = await callAIEngine('/conclusions/generate', {
    fileUrl,
    fileType: dataset.fileType,
    datasetName: dataset.name,
    edaSummary: edaSummary || null,
    modelResults: modelResults || null,
    cleaningSummary: cleaningSummary || null,
    topQueries: dataset.queries.map(q => ({
      questionText: q.questionText,
      answerText: q.answerText,
    })),
  });

  return Response.json(apiSuccess(result));
}