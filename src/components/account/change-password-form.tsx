"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeSubscriberPassword } from "@/app/account/settings/actions";

interface ChangePasswordFormProps {
  /** Whether the subscriber already has a passwordHash (false for a
   * Google-only account that has never set one — see
   * src/lib/google-oauth.ts). Flips this card between "change" and "set". */
  hasPassword: boolean;
}

export function ChangePasswordForm({ hasPassword }: ChangePasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    startTransition(async () => {
      const result = await changeSubscriberPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (!result.success) {
        setError(result.error ?? "Couldn't change your password.");
        return;
      }

      toast.success(
        hasPassword ? "Password changed." : "Password set — you can now log in with it too.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <section className="signalflow-glass signalflow-gold-border rounded-2xl border p-5">
      <h2 className="font-heading text-lg font-bold">
        {hasPassword ? (
          <>
            Change <span className="signalflow-gold-text">Password</span>
          </>
        ) : (
          <>
            Set a <span className="signalflow-gold-text">Password</span>
          </>
        )}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasPassword
          ? "Update the password you use to log in."
          : "You signed up with Google — set a password so you can also log in with email and password."}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {hasPassword && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </Button>
      </form>
    </section>
  );
}
