import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getSignedUrl } from '@/lib/storage';
import { apiError, apiSuccess } from '@/types';

// GET /api/datasets/[id] — fetch dataset metadata
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const dataset = await db.dataset.findFirst({
    where: { id: params.id, userId: user.id },
    include: { insights: true },
  });

  if (!dataset) return Response.json(apiError('NOT_FOUND', 'Dataset not found'), { status: 404 });

  return Response.json(apiSuccess(dataset));
}

// DELETE /api/datasets/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const dataset = await db.dataset.findFirst({ where: { id: params.id, userId: user.id } });
  if (!dataset) return Response.json(apiError('NOT_FOUND', 'Dataset not found'), { status: 404 });

  await db.dataset.delete({ where: { id: dataset.id } });
  return Response.json(apiSuccess({ deleted: true }));
}
