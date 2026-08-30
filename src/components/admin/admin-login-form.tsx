"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin } from "@/app/admin/login/actions";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in isn't set up for this site yet.",
  google_denied: "Google sign-in was cancelled.",
  google_auth_failed: "Something went wrong signing in with Google. Please try again.",
  google_email_unverified: "That Google account's email isn't verified.",
  google_not_admin: "That Google account isn't authorized as an admin.",
};

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    (() => {
      const code = searchParams.get("error");
      if (!code) return null;
      return GOOGLE_ERROR_MESSAGES[code] ?? decodeURIComponent(code);
    })(),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAdmin(email, password);
      setLoading(false);

      if (!result.success) {
        setError(result.error ?? "Sign-in failed. Please try again.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Sign-in failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-[var(--signalflow-loss)] leading-relaxed"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="signalflow-glow signalflow-btn-gradient mt-2 h-11 font-semibold"
      >
        {loading ? "Signing in…" : "Sign In"}
      </Button>

      <div className="relative my-1 text-center text-xs text-muted-foreground">
        <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
        <span className="relative bg-background px-2">or</span>
      </div>

      <GoogleSignInButton role="admin" redirectTo={redirectTo} />
    </form>
  );
}
