import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { linkSubscriberAccount } from "@/lib/subscriber-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let origin = "";
  try {
    const requestUrl = new URL(request.url);
    origin = requestUrl.origin;

    const code = requestUrl.searchParams.get("code");
    const type = requestUrl.searchParams.get("type");
    const redirectToParam = requestUrl.searchParams.get("redirectTo");

    // Sanitize redirectTo to prevent open redirect vulnerabilities
    const safeRedirectTo =
      redirectToParam && redirectToParam.startsWith("/") && !redirectToParam.startsWith("//")
        ? redirectToParam
        : "/signals";

    if (requestUrl.searchParams.get("error")) {
      const errorDesc =
        requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");
      console.error("Auth callback received error from OAuth provider:", errorDesc);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("auth_failed")}`
      );
    }

    if (code) {
      const supabase = await createSupabaseServerClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Auth callback session exchange error:", exchangeError);
        return NextResponse.redirect(`${origin}/login?error=link_expired`);
      }
    }

    // Handle password recovery redirect
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }

    // Resolve and link subscriber account (supports Magic Link, Google OAuth, Email/Password)
    const linkResult = await linkSubscriberAccount();

    if (!linkResult.success) {
      console.warn("Subscriber account verification failed in callback:", linkResult.error);
      try {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.error("Error signing out unverified user session:", signOutErr);
      }
      const errCode = linkResult.errorCode || "not_a_subscriber";
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(errCode)}`
      );
    }

    return NextResponse.redirect(`${origin}${safeRedirectTo}`);
  } catch (err: unknown) {
    console.error("Unhandled exception in /auth/callback route:", err);
    try {
      if (origin) {
        const supabase = await createSupabaseServerClient();
        await supabase.auth.signOut();
      }
    } catch (signOutErr) {
      console.error("Error signing out after callback exception:", signOutErr);
    }
    const fallbackOrigin = origin || "http://localhost:3000";
    return NextResponse.redirect(`${fallbackOrigin}/login?error=auth_failed`);
  }
}

