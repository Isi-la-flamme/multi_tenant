// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

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
          console.log('🔐 Tentative de connexion pour:', credentials?.email);

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
          console.log('📦 Réponse du backend:', JSON.stringify(data, null, 2));

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          // ✅ Structure: { status: "success", data: { user: {...}, tenants: [...], accessToken: "...", refreshToken: "..." } }
          if (data.status === 'success' && data.data) {
            const userData = data.data;
            const user = userData.user;
            
            // Récupérer le tenantId du premier tenant
            const tenantId = userData.tenants && userData.tenants.length > 0 
              ? String(userData.tenants[0].id) 
              : '1';

            // Récupérer le role du premier tenant
            const role = userData.tenants && userData.tenants.length > 0 
              ? userData.tenants[0].role || 'user'
              : 'user';

            console.log('✅ Connexion réussie pour:', user.email);
            console.log('   Tenant ID:', tenantId);
            console.log('   Role:', role);

            return {
              id: String(user.id),
              email: user.email,
              name: user.name,
              tenantId: tenantId,
              role: role,
              accessToken: userData.accessToken,
              refreshToken: userData.refreshToken || '',
              tenants: userData.tenants, // Garder les tenants pour usage futur
            };
          }

          throw new Error('Structure de réponse invalide');

        } catch (error: any) {
          console.error('❌ Auth error:', error.message);
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
        token.id = user.id;
        token.tenants = user.tenants;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.user = {
        ...session.user,
        id: token.id as string,
        tenantId: token.tenantId as string,
        role: token.role as string,
      };
      // Ajouter les tenants à la session
      session.tenants = token.tenants as any[];
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
  debug: true,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };