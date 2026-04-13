import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const PLANS = {
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 15,
    features: [
      'Unlimited datasets',
      'Unlimited queries',
      '50 MB file uploads',
      'Unlimited report exports',
      'Priority email support',
    ],
  },
  TEAM: {
    name: 'Team',
    priceId: process.env.STRIPE_TEAM_PRICE_ID!,
    price: 49,
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      '200 MB file uploads',
      'Organization workspace',
      'Role-based access control',
      'Audit logs (90 days)',
    ],
  },
} as const;
