"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";

export function AdminNavLink() {
  const pathname = usePathname();
  const isAdminActive = pathname.startsWith("/admin");
  const adminHref = clientConfig.requireAdminAuth ? "/admin/login" : "/admin/dashboard";

  return (
    <Link
      href={adminHref}
      aria-current={isAdminActive ? "page" : undefined}
      className={cn(
        "hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:inline-flex",
        isAdminActive
          ? "border border-primary/40 bg-primary/10 text-primary thc-glow font-semibold"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      <span>Admin</span>
    </Link>
  );
}
