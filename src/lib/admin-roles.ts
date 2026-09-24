/**
 * Admin roles — labels, descriptions and ordering shared by server code
 * (src/lib/admin-rbac.ts) and client components (Admins page, nav badge).
 * Kept free of server-only imports so it's safe to import anywhere.
 *
 * Roles are cumulative: each level can do everything the levels below it can.
 */
import type { AdminAccessLevel } from "@prisma/client";

/** Lowest → highest. */
export const ACCESS_LEVEL_ORDER: AdminAccessLevel[] = [
  "VIEWER",
  "SUPPORT",
  "SIGNAL_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
];

export const ACCESS_LEVEL_LABELS: Record<AdminAccessLevel, string> = {
  VIEWER: "Viewer",
  SUPPORT: "Support",
  SIGNAL_MANAGER: "Signal Manager",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export const ACCESS_LEVEL_DESCRIPTIONS: Record<AdminAccessLevel, string> = {
  VIEWER: "Can view every admin page, but can't change anything.",
  SUPPORT: "Viewer + manage members (add/edit, reset passwords, invites), reply to messages, referrals.",
  SIGNAL_MANAGER: "Support + send/edit/close signals, admin updates, News & Alerts.",
  ADMIN: "Signal Manager + products, PMS accounts, broker sessions, site settings, delete members, announcements.",
  SUPER_ADMIN: "Everything, including adding and removing other admins.",
};

export function hasPermission(actual: AdminAccessLevel, required: AdminAccessLevel): boolean {
  return ACCESS_LEVEL_ORDER.indexOf(actual) >= ACCESS_LEVEL_ORDER.indexOf(required);
}

export function isAdminAccessLevel(value: unknown): value is AdminAccessLevel {
  return typeof value === "string" && (ACCESS_LEVEL_ORDER as string[]).includes(value);
}
