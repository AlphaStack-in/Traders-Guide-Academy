"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { requestPasswordReset, requestSubscriberMagicLink, linkSubscriberAccount } from "@/app/login/actions";
import { clientConfig } from "@/lib/client-config";
import { normalizeEmail } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
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
  missing_code: "That link looks broken — request a new sign-in link.",
  link_expired: "That link has expired — request a new sign-in link.",
  not_a_subscriber: "This email is not registered as a premium subscriber. Please check your email or register first.",
  account_already_linked: "This email is already linked to a different account.",
  auth_failed: "Authentication failed. Please try again.",
};

export function SubscriberLoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/signals";

  const [mode, setMode] = useState<"password" | "magic-link" | "forgot-password">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    (() => {
      const code = searchParams.get("error");
      if (!code) return null;
      return ERROR_MESSAGES[code] ?? decodeURIComponent(code);
    })()
  );

  const brandName = clientConfig.siteName;

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const callbackUrl = `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (oauthError) {
        setGoogleLoading(false);
        setError(oauthError.message || "Failed to initialize Google Sign-In.");
      }
    } catch {
      setGoogleLoading(false);
      setError("Unable to connect to Google OAuth. Please try again.");
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normEmail = normalizeEmail(email);
    if (!normEmail || !normEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify email is registered in subscriber database first
      const checkRes = await requestSubscriberMagicLink(normEmail, window.location.origin, redirectTo);
      // If check failed because non-subscriber, stop immediately
      if (!checkRes.success && checkRes.error?.includes("not registered")) {
        setLoading(false);
        setError(checkRes.error);
        return;
      }

      // 2. Sign in via Supabase Auth Email/Password
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normEmail,
        password,
      });

      if (signInError) {
        setLoading(false);
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. If you haven't set a password yet, click 'Forgot password?' or use 'Send Login Link'.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // 3. Link Subscriber account
      const linkRes = await linkSubscriberAccount();
      setLoading(false);

      if (!linkRes.success) {
        await supabase.auth.signOut();
        setError(linkRes.error || "Subscriber verification failed.");
        return;
      }

      // 4. Redirect
      window.location.href = redirectTo;
    } catch {
      setLoading(false);
      setError("Login failed. Please try again.");
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const origin = window.location.origin;
    try {
      const result = await requestSubscriberMagicLink(email, origin, redirectTo);
      setLoading(false);

      if (!result.success) {
        setError(result.error || "Unable to send the sign-in link. Please try again.");
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setLoading(false);
      setError("Unable to send the sign-in link. Please try again.");
    }
  }

  async function handleForgotPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const origin = window.location.origin;
    try {
      const result = await requestPasswordReset(email, origin);
      setLoading(false);

      if (!result.success) {
        setError(result.error || "Unable to send password reset email. Please try again.");
        return;
      }

      setResetSent(true);
    } catch {
      setLoading(false);
      setError("Unable to send password reset email. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        disabled={googleLoading}
        onClick={handleGoogleLogin}
        className="h-11 w-full gap-2.5 border-white/10 bg-white/5 font-semibold hover:bg-white/10 hover:border-white/20 text-foreground"
      >
        <GoogleIcon className="h-4 w-4 shrink-0" />
        <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-white/10" />
        <span className="absolute bg-[#0b0c10] px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          OR
        </span>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-[var(--thc-loss)] leading-relaxed">
          {error}
        </div>
      )}

      {/* MODE 1: EMAIL + PASSWORD LOGIN */}
      {mode === "password" && (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("forgot-password");
                }}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="thc-glow thc-btn-gradient mt-1 font-semibold h-11">
            {loading ? "Logging in…" : "Login"}
          </Button>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("magic-link");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email me a sign-in link instead</span>
            </button>
          </div>
        </form>
      )}

      {/* MODE 2: MAGIC LINK FALLBACK */}
      {mode === "magic-link" && (
        <div className="flex flex-col gap-4">
          {magicLinkSent ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-400">
                  Sign-In Link Sent Successfully!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check <span className="font-medium text-foreground">{email}</span> for your sign-in email.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the link inside that email to finish signing in — you can close this tab.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMagicLinkSent(false);
                  setError(null);
                }}
                className="w-fit text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="magic-email">Subscriber Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="thc-glow thc-btn-gradient h-11 font-semibold">
                {loading ? "Sending…" : "Send Sign-In Link"}
              </Button>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("password");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Back to Password Login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODE 3: FORGOT PASSWORD */}
      {mode === "forgot-password" && (
        <div className="flex flex-col gap-4">
          {resetSent ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-400">
                  Password Reset Link Sent!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check <span className="font-medium text-foreground">{email}</span> for password reset instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false);
                  setMode("password");
                }}
                className="w-fit text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Back to Password Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter your registered subscriber email to receive a password setup/reset link.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reset-email">Subscriber Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="thc-glow thc-btn-gradient h-11 font-semibold">
                {loading ? "Sending Reset Link…" : "Send Reset Link"}
              </Button>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("password");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Back to Password Login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* REGISTRATION PROMPT */}
      <div className="mt-4 border-t border-white/10 pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Not a premium subscriber yet?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register Premium
          </Link>
        </p>
      </div>
    </div>
  );
}
