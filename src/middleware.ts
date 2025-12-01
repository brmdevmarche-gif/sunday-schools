import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
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

  // Handle Supabase session
  const response = await updateSession(request);

  // Set locale header from cookie or default to 'en'
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';

  // Add locale to response headers for next-intl
  const finalResponse = response || NextResponse.next();
  finalResponse.headers.set('x-next-intl-locale', locale);

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
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
