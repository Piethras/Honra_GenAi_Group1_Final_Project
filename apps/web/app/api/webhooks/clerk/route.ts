import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const { type, data } = evt;

  if (type === 'user.created') {
    const email = data.email_addresses[0]?.email_address;
    if (!email) return new Response('No email', { status: 400 });

    const stripeCustomer = await stripe.customers.create({
      email,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
      metadata: { clerkId: data.id },
    });

    await db.user.create({
      data: {
        clerkId: data.id,
        email,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
        avatarUrl: data.image_url || null,
        subscription: {
          create: {
            stripeCustomerId: stripeCustomer.id,
            status: 'active',
            plan: 'FREE',
          },
        },
      },
    });
  }

  if (type === 'user.updated') {
    const email = data.email_addresses[0]?.email_address;
    await db.user.update({
      where: { clerkId: data.id },
      data: {
        email: email || undefined,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
        avatarUrl: data.image_url || null,
      },
    });
  }

  if (type === 'user.deleted') {
    await db.user.delete({ where: { clerkId: data.id } }).catch(() => {});
  }

  if (type === 'organization.created') {
    await db.organization.create({
      data: {
        clerkOrgId: data.id,
        name: data.name,
      },
    });
  }

  if (type === 'organizationMembership.created') {
    const user = await db.user.findUnique({ where: { clerkId: data.public_user_data.user_id } });
    const org = await db.organization.findUnique({ where: { clerkOrgId: data.organization.id } });
    if (user && org) {
      await db.orgMember.upsert({
        where: { userId_orgId: { userId: user.id, orgId: org.id } },
        create: { userId: user.id, orgId: org.id, role: data.role === 'org:admin' ? 'ADMIN' : 'ANALYST' },
        update: { role: data.role === 'org:admin' ? 'ADMIN' : 'ANALYST' },
      });
    }
  }

  return new Response('OK', { status: 200 });
}
