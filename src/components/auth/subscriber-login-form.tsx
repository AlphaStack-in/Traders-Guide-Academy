"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSubscriberMagicLink } from "@/app/login/actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That link looks broken — request a new one below.",
  link_expired: "That link has expired — request a new one below.",
  not_a_subscriber: "This email is not registered as a premium subscriber. Please check your email or register first.",
};

export function SubscriberLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    (() => {
      const code = searchParams.get("error");
      if (!code) return null;
      return ERROR_MESSAGES[code] ?? decodeURIComponent(code);
    })()
  );
  const [loading, setLoading] = useState(false);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = searchParams.get("redirectTo") ?? "/signals";
    const origin = window.location.origin;

    try {
      const result = await requestSubscriberMagicLink(email, origin, redirectTo);
      setLoading(false);

      if (!result.success) {
        setError(result.error || "Unable to send the sign-in link. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setLoading(false);
      setError("Unable to send the sign-in link. Please try again.");
    }
  }

  if (sent) {
    return (
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
            setSent(false);
            setError(null);
          }}
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
      {error && <p className="text-xs font-medium text-[var(--thc-loss)] leading-relaxed">{error}</p>}
      <Button type="submit" disabled={loading} className="thc-glow thc-btn-gradient mt-2 font-semibold">
        {loading ? "Sending…" : "Send Sign-In Link"}
      </Button>
    </form>
  );
}
