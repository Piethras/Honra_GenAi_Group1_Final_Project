import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getSignedUrl } from '@/lib/storage';
import { callAIEngine } from '@/lib/ai';
import { apiError, apiSuccess } from '@/types';
import type { QueryResult } from '@/types';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  // Enforce query quota for free plan
  if (user.plan === 'FREE') {
    const now = new Date();
    const resetAt = new Date(user.queryResetAt);
    // Reset counter monthly
    if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
      await db.user.update({ where: { id: user.id }, data: { queryCount: 0, queryResetAt: now } });
      user.queryCount = 0;
    }
    if (user.queryCount >= 20) {
      return Response.json(
        apiError('QUOTA_EXCEEDED', 'Monthly query limit reached. Upgrade to Pro for unlimited queries.'),
        { status: 429 }
      );
    }
  }

  let body: { question: string; datasetId: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(apiError('INVALID_BODY', 'Invalid JSON body'), { status: 400 });
  }

  const { question, datasetId } = body;
  if (!question?.trim() || !datasetId) {
    return Response.json(apiError('MISSING_FIELDS', 'question and datasetId are required'), { status: 400 });
  }

  const dataset = await db.dataset.findFirst({
    where: { id: datasetId, userId: user.id, status: 'READY' },
  });

  if (!dataset) {
    return Response.json(apiError('DATASET_NOT_FOUND', 'Dataset not found or not ready'), { status: 404 });
  }

  // Create pending query record
  const queryRecord = await db.query.create({
    data: {
      questionText: question,
      status: 'RUNNING',
      userId: user.id,
      datasetId,
    },
  });

  const startMs = Date.now();

  try {
    const fileUrl = await getSignedUrl(dataset.fileUrl, 3600);

    const result = await callAIEngine<QueryResult>('/query', {
      question,
      datasetId,
      schema: dataset.schema,
      fileUrl,
      fileType: dataset.fileType,
    });

    const durationMs = Date.now() - startMs;

    await db.query.update({
      where: { id: queryRecord.id },
      data: {
        status: 'SUCCESS',
        generatedCode: result.generatedCode,
        resultJson: { data: result.data } as any,
        chartConfig: result.chartConfig,
        answerText: result.answer,
        durationMs,
      },
    });

    await db.user.update({
      where: { id: user.id },
      data: { queryCount: { increment: 1 } },
    });

    return Response.json(apiSuccess({ ...result, queryId: queryRecord.id, durationMs }));
  } catch (err: any) {
    await db.query.update({
      where: { id: queryRecord.id },
      data: { status: 'ERROR', errorMessage: err.message },
    });
    console.error('Query error:', err);
    return Response.json(apiError('QUERY_FAILED', err.message || 'Query failed'), { status: 500 });
  }
}

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const { searchParams } = new URL(req.url);
  const datasetId = searchParams.get('datasetId');

  const queries = await db.query.findMany({
    where: { userId: user.id, ...(datasetId ? { datasetId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true, questionText: true, status: true, answerText: true,
      chartConfig: true, createdAt: true, durationMs: true,
    },
  });

  return Response.json(apiSuccess(queries));
}
