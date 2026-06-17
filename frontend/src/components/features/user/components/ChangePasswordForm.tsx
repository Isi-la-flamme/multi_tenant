// src/components/features/user/components/ChangePasswordForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChangePassword } from '../hooks/useUser';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string()
    .min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data);
      reset(); // Réinitialiser le formulaire
    } catch (error) {
      // Erreur déjà gérée par le hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer le mot de passe</CardTitle>
        <CardDescription>
          Mettez à jour votre mot de passe pour sécuriser votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
              {...register('currentPassword')}
              disabled={changePassword.isPending}
            />
            {errors.currentPassword && (
              <p className="text-sm text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              {...register('newPassword')}
              disabled={changePassword.isPending}
            />
            {errors.newPassword && (
              <p className="text-sm text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={changePassword.isPending}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={changePassword.isPending || !isDirty}
          >
            {changePassword.isPending ? 'Changement en cours...' : 'Changer le mot de passe'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un chiffre.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}