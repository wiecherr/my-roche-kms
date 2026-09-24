import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const sessionRole = request.cookies.get('sso_session_role')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login';
  const isStaticFile = pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/api');

  // Skip middleware execution for static files, API routes, and Next.js internal assets
  if (isStaticFile) {
    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // CALLBACK MODE 1 (useDashboardCallback = true in MainFunc.go):
  // PingFederate redirects to /dashboard?code=...&state=...
  // Forward the request to the Go backend callback handler which exchanges the
  // code for tokens, sets the access_token cookie, and redirects back to /dashboard.
  //
  // This intercept is a no-op in Mode 2: PingFederate never sends ?code= to /dashboard.
  // ---------------------------------------------------------------------------
  if (pathname === '/dashboard' && request.nextUrl.searchParams.has('code')) {
    const goCallbackURL = new URL('http://localhost:3010/api/auth/callback');
    goCallbackURL.search = request.nextUrl.search; // forward ?code=...&state=...
    return NextResponse.redirect(goCallbackURL);
  }

  // DEVELOPMENT: Skip authentication in dev mode (set SKIP_AUTH=true in .env.local)
  // But still apply redirects for "/" and "/login"
   //const skipAuth = process.env.SKIP_AUTH === 'true';
  const skipAuth = false;
  if (skipAuth) {
    // Redirect "/" to "/dashboard" even in skip-auth mode
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Redirect authenticated users away from login page
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 1. Unauthenticated users: redirect to /login if trying to access protected routes or "/"
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // User-role sessions have no GUI access until their dedicated experience is ready.
  if (token && sessionRole === 'user' && pathname !== '/work-in-progress') {
    return NextResponse.redirect(new URL('/work-in-progress', request.url));
  }

  // 2. Authenticated users: redirect to /dashboard if visiting /login or root "/"
  if (token && (isAuthPage || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};