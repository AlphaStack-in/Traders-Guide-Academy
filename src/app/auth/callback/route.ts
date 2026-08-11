import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { linkSubscriberAccount } from "@/app/login/actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const redirectTo = searchParams.get("redirectTo") ?? "/signals";

  if (searchParams.get("error")) {
    const errorDesc = searchParams.get("error_description") || searchParams.get("error");
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDesc || "auth_failed")}`);
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
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(linkResult.error ?? "not_a_subscriber")}`
    );
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
