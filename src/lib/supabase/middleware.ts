import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session-refresh middleware for /admin/* routes.
 *
 * Authentication is ALWAYS enforced for all admin routes regardless of the
 * clientConfig.requireAdminAuth flag.  That flag only controls whether the
 * /admin/login page is shown (i.e. the UX login flow) — it must never bypass
 * actual server-side authentication or authorization.
 *
 * Authorization (admin role check) is performed separately inside each
 * Server Action and layout via requireAdmin() from @/lib/admin-auth, because
 * middleware runs before the Supabase session cookies are finalised and cannot
 * reliably read app_metadata.
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

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (isAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
