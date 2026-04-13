import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying InsightForge.',
    features: [
      '2 datasets',
      '20 queries / month',
      '10 MB file uploads',
      '3 report exports / month',
      'Community support',
    ],
    cta: 'Get started free',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 15,
    description: 'For individuals who need unlimited power.',
    features: [
      'Unlimited datasets',
      'Unlimited queries',
      '50 MB file uploads',
      'Unlimited report exports',
      'Priority email support',
    ],
    cta: 'Start Pro',
    href: '/auth/register',
    highlight: true,
  },
  {
    name: 'Team',
    price: 49,
    description: 'For schools, businesses, and teams.',
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      '200 MB file uploads',
      'Organization workspace',
      'Role-based access control',
      'Audit logs (90 days)',
      'API access',
    ],
    cta: 'Start Team',
    href: '/auth/register',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IF</span>
          </div>
          <span className="font-semibold text-gray-900">InsightForge</span>
        </Link>
        <Link
          href="/auth/login"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Sign in
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-500">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl p-8 border ${
                plan.highlight ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
              }`}
            >
              {plan.highlight && (
                <div className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium mb-4">
                  Most popular
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mt-2 mb-2">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                {plan.price > 0 && <span className="text-gray-400">/month</span>}
              </div>
              <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
              <Link
                href={plan.href}
                className={`block w-full text-center py-2.5 rounded-xl text-sm font-medium transition-colors mb-6 ${
                  plan.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </Link>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          All plans include AES-256 encryption, TLS 1.3, and GDPR-compliant data handling.
        </p>
      </div>
    </div>
  );
}
