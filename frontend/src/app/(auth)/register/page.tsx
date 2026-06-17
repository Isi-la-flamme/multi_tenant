// src/app/(auth)/register/page.tsx
'use client';

import { RegisterForm } from '@/components/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tenant SaaS
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Créez votre compte
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}