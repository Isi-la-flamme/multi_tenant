#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de création de l'arborescence du frontend Next.js
Auteur: Tenant SaaS
Usage: python create-frontend-structure.py
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Couleurs pour l'affichage (ANSI)
class Colors:
    GREEN = '\033[32m'
    BLUE = '\033[34m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    NC = '\033[0m'  # No Color

def log(message):
    """Affiche un message d'information"""
    print(f"{Colors.BLUE}➜ {Colors.NC}{message}")

def success(message):
    """Affiche un message de succès"""
    print(f"{Colors.GREEN}✓ {Colors.NC}{message}")

def error(message):
    """Affiche un message d'erreur"""
    print(f"{Colors.RED}✗ {Colors.NC}{message}")

def warning(message):
    """Affiche un message d'avertissement"""
    print(f"{Colors.YELLOW}⚠ {Colors.NC}{message}")

def run_command(command, silent=True):
    """Exécute une commande shell"""
    try:
        if not silent:
            subprocess.run(command, shell=True, check=True)
            return True, ""
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def create_directory(path):
    """Crée un répertoire de manière récursive"""
    Path(path).mkdir(parents=True, exist_ok=True)

def create_file(path, content):
    """Crée un fichier avec son contenu"""
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    """Fonction principale"""
    print(f"{Colors.CYAN}🚀 Création de la structure du frontend Tenant SaaS...{Colors.NC}\n")
    
    # Vérification de l'existence du dossier frontend
    if os.path.exists("frontend"):
        warning("Le dossier 'frontend' existe déjà. Voulez-vous le supprimer ? (O/N)")
        response = input().strip().lower()
        if response in ['o', 'oui']:
            shutil.rmtree("frontend")
            log("Dossier frontend supprimé")
        else:
            error("Arrêt du script")
            sys.exit(1)
    
    # Création du projet Next.js avec TypeScript
    log("Création du projet Next.js...")
    success_flag, output = run_command(
        "npx create-next-app@latest frontend --typescript --tailwind --app --eslint --use-npm --src-dir",
        silent=False
    )
    
    if not success_flag:
        error(f"Erreur lors de la création du projet Next.js: {output}")
        sys.exit(1)
    
    # Changer le répertoire de travail
    os.chdir("frontend")
    
    # Installation des dépendances principales
    log("Installation des dépendances principales...")
    dependencies = [
        "next-auth",
        "axios",
        "@tanstack/react-query",
        "@tanstack/react-query-devtools",
        "@tanstack/react-table",
        "zustand",
        "react-hook-form",
        "@hookform/resolvers",
        "zod",
        "sonner",
        "lucide-react",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "date-fns",
        "react-dropzone"
    ]
    
    install_cmd = f"npm install {' '.join(dependencies)}"
    success_flag, output = run_command(install_cmd, silent=False)
    if not success_flag:
        error(f"Erreur lors de l'installation des dépendances: {output}")
        sys.exit(1)
    
    # Dépendances de développement
    dev_dependencies = [
        "@types/node",
        "@types/react",
        "@types/react-dom",
        "prettier",
        "eslint-config-prettier"
    ]
    install_cmd = f"npm install -D {' '.join(dev_dependencies)}"
    success_flag, output = run_command(install_cmd, silent=False)
    if not success_flag:
        error(f"Erreur lors de l'installation des dépendances de développement: {output}")
        sys.exit(1)
    
    success("Dépendances installées avec succès")
    
    # Création de la structure de dossiers
    log("Création de la structure de dossiers...")
    
    # Structure de l'App Router
    app_paths = [
        "src/app/(auth)/login",
        "src/app/(auth)/register",
        "src/app/(dashboard)/dashboard/overview",
        "src/app/(dashboard)/dashboard/products/create",
        "src/app/(dashboard)/dashboard/products/[id]/edit",
        "src/app/(dashboard)/dashboard/credits/clients/[clientId]",
        "src/app/(dashboard)/dashboard/invoices/create",
        "src/app/(dashboard)/dashboard/invoices/[id]/pdf",
        "src/app/(dashboard)/dashboard/wallet",
        "src/app/(dashboard)/dashboard/profile",
        "src/app/api/auth/[...nextauth]"
    ]
    
    for path in app_paths:
        create_directory(path)
    
    # Structure des composants
    component_paths = [
        "src/components/ui",
        "src/components/shared/sidebar",
        "src/components/shared/header",
        "src/components/shared/layout",
        "src/components/features/auth/components",
        "src/components/features/auth/hooks",
        "src/components/features/dashboard/components",
        "src/components/features/dashboard/hooks",
        "src/components/features/products/components",
        "src/components/features/products/hooks",
        "src/components/features/credits/components",
        "src/components/features/credits/hooks",
        "src/components/features/invoices/components",
        "src/components/features/invoices/hooks"
    ]
    
    for path in component_paths:
        create_directory(path)
    
    # Structure de la librairie
    lib_paths = [
        "src/lib/api/services",
        "src/lib/store",
        "src/lib/hooks",
        "src/lib/utils"
    ]
    
    for path in lib_paths:
        create_directory(path)
    
    # Structure des types
    create_directory("src/types")
    
    # Dossiers publics
    public_paths = [
        "public/images",
        "public/fonts",
        "public/uploads"
    ]
    
    for path in public_paths:
        create_directory(path)
    
    # Dossiers de tests
    test_paths = [
        "tests/unit",
        "tests/integration",
        "tests/e2e"
    ]
    
    for path in test_paths:
        create_directory(path)
    
    success("Structure de dossiers créée avec succès")
    
    # Création des fichiers de base
    log("Création des fichiers de base...")
    
    # 1. middleware.ts
    middleware_content = '''import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // 🔐 Routes protégées
  if (!token && pathname.startsWith('/dashboard')) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // 🔄 Redirection si déjà connecté
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url));
  }

  // 🏢 Injection du tenantId dans les headers
  const requestHeaders = new Headers(request.headers);
  if (token?.tenantId) {
    requestHeaders.set('x-tenant-id', token.tenantId as string);
  }

  // 👤 Injection du userId
  if (token?.sub) {
    requestHeaders.set('x-user-id', token.sub);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 📊 Cookie tenantId pour le client
  if (token?.tenantId) {
    response.cookies.set('tenant-id', token.tenantId as string, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/login',
    '/register',
    '/profile',
  ],
};
'''
    create_file("middleware.ts", middleware_content)
    success("middleware.ts créé")
    
    # 2. .env.local
    env_content = '''# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:5000/uploads

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_super_securise_a_changer

# JWT (pour décoder le token côté frontend)
NEXT_PUBLIC_JWT_SECRET=votre_jwt_secret_a_changer

# Environnement
NODE_ENV=development
'''
    create_file(".env.local", env_content)
    success(".env.local créé")
    
    # 3. src/app/(auth)/login/page.tsx
    login_page = ''''use client';

import { LoginForm } from '@/components/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tenant SaaS
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connectez-vous à votre compte
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
'''
    create_file("src/app/(auth)/login/page.tsx", login_page)
    success("src/app/(auth)/login/page.tsx créé")
    
    # 4. src/app/(auth)/register/page.tsx
    register_page = ''''use client';

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
'''
    create_file("src/app/(auth)/register/page.tsx", register_page)
    success("src/app/(auth)/register/page.tsx créé")
    
    # 5. src/app/(dashboard)/layout.tsx
    dashboard_layout = ''''use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/sidebar';
import Header from '@/components/shared/header';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
'''
    create_file("src/app/(dashboard)/layout.tsx", dashboard_layout)
    success("src/app/(dashboard)/layout.tsx créé")
    
    # 6. src/app/(dashboard)/page.tsx
    dashboard_page = '''import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/dashboard/overview');
}
'''
    create_file("src/app/(dashboard)/page.tsx", dashboard_page)
    success("src/app/(dashboard)/page.tsx créé")
    
    # 7. src/app/layout.tsx (root)
    root_layout = '''import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tenant SaaS',
  description: 'Application SaaS multi-tenant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
'''
    create_file("src/app/layout.tsx", root_layout)
    success("src/app/layout.tsx créé")
    
    # 8. src/app/providers.tsx
    providers = ''''use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
'''
    create_file("src/app/providers.tsx", providers)
    success("src/app/providers.tsx créé")
    
    # 9. src/types/auth.types.ts
    auth_types = '''export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  tenantName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}
'''
    create_file("src/types/auth.types.ts", auth_types)
    success("src/types/auth.types.ts créé")
    
    # 10. src/lib/api/client.ts
    api_client = '''import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔑 Intercepteur pour ajouter le token
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Intercepteur pour rafraîchir le token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const session = await getSession();
        const refreshToken = session?.refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await signOut({ callbackUrl: '/login' });
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
'''
    create_file("src/lib/api/client.ts", api_client)
    success("src/lib/api/client.ts créé")
    
    # 11. src/components/features/auth/components/LoginForm.tsx
    login_form = ''''use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email ou mot de passe incorrect');
      } else {
        toast.success('Connexion réussie !');
        router.push('/dashboard/overview');
        router.refresh();
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-primary hover:underline">
          S'inscrire
        </Link>
      </p>
    </form>
  );
}
'''
    create_file("src/components/features/auth/components/LoginForm.tsx", login_form)
    success("src/components/features/auth/components/LoginForm.tsx créé")
    
    # 12. src/components/shared/sidebar/index.tsx
    sidebar = ''''use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  FileText, 
  Wallet,
  User,
} from 'lucide-react';

const navItems = [
  { name: 'Tableau de bord', href: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Produits', href: '/dashboard/products', icon: Package },
  { name: 'Crédits clients', href: '/dashboard/credits', icon: CreditCard },
  { name: 'Factures', href: '/dashboard/invoices', icon: FileText },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Profil', href: '/dashboard/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r bg-white dark:bg-gray-800">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">Tenant SaaS</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
'''
    create_file("src/components/shared/sidebar/index.tsx", sidebar)
    success("src/components/shared/sidebar/index.tsx créé")
    
    # 13. src/components/shared/header/index.tsx
    header = ''''use client';

import { signOut, useSession } from 'next-auth/react';
import { LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success('Déconnexion réussie');
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {session?.user?.name || 'Utilisateur'}
        </h2>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {session?.user?.tenantId || 'Tenant'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
'''
    create_file("src/components/shared/header/index.tsx", header)
    success("src/components/shared/header/index.tsx créé")
    
    # 14. src/app/api/auth/[...nextauth]/route.ts
    nextauth_route = '''import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials?.email,
                password: credentials?.password,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            tenantId: data.user.tenantId,
            role: data.user.role,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.tenantId = user.tenantId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.user.tenantId = token.tenantId as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
'''
    create_file("src/app/api/auth/[...nextauth]/route.ts", nextauth_route)
    success("src/app/api/auth/[...nextauth]/route.ts créé")
    
    # 15. package.json update avec scripts
    log("Mise à jour de package.json...")
    # Lecture du package.json existant
    import json
    with open('package.json', 'r', encoding='utf-8') as f:
        package_json = json.load(f)
    
    # Ajout des scripts si nécessaire
    if 'scripts' in package_json:
        package_json['scripts']['dev'] = 'next dev'
        package_json['scripts']['build'] = 'next build'
        package_json['scripts']['start'] = 'next start'
        package_json['scripts']['lint'] = 'next lint'
        package_json['scripts']['format'] = 'prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}"'
    
    with open('package.json', 'w', encoding='utf-8') as f:
        json.dump(package_json, f, indent=2, ensure_ascii=False)
    success("package.json mis à jour")
    
    print("\n" + "="*50)
    success("🎉 Structure du frontend créée avec succès !")
    print("="*50)
    print(f"\n{Colors.CYAN}📁 Pour démarrer le projet :{Colors.NC}")
    print("  cd frontend")
    print("  npm run dev")
    print(f"\n{Colors.CYAN}🌐 Accès :{Colors.NC}")
    print("  http://localhost:3000")
    print(f"\n{Colors.CYAN}📚 Documentation :{Colors.NC}")
    print("  - Structure: src/")
    print("  - Composants: src/components/")
    print("  - API: src/lib/api/")
    print("  - Types: src/types/")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n" + Colors.YELLOW + "⚠ Script interrompu par l'utilisateur" + Colors.NC)
        sys.exit(0)
    except Exception as e:
        error(f"Erreur inattendue: {str(e)}")
        sys.exit(1)