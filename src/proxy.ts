import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-rbac";
import { verifySessionToken } from "@/lib/session-cookie";

/**
 * Session-only gate for /admin/* routes.
 *
 * Responsibilities:
 *   - Verify the admin_session cookie on every /admin/* request (except
 *     /admin/login itself).
 *   - Unauthenticated/invalid session → redirect to /admin/login.
 *
 * What this does NOT do:
 *   - Authorization beyond "is there a valid admin session" — with a single
 *     hardcoded admin account there's nothing further to authorize; the
 *     env-var identity check happens in requireAdmin() / admin-rbac.ts.
 *   - Redirect an already-authenticated admin away from /admin/login — that
 *     redirect is handled by the login page itself (see
 *     src/app/admin/login/page.tsx) to avoid redirect loops.
 *
 * This runs in the Edge runtime by default; session-cookie.ts is built on
 * the Web Crypto API specifically so it works unchanged here.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken<{ role: string }>(token);

  if (!session || session.role !== "admin") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
