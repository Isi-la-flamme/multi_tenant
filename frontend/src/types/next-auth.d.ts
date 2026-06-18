// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    tenants?: any[];
    user: {
      id: string;
      tenantId: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    tenantId: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    tenants?: any[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    tenantId?: string;
    role?: string;
    id?: string;
    tenants?: any[];
  }
}