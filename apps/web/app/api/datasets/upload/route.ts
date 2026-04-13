import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { uploadFile, getSignedUrl } from '@/lib/storage';
import { callAIEngine } from '@/lib/ai';
import { apiError, apiSuccess } from '@/types';

const MAX_SIZE_FREE = 10 * 1024 * 1024;   // 10 MB
const MAX_SIZE_PRO  = 50 * 1024 * 1024;   // 50 MB
const MAX_SIZE_TEAM = 200 * 1024 * 1024;  // 200 MB

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });
  }

  // Check dataset count for free tier
  if (user.plan === 'FREE') {
    const count = await db.dataset.count({ where: { userId: user.id } });
    if (count >= 2) {
      return Response.json(
        apiError('LIMIT_REACHED', 'Free plan allows 2 datasets. Upgrade to Pro for unlimited.'),
        { status: 429 }
      );
    }
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) {
    return Response.json(apiError('NO_FILE', 'No file provided'), { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel', 'application/json'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|json)$/i)) {
    return Response.json(apiError('INVALID_TYPE', 'Only CSV, Excel, and JSON files are supported'), { status: 400 });
  }

  // Check file size limit
  const maxSize = user.plan === 'TEAM' || user.plan === 'ENTERPRISE' ? MAX_SIZE_TEAM
    : user.plan === 'PRO' ? MAX_SIZE_PRO : MAX_SIZE_FREE;

  if (file.size > maxSize) {
    return Response.json(
      apiError('FILE_TOO_LARGE', `File exceeds the ${maxSize / 1024 / 1024} MB limit for your plan`),
      { status: 413 }
    );
  }

  try {
    const storagePath = await uploadFile(user.id, await file.arrayBuffer() as any, file.name);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'csv';
    const dataset = await db.dataset.create({
      data: {
        name: file.name,
        fileUrl: storagePath,
        fileType: ext,
        fileSizeKb: Math.round(file.size / 1024),
        status: 'PROCESSING',
        userId: user.id,
      },
    });

    // Fire-and-forget: ask the AI engine to process the file
    const fileUrl = await getSignedUrl(storagePath, 3600);
    callAIEngine('/process', {
  datasetId: dataset.id,
  storagePath,
  fileUrl,
  fileType: ext,
  callbackUrl: `${process.env.NEXT_PUBLIC_URL}/api/datasets/${dataset.id}/processed`,
}).catch(console.error);

    return Response.json(apiSuccess({ id: dataset.id, name: dataset.name, status: dataset.status }));
  } catch (err: any) {
    console.error('Upload error:', err);
    return Response.json(apiError('UPLOAD_FAILED', err.message || 'Upload failed'), { status: 500 });
  }
}
