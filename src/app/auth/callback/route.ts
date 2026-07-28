import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { linkSubscriberAccount } from "@/app/login/actions";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/signals";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  const linkResult = await linkSubscriberAccount();

  if (!linkResult.success) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(linkResult.error ?? "not_a_subscriber")}`,
    );
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
