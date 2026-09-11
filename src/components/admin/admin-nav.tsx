"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  Shield,
  UserRound,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ActiveBroker } from "@/lib/app-settings";
import { HelpNavLink } from "@/components/site/help-nav-link";
import { IstClock } from "@/components/site/ist-clock";
import { NavbarLogo } from "@/components/site/navbar-logo";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/signals", label: "Manage Signals", icon: Zap },
  { href: "/admin/news-alerts", label: "News & Alerts", icon: Newspaper },
];

function getMembersLinks(activeBroker: ActiveBroker) {
  return [
    { href: "/admin/subscribers", label: "View Members" },
    { href: "/admin/messages", label: "Messages" },
    { href: "/admin/referrals", label: "Referrals" },
    ...(activeBroker === "dhan"
      ? [{ href: "/admin/broker-sessions", label: "Broker Sessions" }]
      : []),
  ];
}

// isSuperAdmin no longer changes this list — TGA has a single hardcoded
// admin account now, so there's no "Admin Users" management page to link to.
// The param is kept (always true) so the protected layout doesn't need to
// change how it calls this.
function getAdminGroupLinks(_isSuperAdmin: boolean, activeBroker: ActiveBroker) {
  return [
    { href: "/admin/help", label: "Help Manual" },
    { href: "/admin/changelog", label: "Changelog" },
    ...(activeBroker === "goodwill"
      ? [{ href: "/admin/goodwill-orders", label: "Order Requests" }]
      : []),
  ];
}

function AdminNavRow({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <span>{label}</span>
    </Link>
  );
}

function AdminSubLink({
  href,
  label,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-lg px-3 py-1.5 text-sm transition-colors",
        active ? "font-semibold text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

/**
 * Left-side navigation for the /admin/* protected area — replaces the old
 * horizontal top AdminNav + AdminMobileNav pair. A single <aside> is
 * rendered: fixed and always visible on desktop (md+), slid off-canvas as a
 * hamburger drawer on mobile. The Members/Admin dropdown groups from the old
 * top bar become static, always-expanded sections (a better fit for a
 * sidebar than nested dropdowns).
 */
export function AdminSidebar({
  isSuperAdmin = false,
  adminEmail = null,
  activeBroker = null,
}: {
  isSuperAdmin?: boolean;
  adminEmail?: string | null;
  activeBroker?: ActiveBroker;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const username = adminEmail ? adminEmail.split("@")[0] : null;
  const membersLinks = getMembersLinks(activeBroker);
  const adminGroupLinks = getAdminGroupLinks(isSuperAdmin, activeBroker);
  const close = () => setOpen(false);

  async function handleLogout() {
    await fetch("/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 signalflow-glass px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Menu className="h-5 w-5" />
        </button>
        <NavbarLogo />
      </div>

      {/* Backdrop, mobile drawer only */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: persistent on desktop, drawer on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col border-r border-white/5 signalflow-glass transition-transform duration-200 md:w-64 md:max-w-none md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-4 md:h-20">
          <NavbarLogo />
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <AdminNavRow key={link.href} {...link} pathname={pathname} onNavigate={close} />
            ))}
          </nav>

          <div className="mt-5">
            <p className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              <Users className="h-3.5 w-3.5" />
              Members
            </p>
            <div className="mt-1.5 flex flex-col gap-0.5">
              {membersLinks.map((link) => (
                <AdminSubLink key={link.href} {...link} pathname={pathname} onNavigate={close} />
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </p>
            <div className="mt-1.5 flex flex-col gap-0.5">
              {adminGroupLinks.map((link) => (
                <AdminSubLink key={link.href} {...link} pathname={pathname} onNavigate={close} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <IstClock />
            <HelpNavLink href="/admin/help" />
          </div>
          {username ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`${username}'s account menu`}
                className="flex w-full items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-2 text-xs font-semibold text-primary outline-none transition-colors hover:border-primary/70"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate text-left capitalize">{username}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                  <Link href="/admin/settings">
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Defensive fallback only — the protected admin layout redirects to
            // /admin/login before AdminSidebar ever renders without an
            // adminEmail, so this shouldn't be reachable in practice.
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full gap-1.5 text-xs font-medium">
              <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
