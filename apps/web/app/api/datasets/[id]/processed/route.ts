import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { getSignedUrl } from '@/lib/storage';
import { callAIEngine } from '@/lib/ai';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const secret = headers().get('x-secret');
  if (secret !== process.env.AI_ENGINE_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  const body = await req.json();
  const { status, rowCount, columnCount, schema, insights, error } = body;

  if (status === 'ERROR') {
    await db.dataset.update({
      where: { id: params.id },
      data: { status: 'ERROR' },
    });
    return new Response('OK');
  }

  await db.dataset.update({
    where: { id: params.id },
    data: {
      status: 'READY',
      rowCount,
      columnCount,
      schema,
    },
  });

  if (insights?.length) {
    await db.insight.createMany({
      data: insights.map((ins: any) => ({
        title: ins.title,
        description: ins.description,
        type: ins.type,
        confidence: ins.confidence,
        chartConfig: ins.chartConfig || null,
        datasetId: params.id,
      })),
      skipDuplicates: true,
    });
  }

  return new Response('OK');
}
