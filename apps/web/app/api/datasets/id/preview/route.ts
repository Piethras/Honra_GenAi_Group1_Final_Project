import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getSignedUrl } from '@/lib/storage';
import { callAIEngine } from '@/lib/ai';
import { apiError, apiSuccess } from '@/types';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const dataset = await db.dataset.findFirst({ where: { id: params.id, userId: user.id } });
  if (!dataset) return Response.json(apiError('NOT_FOUND', 'Dataset not found'), { status: 404 });

  if (dataset.status !== 'READY') {
    return Response.json(apiError('NOT_READY', 'Dataset is still processing'), { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');

  const fileUrl = await getSignedUrl(dataset.fileUrl);

  const result = await callAIEngine<{ rows: Record<string, unknown>[]; total: number }>(
    '/preview',
    { fileUrl, fileType: dataset.fileType, page, pageSize: 50 }
  );

  return Response.json(apiSuccess({ ...result, schema: dataset.schema }));
}
