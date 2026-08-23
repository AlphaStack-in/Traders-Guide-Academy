"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSubscriber } from "@/app/login/actions";

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Authentication failed. Please try again.",
};

export function SubscriberLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/signals";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    (() => {
      const code = searchParams.get("error");
      if (!code) return null;
      return ERROR_MESSAGES[code] ?? decodeURIComponent(code);
    })(),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginSubscriber(email, password);
      setLoading(false);

      if (!result.success) {
        setError(result.error ?? "Login failed. Please try again.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Login failed. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-[var(--signalflow-loss)] leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Label htmlFor="password">Password</Label>
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

        <Button
          type="submit"
          disabled={loading}
          className="signalflow-glow signalflow-btn-gradient mt-1 h-11 font-semibold"
        >
          {loading ? "Logging in…" : "Login"}
        </Button>

        <p className="mt-1 text-center text-xs text-muted-foreground">
          Forgot your password, or haven&apos;t set one yet? Contact support to have it set.
        </p>
      </form>

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
