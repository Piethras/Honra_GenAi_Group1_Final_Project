import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function POST() {
  const { userId } = auth();
  if (!userId) redirect('/auth/login');

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });

  if (!user?.subscription?.stripeCustomerId) redirect('/dashboard/settings');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings`,
  });

  redirect(session.url);
}
