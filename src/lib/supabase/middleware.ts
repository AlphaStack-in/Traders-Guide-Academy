import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session-refresh proxy for /admin/* routes.
 *
 * Responsibilities:
 *   1. Refresh the Supabase session cookie on every /admin/* request.
 *   2. Gate unauthenticated requests to protected /admin/* routes → /admin/login.
 *
 * What this proxy does NOT do:
 *   - It does NOT perform admin authorization (AdminUser table lookup).
 *     Authorization requires Prisma which cannot run in the proxy runtime.
 *     Authorization is enforced server-side in:
 *       • src/app/admin/(protected)/layout.tsx   via requireAdmin()
 *       • src/app/admin/login/page.tsx           via getAdminUser() (redirect)
 *       • all Server Actions                     via requireAdmin()
 *       • src/app/api/news/route.ts              via getAdminUser()
 *
 *   - It does NOT redirect authenticated users away from /admin/login.
 *     That redirect is handled by the login page server component itself
 *     (which can call getAdminUser() with Prisma) to avoid redirect loops
 *     for authenticated-but-not-authorized users.
 *
 * Session-only gate:
 *   - Unauthenticated → redirect to /admin/login?redirectTo=<pathname>
 *   - Authenticated → let through (authorization happens downstream)
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — must be called on every request per Supabase SSR docs.
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { pathname } = request.nextUrl;

  // /admin/login and /admin/auth/* are public — let them through always.
  const isPublicAdminPath =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/auth/");

  // Gate: unauthenticated access to protected /admin/* routes → login.
  if (!isPublicAdminPath && pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
