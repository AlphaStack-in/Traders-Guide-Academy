import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Admin Google OAuth callback.
 *
 * Flow:
 *   Google → Supabase → GET /admin/auth/callback?code=...
 *   → exchange code for session
 *   → redirect to /admin/dashboard
 *
 * Authorization (AdminUser table lookup) is performed server-side in the
 * protected layout via requireAdmin() from @/lib/admin-rbac.  This callback
 * only handles the session exchange — it does NOT grant admin access.
 *
 * Security:
 * - redirectTo is restricted to same-origin /admin/* paths only.
 * - No arbitrary external redirect URLs are permitted.
 * - OAuth errors are forwarded to /admin/login with a safe error code.
 */
export async function GET(request: Request) {
  let origin = "";
  try {
    const requestUrl = new URL(request.url);
    origin = requestUrl.origin;

    const code = requestUrl.searchParams.get("code");
    const redirectToParam = requestUrl.searchParams.get("redirectTo");

    // Sanitize: accept only same-origin /admin/* paths, default to dashboard.
    const safeRedirectTo =
      redirectToParam &&
      redirectToParam.startsWith("/admin/") &&
      !redirectToParam.startsWith("//")
        ? redirectToParam
        : "/admin/dashboard";

    // Handle OAuth provider errors
    if (requestUrl.searchParams.get("error")) {
      const errorDesc =
        requestUrl.searchParams.get("error_description") ||
        requestUrl.searchParams.get("error");
      console.error("[admin/auth/callback] OAuth provider error:", errorDesc);
      return NextResponse.redirect(`${origin}/admin/login?error=oauth_failed`);
    }

    if (!code) {
      console.error("[admin/auth/callback] No code param received");
      return NextResponse.redirect(`${origin}/admin/login?error=oauth_failed`);
    }

    // Exchange the authorization code for a Supabase session
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[admin/auth/callback] Session exchange error:", exchangeError.message);
      return NextResponse.redirect(`${origin}/admin/login?error=oauth_failed`);
    }

    // Authorization check happens in the protected layout (requireAdmin).
    // This callback only handles authentication (session creation).
    return NextResponse.redirect(`${origin}${safeRedirectTo}`);
  } catch (err) {
    console.error("[admin/auth/callback] Unhandled exception:", err);
    const fallbackOrigin = origin || "http://localhost:3000";
    return NextResponse.redirect(`${fallbackOrigin}/admin/login?error=oauth_failed`);
  }
}
