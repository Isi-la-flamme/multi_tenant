import { NextResponse } from 'next/server';
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
