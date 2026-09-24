"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAdminPasswordHash } from "@/app/admin/(protected)/settings/actions";

export function AdminChangePasswordForm({
  mode = "owner",
}: {
  /** owner = env-var password (hash flow), staff = saved to DB, google-only = no password. */
  mode?: "owner" | "staff" | "google-only";
}) {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newHash, setNewHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    startTransition(async () => {
      const result = await generateAdminPasswordHash({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success && result.updated) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password changed. Use it next time you sign in.");
        return;
      }

      if (!result.success || !result.newHash) {
        setError(result.error ?? "Couldn't generate a new password hash.");
        return;
      }

      setNewHash(result.newHash);
      setCopied(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("New password hash generated — copy it into Vercel to finish.");
    });
  }

  async function copyHash() {
    if (!newHash) return;
    try {
      await navigator.clipboard.writeText(newHash);
      setCopied(true);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Couldn't copy automatically — select and copy the value manually.");
    }
  }

  return (
    <section className="signalflow-glass signalflow-gold-border rounded-2xl border p-5">
      <h2 className="font-heading text-lg font-bold">
        Change <span className="signalflow-gold-text">Admin Password</span>
      </h2>
      {mode === "owner" ? (
        <p className="mt-1 text-sm text-muted-foreground">
          The owner account&apos;s password lives in an environment variable
          (<code className="text-xs">ADMIN_PASSWORD_HASH</code>), not the database — so this form
          can&apos;t rotate it by itself. It verifies your current password and generates a new hash;
          you paste that into Vercel and redeploy to actually change it.
        </p>
      ) : mode === "staff" ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Changes your own admin password immediately. If you&apos;ve only ever signed in with Google,
          leave the current password blank.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Your admin account signs in with Google only, so it has no password to change. Ask a
          Super Admin to add you on the Admins page if you want one.
        </p>
      )}

      {mode === "google-only" ? null : !newHash ? (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-current-password">Current password</Label>
            <Input
              id="admin-current-password"
              type="password"
              required={mode === "owner"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-new-password">New password</Label>
            <Input
              id="admin-new-password"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-confirm-password">Confirm new password</Label>
            <Input
              id="admin-confirm-password"
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
            {isPending
              ? "Verifying…"
              : mode === "owner"
                ? "Generate new password hash"
                : "Change password"}
          </Button>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              New ADMIN_PASSWORD_HASH value
            </Label>
            <p className="mt-1.5 break-all font-mono text-xs text-foreground">{newHash}</p>
          </div>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
            <li>Copy the value above.</li>
            <li>
              In Vercel → the <code>traders-guide-academy</code> project → Settings →
              Environment Variables, update <code>ADMIN_PASSWORD_HASH</code> (Production, and
              Preview if you use it) to this value, then redeploy.
            </li>
            <li>Update the local <code>.env</code> file the same way if you also log in locally.</li>
            <li>Your current password keeps working until you complete the steps above.</li>
          </ol>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={copyHash}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNewHash(null)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
