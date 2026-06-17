// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      tenantId: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    tenantId: string;
    role: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    tenantId?: string;
    role?: string;
  }
}