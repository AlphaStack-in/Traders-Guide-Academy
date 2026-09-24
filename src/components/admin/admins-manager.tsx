"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, RotateCcw, UserMinus, UserPlus } from "lucide-react";
import type { AdminAccessLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import {
  ACCESS_LEVEL_DESCRIPTIONS,
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVEL_ORDER,
} from "@/lib/admin-roles";
import {
  createStaffAdmin,
  setStaffAdminActive,
  setStaffAdminPassword,
  updateStaffAdmin,
} from "@/app/admin/(protected)/admins/actions";

export interface StaffAdminRow {
  id: string;
  email: string;
  name: string | null;
  accessLevel: AdminAccessLevel;
  isActive: boolean;
  hasPassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminAuditRow {
  id: string;
  action: string;
  actorEmail: string | null;
  targetEmail: string;
  previousValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// Highest first for pickers.
const ROLES_DESC = [...ACCESS_LEVEL_ORDER].reverse();

function when(iso: string | null) {
  if (!iso) return "—";
  return `${formatSignalDate(iso)} ${formatSignalTime(iso)}`;
}

function RoleSelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: AdminAccessLevel;
  onChange: (v: AdminAccessLevel) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AdminAccessLevel)} disabled={disabled}>
      <SelectTrigger id={id} className="w-full min-w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES_DESC.map((level) => (
          <SelectItem key={level} value={level}>
            {ACCESS_LEVEL_LABELS[level]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AddAdminForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accessLevel, setAccessLevel] = useState<AdminAccessLevel>("SUPPORT");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createStaffAdmin({ email, name, accessLevel, password });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${email} added as ${ACCESS_LEVEL_LABELS[accessLevel]}.`);
      setEmail("");
      setName("");
      setPassword("");
      setAccessLevel("SUPPORT");
    });
  }

  return (
    <section className="signalflow-glass signalflow-gold-border rounded-2xl border p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
        <UserPlus className="h-4 w-4 text-primary" />
        Add an admin
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-email">Email</Label>
          <Input
            id="new-admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-name">Name (optional)</Label>
          <Input id="new-admin-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-role">Role</Label>
          <RoleSelect id="new-admin-role" value={accessLevel} onChange={setAccessLevel} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-admin-password">Password (optional)</Label>
          <Input
            id="new-admin-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Blank = Google sign-in only"
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
          <span className="font-medium text-foreground">{ACCESS_LEVEL_LABELS[accessLevel]}:</span>{" "}
          {ACCESS_LEVEL_DESCRIPTIONS[accessLevel]} They can always sign in with Google using this
          exact email; a password also lets them use the email + password form.
        </p>
        <div className="flex items-end sm:justify-end">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Adding…" : "Add admin"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function StaffRow({ admin, isSelf }: { admin: StaffAdminRow; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [removeArmed, setRemoveArmed] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  function run(fn: () => Promise<{ success: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const result = await fn();
      if (result.success) toast.success(ok);
      else toast.error(result.error ?? "Something went wrong.");
    });
  }

  function changeRole(level: AdminAccessLevel) {
    run(() => updateStaffAdmin(admin.id, { accessLevel: level }), `${admin.email} is now ${ACCESS_LEVEL_LABELS[level]}.`);
  }

  function toggleActive() {
    if (admin.isActive && !removeArmed) {
      setRemoveArmed(true);
      setTimeout(() => setRemoveArmed(false), 4000);
      return;
    }
    setRemoveArmed(false);
    run(
      () => setStaffAdminActive(admin.id, !admin.isActive),
      admin.isActive ? `${admin.email}'s access removed.` : `${admin.email}'s access restored.`,
    );
  }

  function savePassword(value: string | null) {
    run(async () => {
      const result = await setStaffAdminPassword(admin.id, value);
      if (result.success) {
        setPwOpen(false);
        setNewPassword("");
      }
      return result;
    }, value === null ? "Password removed — Google sign-in only now." : "Password updated.");
  }

  return (
    <>
      <TableRow className={admin.isActive ? "border-b-white/5" : "border-b-white/5 opacity-60"}>
        <TableCell>
          <div className="font-medium">{admin.name || admin.email.split("@")[0]}</div>
          <div className="text-xs text-muted-foreground">{admin.email}</div>
        </TableCell>
        <TableCell>
          {isSelf ? (
            <Badge variant="outline">{ACCESS_LEVEL_LABELS[admin.accessLevel]} (you)</Badge>
          ) : (
            <RoleSelect value={admin.accessLevel} onChange={changeRole} disabled={isPending || !admin.isActive} />
          )}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {admin.hasPassword ? "Password + Google" : "Google only"}
        </TableCell>
        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{when(admin.lastLoginAt)}</TableCell>
        <TableCell>
          {admin.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="destructive">Removed</Badge>}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 px-2 text-muted-foreground"
              disabled={isPending || !admin.isActive}
              title="Set or remove password"
              onClick={() => setPwOpen((v) => !v)}
            >
              <KeyRound className="h-3.5 w-3.5" />
            </Button>
            {!isSelf && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className={
                  removeArmed
                    ? "h-8 gap-1 px-2 border-[var(--signalflow-loss)]/60 text-[var(--signalflow-loss)]"
                    : "h-8 gap-1 px-2 text-muted-foreground"
                }
                title={admin.isActive ? (removeArmed ? "Click again to confirm" : "Remove access") : "Restore access"}
                onClick={toggleActive}
              >
                {admin.isActive ? <UserMinus className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {removeArmed && <span className="text-xs">Confirm?</span>}
                {!admin.isActive && <span className="text-xs">Restore</span>}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {pwOpen && (
        <TableRow className="border-b-white/5 hover:bg-transparent">
          <TableCell colSpan={6} className="bg-black/20">
            <form
              className="flex flex-wrap items-end gap-2 py-1"
              onSubmit={(e) => {
                e.preventDefault();
                savePassword(newPassword);
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`pw-${admin.id}`} className="text-xs">
                  New password for {admin.email}
                </Label>
                <Input
                  id={`pw-${admin.id}`}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button type="submit" size="sm" disabled={isPending}>
                Save password
              </Button>
              {admin.hasPassword && (
                <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => savePassword(null)}>
                  Remove password (Google only)
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={() => setPwOpen(false)}>
                Cancel
              </Button>
            </form>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Added",
  SET_ACCESS_LEVEL: "Role changed",
  ACTIVATE: "Access restored",
  DEACTIVATE: "Access removed",
  SET_PASSWORD: "Password",
  UPDATE_NAME: "Name changed",
};

function describeValue(action: string, value: string | null) {
  if (!value) return "";
  if (action === "CREATE" || action === "SET_ACCESS_LEVEL") {
    return ACCESS_LEVEL_LABELS[value as AdminAccessLevel] ?? value;
  }
  return value;
}

export function AdminsManager({
  ownerEmail,
  envExtraEmails,
  staff,
  audit,
  currentStaffId,
}: {
  ownerEmail: string | null;
  envExtraEmails: string[];
  staff: StaffAdminRow[];
  audit: AdminAuditRow[];
  currentStaffId: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AddAdminForm />

      <section className="signalflow-glass rounded-2xl border border-white/5 p-5">
        <h2 className="font-heading text-lg font-bold">Admins</h2>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/5">
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Sign-in</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownerEmail && (
                <TableRow className="border-b-white/5">
                  <TableCell>
                    <div className="font-medium">Owner</div>
                    <div className="text-xs text-muted-foreground">{ownerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Super Admin</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">Password + Google</TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">Set by ADMIN_EMAIL</TableCell>
                </TableRow>
              )}
              {envExtraEmails.map((email) => (
                <TableRow key={email} className="border-b-white/5">
                  <TableCell>
                    <div className="font-medium">{email.split("@")[0]}</div>
                    <div className="text-xs text-muted-foreground">{email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Super Admin</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">Google only</TableCell>
                  <TableCell className="text-xs text-muted-foreground">—</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] text-xs text-muted-foreground">
                    Set by ADDITIONAL_ADMIN_EMAILS
                  </TableCell>
                </TableRow>
              ))}
              {staff.map((admin) => (
                <StaffRow key={admin.id} admin={admin} isSelf={admin.id === currentStaffId} />
              ))}
            </TableBody>
          </Table>
        </div>
        {envExtraEmails.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Admins from ADDITIONAL_ADMIN_EMAILS are always Super Admin and can&apos;t be changed here. To
            give one of them a limited role, add them above, then remove their email from that
            variable in Vercel and redeploy.
          </p>
        )}
      </section>

      <section className="signalflow-glass rounded-2xl border border-white/5 p-5">
        <h2 className="font-heading text-lg font-bold">What each role can do</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {ROLES_DESC.map((level) => (
            <li key={level}>
              <span className="font-semibold">{ACCESS_LEVEL_LABELS[level]}</span>
              <span className="text-muted-foreground"> — {ACCESS_LEVEL_DESCRIPTIONS[level]}</span>
            </li>
          ))}
        </ul>
      </section>

      {audit.length > 0 && (
        <section className="signalflow-glass rounded-2xl border border-white/5 p-5">
          <h2 className="font-heading text-lg font-bold">Recent changes</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {audit.map((log) => {
              const prev = describeValue(log.action, log.previousValue);
              const next = describeValue(log.action, log.newValue);
              return (
                <li key={log.id} className="text-muted-foreground">
                  <span className="text-xs">{when(log.createdAt)}</span> ·{" "}
                  <span className="text-foreground">{ACTION_LABELS[log.action] ?? log.action}</span>{" "}
                  for {log.targetEmail}
                  {log.action === "SET_ACCESS_LEVEL" && prev ? ` (${prev} → ${next})` : next && log.action !== "ACTIVATE" && log.action !== "DEACTIVATE" ? ` (${next})` : ""}
                  {log.actorEmail ? ` by ${log.actorEmail}` : ""}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
