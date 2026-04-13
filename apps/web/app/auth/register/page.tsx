'use client';
import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="flex justify-center">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
            card: 'shadow-none border border-gray-200',
          },
        }}
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}