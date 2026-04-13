import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import PricingCards from '@/components/PricingCards';

export default async function SettingsPage() {
  const { userId } = auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });
  if (!user) return null;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and subscription.</p>
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="text-gray-900">{user.name || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current plan</span>
            <span className="font-medium text-blue-600">{user.plan}</span>
          </div>
          {user.plan === 'FREE' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Queries used this month</span>
              <span className="text-gray-900">{user.queryCount} / 20</span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade section */}
      {(user.plan === 'FREE' || user.plan === 'PRO') && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Upgrade your plan</h2>
          <PricingCards currentPlan={user.plan} />
        </div>
      )}

      {/* Manage subscription */}
      {user.subscription && user.plan !== 'FREE' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Subscription</h2>
          <p className="text-sm text-gray-500 mb-4">
            Manage your billing, invoices, and payment method.
          </p>
          <form action="/api/billing/portal" method="POST">
            <button
              type="submit"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Open billing portal
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
