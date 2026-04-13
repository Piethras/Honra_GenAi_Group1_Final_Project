import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IF</span>
          </div>
          <span className="font-semibold text-lg text-gray-900">InsightForge</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link href="/auth/register" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-8">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-blue-700 font-medium">AI-Powered Data Analysis</span>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Turn your data into
          <span className="text-blue-600"> instant insights</span>
        </h1>

        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload a CSV or Excel file, ask questions in plain English, and get beautiful charts,
          AI-generated insights, and exportable reports — no coding required.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          <Link href="/auth/register" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-colors text-lg">
            Start for free
          </Link>
          <Link href="/pricing" className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-lg">
            View pricing
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { label: 'Upload CSV/Excel', icon: '📤', desc: 'Drag-and-drop your data files' },
            { label: 'Ask questions', icon: '💬', desc: 'Plain English — no SQL needed' },
            { label: 'Get insights', icon: '📊', desc: 'Charts, trends, and reports' },
          ].map((item) => (
            <div key={item.label} className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-semibold text-gray-900 mb-1">{item.label}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}