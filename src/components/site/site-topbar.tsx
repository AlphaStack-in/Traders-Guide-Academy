import type { ReactNode } from "react";
import { HelpNavLink } from "@/components/site/help-nav-link";
import { NotificationBell } from "@/components/site/notification-bell";
import { SubscriberNavStatus } from "@/components/site/subscriber-nav-status";
import { IstClock } from "@/components/site/ist-clock";
import type { ActiveBroker } from "@/lib/app-settings";

interface SiteTopBarProps {
  subscriberName: string | null;
  hasRegistered: boolean;
  notificationsEnabled: boolean;
  activeBroker: ActiveBroker;
  /** Rendered server-side (AdminNavLink resolves admin auth) and passed down. */
  adminLink: ReactNode;
}

/**
 * Top utility bar for the public/subscriber site — the clock, help link,
 * notification bell, register/account status and admin-portal link that used
 * to live at the bottom of SiteSidebar. Rendered by Navbar as a plain-flow
 * sibling of SiteSidebar, so it sits inside each page's `md:pl-64` wrapper
 * and is automatically clear of the fixed sidebar on desktop (and full-width
 * on mobile, where the sidebar collapses into its own drawer) — no fixed
 * positioning of its own needed.
 */
export function SiteTopBar({
  subscriberName,
  hasRegistered,
  notificationsEnabled,
  activeBroker,
  adminLink,
}: SiteTopBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-white/5 signalflow-glass px-4 py-2.5 sm:px-6 lg:px-8">
      <IstClock />
      <HelpNavLink href="/help" />
      <NotificationBell activeBroker={activeBroker} notificationsEnabled={notificationsEnabled} />
      <SubscriberNavStatus subscriberName={subscriberName} hasRegistered={hasRegistered} />
      {adminLink}
    </div>
  );
}
