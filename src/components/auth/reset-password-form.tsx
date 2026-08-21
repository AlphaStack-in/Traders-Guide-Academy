"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { linkSubscriberAccount } from "@/app/login/actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setLoading(false);
        setError(updateError.message || "Failed to update password. Please try again.");
        return;
      }

      await linkSubscriberAccount();
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/signals");
      }, 2000);
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 signalflow-glow">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">Password Reset Successful!</h2>
        <p className="text-xs text-muted-foreground">
          Your password has been updated. Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Minimum 6 characters"
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && <p className="text-xs font-medium text-[var(--signalflow-loss)] leading-relaxed">{error}</p>}

      <Button type="submit" disabled={loading} className="signalflow-glow signalflow-btn-gradient mt-2 font-semibold">
        {loading ? "Updating Password…" : "Set New Password"}
      </Button>
    </form>
  );
}
