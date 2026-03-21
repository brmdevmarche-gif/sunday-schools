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
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`, // Tailwind injects styles; nonce for styles requires build changes
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${supabaseUrl} wss://*.supabase.co`,
    `font-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  // Enforce CSP — switch back to 'Content-Security-Policy-Report-Only' if violations occur
  finalResponse.headers.set('Content-Security-Policy', csp);

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
