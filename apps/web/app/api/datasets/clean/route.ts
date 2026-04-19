import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { callAIEngine } from '@/lib/ai';
import { getSignedUrl, uploadFile } from '@/lib/storage';
import { apiError, apiSuccess } from '@/types';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const body = await req.json();
  const { datasetId, operations } = body;

  const dataset = await db.dataset.findFirst({
    where: { id: datasetId, userId: user.id },
  });

  if (!dataset) return Response.json(apiError('NOT_FOUND', 'Dataset not found'), { status: 404 });

  const fileUrl = await getSignedUrl(dataset.fileUrl, 3600);

  if (action === 'profile') {
    const result = await callAIEngine('/clean/profile', {
      fileUrl,
      fileType: dataset.fileType,
    });
    return Response.json(apiSuccess(result));
  }

  if (action === 'suggest') {
    const result = await callAIEngine('/clean/suggest', {
      fileUrl,
      fileType: dataset.fileType,
    });
    return Response.json(apiSuccess(result));
  }

  if (action === 'apply') {
    const result: any = await callAIEngine('/clean/apply', {
      fileUrl,
      fileType: dataset.fileType,
      schema: dataset.schema,
      operations,
    });

    // Save cleaned CSV as new dataset
    const csvBuffer = Buffer.from(result.csvContent, 'utf-8');
    const cleanedName = `${dataset.name.replace(/\.[^.]+$/, '')}_cleaned.csv`;
    const storagePath = await uploadFile(user.id, csvBuffer, cleanedName);

    const newDataset = await db.dataset.create({
      data: {
        name: cleanedName,
        fileUrl: storagePath,
        fileType: 'csv',
        fileSizeKb: Math.round(csvBuffer.length / 1024),
        rowCount: result.finalRows,
        columnCount: result.columns.length,
        schema: result.schema,
        status: 'READY',
        userId: user.id,
      },
    });

    return Response.json(apiSuccess({
      ...result,
      newDatasetId: newDataset.id,
      newDatasetName: cleanedName,
    }));
  }

  return Response.json(apiError('INVALID_ACTION', 'Invalid action'), { status: 400 });
}