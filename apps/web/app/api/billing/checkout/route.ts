import { auth } from '@clerk/nextjs/server';
import { stripe, PLANS } from '@/lib/stripe';
import { db } from '@/lib/db';
import { apiError } from '@/types';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return Response.json(apiError('UNAUTHORIZED', 'Not authenticated'), { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });
  if (!user) return Response.json(apiError('USER_NOT_FOUND', 'User not found'), { status: 404 });

  const { plan } = await req.json() as { plan: 'PRO' | 'TEAM' };
  if (!PLANS[plan]) return Response.json(apiError('INVALID_PLAN', 'Invalid plan'), { status: 400 });

  const session = await stripe.checkout.sessions.create({
    customer: user.subscription?.stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId: user.id },
  });

  return Response.json({ url: session.url });
}
