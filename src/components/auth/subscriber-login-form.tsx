"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That link looks broken — request a new one below.",
  link_expired: "That link has expired — request a new one below.",
};

export function SubscriberLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    (() => {
      const code = searchParams.get("error");
      if (!code) return null;
      return ERROR_MESSAGES[code] ?? code;
    })(),
  );
  const [loading, setLoading] = useState(false);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = searchParams.get("redirectTo") ?? "/signals";
    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground">
          Check <span className="font-medium">{email}</span> for a sign-in link.
        </p>
        <p className="text-xs text-muted-foreground">
          Click the link in that email to finish signing in — you can close this tab.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="w-fit text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendLink} className="flex flex-col gap-4">
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
      {error && <p className="text-sm text-[var(--thc-loss)]">{error}</p>}
      <Button type="submit" disabled={loading} className="thc-glow thc-btn-gradient mt-2">
        {loading ? "Sending…" : "Send Sign-In Link"}
      </Button>
    </form>
  );
}
