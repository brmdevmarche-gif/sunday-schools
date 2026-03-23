import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";
import crypto from "node:crypto";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle locale-prefixed URLs (redirect to base URL with cookie)
  if (pathname.startsWith('/ar') || pathname.startsWith('/en')) {
    const locale = pathname.startsWith('/ar') ? 'ar' : 'en';
    const newPathname = pathname.replace(/^\/(ar|en)/, '') || '/';

    const url = request.nextUrl.clone();
    url.pathname = newPathname;

    const response = NextResponse.redirect(url);
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    });

    return response;
  }

  // Avoid hitting Supabase on public pages like /login.
  // This prevents noisy retries and long delays when Supabase is unreachable/misconfigured.
  const shouldHandleSupabaseSession =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/store") ||
    pathname.startsWith("/trips") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/announcements") ||
    pathname.startsWith("/gamification");

  const response = shouldHandleSupabaseSession
    ? await updateSession(request)
    : NextResponse.next({ request });

  // Set locale header from cookie or default to 'en'
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';

  // Add locale to response headers for next-intl
  const finalResponse = response || NextResponse.next();
  finalResponse.headers.set('x-next-intl-locale', locale);

  // Generate nonce for Content-Security-Policy
  const nonce = crypto.randomBytes(16).toString('base64');
  finalResponse.headers.set('x-nonce', nonce);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isDev = process.env.NODE_ENV === 'development';
  const csp = [
    `default-src 'self'`,
    // React requires eval() in dev mode for debugging features (callstack reconstruction)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind injects styles; nonce for styles requires build changes
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${supabaseUrl} wss://*.supabase.co${isDev ? ' ws://localhost:*' : ''}`,
    `font-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  // In test mode, use Report-Only so Playwright/axe-core can inject scripts
  const cspHeader = process.env.PLAYWRIGHT_TESTING === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
  finalResponse.headers.set(cspHeader, csp);

  return finalResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
