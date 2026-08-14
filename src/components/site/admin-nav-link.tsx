import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminUser } from "@/lib/admin-auth";

/**
 * Server component — resolves the correct admin href before rendering.
 *
 * Already-authenticated authorized admin → links to /admin/dashboard directly.
 * Anyone else (unauthenticated or not an admin) → links to /admin/login.
 *
 * This avoids relying on the proxy to redirect an already-authenticated admin
 * away from /admin/login, eliminating the previous brittle round-trip.
 *
 * Security: getAdminUser() performs the server-side ADMIN_EMAILS check.
 * Client-provided values are never trusted.
 */
export async function AdminNavLink() {
  const result = await getAdminUser();
  const isAdmin = result.ok;
  const adminHref = isAdmin ? "/admin/dashboard" : "/admin/login";

  return (
    <Link
      href={adminHref}
      aria-label="Admin portal"
      className={cn(
        "hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:inline-flex",
        isAdmin
          ? "border border-primary/40 bg-primary/10 text-primary thc-glow font-semibold"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      <span>Admin</span>
    </Link>
  );
}
