// src/components/features/auth/components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { authService } from '@/lib/api/services/auth.service';

// Composants UI simplifiés
const Button = ({ children, ...props }: any) => (
  <button
    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className, ...props }: any) => (
  <input
    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    {...props}
  />
);

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
  tenantName: z.string().min(2, 'Le nom du tenant est requis'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await authService.register(registerData);
      toast.success('Compte créé avec succès !');
      router.push('/login');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nom complet
        </label>
        <Input
          type="text"
          placeholder="Jean Dupont"
          {...register('name')}
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <Input
          type="email"
          placeholder="exemple@email.com"
          {...register('email')}
          className="mt-1"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nom de l'entreprise (Tenant)
        </label>
        <Input
          type="text"
          placeholder="Mon Entreprise"
          {...register('tenantName')}
          className="mt-1"
        />
        {errors.tenantName && (
          <p className="mt-1 text-sm text-red-600">{errors.tenantName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mot de passe
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className="mt-1"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirmer le mot de passe
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          className="mt-1"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Inscription...' : 'S\'inscrire'}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}