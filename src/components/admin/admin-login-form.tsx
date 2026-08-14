"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 10.02 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Google sign-in failed. Please try again.",
  not_authorized: "Your Google account is not authorized for admin access. Contact the super admin.",
};

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin/dashboard";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    return ERROR_MESSAGES[code] ?? "Sign-in failed. Please try again.";
  });

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;

      // Redirect to the admin-specific OAuth callback, not the subscriber one.
      // The callback sanitizes redirectTo to /admin/* only.
      const callbackUrl = `${origin}/admin/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (oauthError) {
        setLoading(false);
        setError(oauthError.message || "Google sign-in failed. Please try again.");
      }
      // On success, the browser is redirected to Google — no further code runs.
    } catch {
      setLoading(false);
      setError("Unable to connect to Google. Please try again.");
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-[var(--thc-loss)] leading-relaxed"
        >
          {error}
        </div>
      )}

      <Button
        id="admin-google-signin"
        type="button"
        variant="outline"
        disabled={loading}
        onClick={handleGoogleLogin}
        className="h-11 w-full gap-3 border-white/10 bg-white/5 font-semibold hover:bg-white/10 hover:border-white/20 text-foreground"
      >
        <GoogleIcon className="h-4 w-4 shrink-0" />
        <span>{loading ? "Connecting to Google…" : "Continue with Google"}</span>
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Only authorized Google accounts can sign in.
      </p>
    </div>
  );
}
