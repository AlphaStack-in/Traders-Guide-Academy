"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { NavbarLogo } from "@/components/site/navbar-logo";
import { SidebarNavLinks } from "@/components/site/main-navigation";
import { HelpNavLink } from "@/components/site/help-nav-link";
import { NotificationBell } from "@/components/site/notification-bell";
import { SubscriberNavStatus } from "@/components/site/subscriber-nav-status";
import { IstClock } from "@/components/site/ist-clock";
import { IndexTicker } from "@/components/site/index-ticker";
import { cn } from "@/lib/utils";
import type { ActiveBroker } from "@/lib/app-settings";

interface SiteSidebarProps {
  subscriberName: string | null;
  hasRegistered: boolean;
  notificationsEnabled: boolean;
  activeBroker: ActiveBroker;
  /** Rendered server-side (AdminNavLink resolves admin auth) and passed down. */
  adminLink: ReactNode;
}

/**
 * Left-side navigation for the public/subscriber site — replaces the old
 * horizontal top Navbar. Renders a single <aside>: fixed and always visible
 * on desktop (md+), and slid off-canvas as a hamburger drawer on mobile.
 * Only one instance of each stateful child (NotificationBell in particular,
 * which opens its own realtime/poll connection) is ever mounted — the aside
 * is shared between the "desktop" and "mobile drawer" presentations rather
 * than duplicated, to avoid doubling up those connections.
 */
export function SiteSidebar({
  subscriberName,
  hasRegistered,
  notificationsEnabled,
  activeBroker,
  adminLink,
}: SiteSidebarProps) {
  const [open, setOpen] = useState(false);

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
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNavLinks onNavigate={() => setOpen(false)} />
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <IstClock />
            <HelpNavLink href="/help" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell
              activeBroker={activeBroker}
              notificationsEnabled={notificationsEnabled}
            />
            <SubscriberNavStatus subscriberName={subscriberName} hasRegistered={hasRegistered} />
          </div>
          {adminLink}
        </div>
      </aside>

      <IndexTicker />
    </>
  );
}
