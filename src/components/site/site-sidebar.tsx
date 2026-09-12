"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, LogOut, Menu, Settings, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavbarLogo } from "@/components/site/navbar-logo";
import { SidebarNavLinks } from "@/components/site/main-navigation";
import { IndexTicker } from "@/components/site/index-ticker";
import { cn } from "@/lib/utils";

const accountLinks = [
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/refer", label: "Refer & Earn", icon: Gift },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

interface SiteSidebarProps {
  /** Logged-in subscriber's name, or null when signed out. */
  subscriberName: string | null;
  /** Whether this browser has already completed premium registration once. */
  hasRegistered: boolean;
}

/**
 * Left-side navigation for the public/subscriber site — a single <aside>:
 * fixed and always visible on desktop (md+), slid off-canvas as a hamburger
 * drawer on mobile. Holds the page nav links (Home/Dashboard/Signals/
 * Products/Contact), plus — depending on auth state — either the signed-in
 * subscriber's account links (Profile/Refer & Earn/Settings/Logout) or a
 * highlighted "Register Premium" call-to-action. The clock, help,
 * notifications and admin-portal controls still live in SiteTopBar above
 * <main> instead (see site-topbar.tsx), rendered by Navbar alongside this
 * component.
 */
export function SiteSidebar({ subscriberName, hasRegistered }: SiteSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await fetch("/logout", { method: "POST" });
    router.push("/login");
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
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: persistent on desktop, drawer on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col border-r border-white/5 signalflow-glass transition-transform duration-200 md:w-64 md:max-w-none md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
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

        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <SidebarNavLinks onNavigate={close} />

          {subscriberName ? (
            <div className="mt-5">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Account
              </p>
              <div className="mt-1.5 flex flex-col gap-0.5">
                {accountLinks.map((link) => {
                  const Icon = link.icon;
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-white/5"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            !hasRegistered && (
              <div className="mt-5 px-3">
                <Button
                  asChild
                  className="signalflow-glow signalflow-btn-gradient w-full text-xs font-semibold"
                >
                  <Link href="/register" onClick={close}>
                    Register Premium
                  </Link>
                </Button>
              </div>
            )
          )}
        </div>
      </aside>

      <IndexTicker />
    </>
  );
}
