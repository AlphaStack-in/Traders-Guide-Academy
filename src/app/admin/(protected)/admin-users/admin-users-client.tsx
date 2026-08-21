"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, UserPlus, UserX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createAdminUser,
  setAdminAccessLevel,
  setAdminUserActive,
} from "./actions";
import type { AdminAccessLevel } from "@prisma/client";

const ACCESS_LEVELS: AdminAccessLevel[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SIGNAL_MANAGER",
  "SUPPORT",
  "VIEWER",
];

const ACCESS_LEVEL_COLORS: Record<AdminAccessLevel, string> = {
  SUPER_ADMIN: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  ADMIN: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  SIGNAL_MANAGER: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  SUPPORT: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  VIEWER: "text-muted-foreground border-white/10 bg-white/5",
};

type AdminUser = {
  id: string;
  supabaseUserId: string | null;
  email: string;
  accessLevel: AdminAccessLevel;
  isActive: boolean;
  createdAt: Date;
};

export function AdminUsersClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add user form state
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newLevel, setNewLevel] = useState<AdminAccessLevel>("VIEWER");

  function notify(msg: string, isError = false) {
    setError(isError ? msg : null);
    setSuccess(isError ? null : msg);
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  }

  function handleAddUser() {
    startTransition(async () => {
      const result = await createAdminUser({
        email: newEmail,
        accessLevel: newLevel,
      });
      if (!result.success) {
        notify(result.error ?? "Failed to create admin user.", true);
        return;
      }
      notify("Admin user created. They can sign in with Google using this email.");
      setShowAdd(false);
      setNewEmail("");
      setNewLevel("VIEWER");
      // Refresh list
      window.location.reload();
    });
  }

  function handleLevelChange(userId: string, level: AdminAccessLevel) {
    startTransition(async () => {
      const result = await setAdminAccessLevel(userId, level);
      if (!result.success) {
        notify(result.error ?? "Failed to update access level.", true);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accessLevel: level } : u)),
      );
      notify("Access level updated.");
    });
  }

  function handleToggleActive(userId: string, currentlyActive: boolean) {
    startTransition(async () => {
      const result = await setAdminUserActive(userId, !currentlyActive);
      if (!result.success) {
        notify(result.error ?? "Failed to update status.", true);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !currentlyActive } : u)),
      );
      notify(currentlyActive ? "Admin user deactivated." : "Admin user activated.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Notifications */}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-[var(--signalflow-loss)]">
          {error}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{users.length} admin account(s)</p>
        <Button
          id="add-admin-user-btn"
          size="sm"
          onClick={() => setShowAdd((v) => !v)}
          className="gap-1.5 text-xs signalflow-btn-gradient signalflow-glow"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add Admin User
        </Button>
      </div>

      {/* Add user form */}
      {showAdd && (
        <div className="signalflow-glass rounded-xl border border-white/10 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">New Admin User</p>
          <p className="text-xs text-muted-foreground">
            The user must sign in with this Google account. Access is activated on their
            first successful login.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-email">Email Address</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-level">Access Level</Label>
            <select
              id="new-level"
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value as AdminAccessLevel)}
              className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
            >
              {ACCESS_LEVELS.filter((l) => l !== "SUPER_ADMIN").map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              id="confirm-add-admin-btn"
              size="sm"
              disabled={isPending || !newEmail.trim()}
              onClick={handleAddUser}
              className="gap-1.5 text-xs signalflow-btn-gradient signalflow-glow"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isPending ? "Creating…" : "Create Admin User"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdd(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 bg-white/2.5">
            <tr className="text-left text-xs font-semibold text-muted-foreground">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Access Level</th>
              <th className="px-4 py-3">Link Status</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className={cn("transition-colors hover:bg-white/2.5", !user.isActive && "opacity-50")}>
                <td className="px-4 py-3">
                  <p className="font-medium">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  {user.accessLevel === "SUPER_ADMIN" ? (
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", ACCESS_LEVEL_COLORS.SUPER_ADMIN)}>
                      <ShieldCheck className="h-3 w-3" />
                      SUPER_ADMIN
                    </span>
                  ) : (
                    <select
                      aria-label={`Access level for ${user.email}`}
                      value={user.accessLevel}
                      disabled={isPending}
                      onChange={(e) => handleLevelChange(user.id, e.target.value as AdminAccessLevel)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-semibold outline-none",
                        ACCESS_LEVEL_COLORS[user.accessLevel],
                        "bg-transparent cursor-pointer",
                      )}
                    >
                      {ACCESS_LEVELS.filter((l) => l !== "SUPER_ADMIN").map((l) => (
                        <option key={l} value={l} className="bg-background text-foreground">{l}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    user.supabaseUserId
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400",
                  )}>
                    {user.supabaseUserId ? "Linked" : "Pending first login"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                    user.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 text-muted-foreground",
                  )}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.accessLevel !== "SUPER_ADMIN" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className="gap-1.5 text-xs"
                    >
                      {user.isActive ? (
                        <><UserX className="h-3.5 w-3.5" /> Deactivate</>
                      ) : (
                        <><RefreshCw className="h-3.5 w-3.5" /> Activate</>
                      )}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No admin users found. Bootstrap the first SUPER_ADMIN via the database script.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
