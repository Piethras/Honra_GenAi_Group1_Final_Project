'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { PLANS } from '@/lib/stripe';

interface Props {
  currentPlan: string;
}

export default function PricingCards({ currentPlan }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const checkout = async (plan: 'PRO' | 'TEAM') => {
    setLoading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(['PRO', 'TEAM'] as const).map(plan => {
        const p = PLANS[plan];
        const isCurrent = currentPlan === plan;
        return (
          <div
            key={plan}
            className={`bg-white border rounded-xl p-6 ${plan === 'PRO' ? 'border-blue-200' : 'border-gray-200'}`}
          >
            {plan === 'PRO' && (
              <div className="inline-block text-xs bg-blue-600 text-white px-2.5 py-1 rounded-full font-medium mb-3">
                Most popular
              </div>
            )}
            <h3 className="font-bold text-gray-900 text-lg">{p.name}</h3>
            <div className="flex items-baseline gap-1 mt-1 mb-4">
              <span className="text-3xl font-bold text-gray-900">${p.price}</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => checkout(plan)}
              disabled={isCurrent || !!loading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isCurrent
                  ? 'bg-gray-100 text-gray-400 cursor-default'
                  : plan === 'PRO'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {loading === plan && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCurrent ? 'Current plan' : `Upgrade to ${p.name}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}
