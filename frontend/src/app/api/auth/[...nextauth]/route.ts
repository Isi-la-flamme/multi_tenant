// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
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
          const AUTH_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

          const response = await fetch(`${AUTH_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-tenant-subdomain': 'demo' 
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          const userData = data.status === 'success' ? data.data : data;
          const user = userData.user;

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            tenantId: userData.tenants?.[0]?.subdomain || 'demo',
            role: user.role || 'user',
            accessToken: userData.accessToken,
            refreshToken: userData.refreshToken || '',
          };
        } catch (error: any) {
          console.error('Auth error:', error.message);
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
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.user = {
        ...session.user,
        id: token.id as string,
        tenantId: token.tenantId as string,
        role: token.role as string,
      };
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