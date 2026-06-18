import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email et mot de passe requis');
          }

          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;

          console.log('🔐 Tentative de connexion:', credentials.email);
          console.log('🌍 API URL:', apiUrl);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const rawResponse = await response.text();

          console.log('📦 Réponse brute backend:', rawResponse);

          let data;

          try {
            data = JSON.parse(rawResponse);
          } catch {
            throw new Error(
              `Réponse backend invalide (non JSON): ${rawResponse}`
            );
          }

          console.log(
            '📦 Réponse backend JSON:',
            JSON.stringify(data, null, 2)
          );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                data?.error ||
                `Erreur HTTP ${response.status}`
            );
          }

          if (
            data.status !== 'success' ||
            !data.data ||
            !data.data.user
          ) {
            throw new Error('Structure de réponse invalide');
          }

          const userData = data.data;
          const user = userData.user;

          const tenantId =
            userData.tenants?.length > 0
              ? String(userData.tenants[0].id)
              : '1';

          const role =
            userData.tenants?.length > 0
              ? userData.tenants[0].role || 'user'
              : 'user';

          console.log('✅ Connexion réussie');
          console.log('👤 User:', user.email);
          console.log('🏢 Tenant:', tenantId);
          console.log('🔑 Role:', role);

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            tenantId,
            role,
            accessToken: userData.accessToken,
            refreshToken: userData.refreshToken || '',
            tenants: userData.tenants || [],
          };
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
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.tenants = user.tenants;
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        role: token.role as string,
        tenantId: token.tenantId as string,
      };

      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.tenants = token.tenants as any[];

      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };