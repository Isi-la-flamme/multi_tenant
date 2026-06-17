import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email ou mot de passe incorrect');
        return { success: false, error: result.error };
      }

      toast.success('Connexion réussie');
      router.push('/dashboard/overview');
      router.refresh();
      return { success: true };
    } catch (error) {
      toast.error('Une erreur est survenue');
      return { success: false, error: 'Une erreur est survenue' };
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    toast.success('Déconnexion réussie');
    router.push('/login');
    router.refresh();
  };

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    login,
    logout,
  };
};