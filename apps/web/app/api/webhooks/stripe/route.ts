import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subId = session.subscription as string;
      const sub = await stripe.subscriptions.retrieve(subId);
      const priceId = sub.items.data[0].price.id;

      const plan =
        priceId === process.env.STRIPE_TEAM_PRICE_ID ? 'TEAM'
        : priceId === process.env.STRIPE_PRO_PRICE_ID ? 'PRO'
        : 'FREE';

      await db.user.update({ where: { id: userId }, data: { plan } });
      await db.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubId: subId,
          status: 'active',
          plan,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        update: {
          stripeSubId: subId,
          status: 'active',
          plan,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const record = await db.subscription.findUnique({ where: { stripeSubId: sub.id } });
      if (!record) break;

      const priceId = sub.items.data[0].price.id;
      const plan =
        priceId === process.env.STRIPE_TEAM_PRICE_ID ? 'TEAM'
        : priceId === process.env.STRIPE_PRO_PRICE_ID ? 'PRO'
        : 'FREE';

      await db.subscription.update({
        where: { stripeSubId: sub.id },
        data: { status: sub.status, plan, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
      });
      await db.user.update({ where: { id: record.userId }, data: { plan } });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const record = await db.subscription.findUnique({ where: { stripeSubId: sub.id } });
      if (!record) break;

      await db.subscription.update({
        where: { stripeSubId: sub.id },
        data: { status: 'canceled', plan: 'FREE' },
      });
      await db.user.update({ where: { id: record.userId }, data: { plan: 'FREE' } });
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
