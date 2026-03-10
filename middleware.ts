import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_PREFIX = "/admin";

/**
 * Comprueba si existe una sesión (maqueta).
 * En esta iteración se usa una cookie de desarrollo opcional para poder probar el dashboard.
 * En una iteración futura se reemplazará por Vercel Auth.
 */
function hasSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get("admin_session_mock");
  return sessionCookie?.value === "1";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PREFIX)) {
    return NextResponse.next();
  }

  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  if (!hasSession(request)) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
