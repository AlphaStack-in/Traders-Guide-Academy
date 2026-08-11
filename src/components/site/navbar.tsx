import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/site/notification-bell";
import { IndexTicker } from "@/components/site/index-ticker";
import { SubscriberNavStatus } from "@/components/site/subscriber-nav-status";
import { AdminNavLink } from "@/components/site/admin-nav-link";
import { DesktopNavigation, MobileNavigation } from "@/components/site/main-navigation";
import { IstClock } from "@/components/site/ist-clock";
import { BuildVersionIndicator } from "@/components/site/build-version-indicator";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";

export async function Navbar() {
  const subscriber = await getCurrentSubscriber();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 thc-glass">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <DesktopNavigation />
        <div className="flex items-center gap-2.5 sm:gap-3">
          <IstClock />
          <BuildVersionIndicator className="hidden md:inline-flex" />
          <NotificationBell />
          <SubscriberNavStatus subscriberName={subscriber?.name ?? null} />
          <AdminNavLink />
          {!subscriber && (
            <Button asChild size="sm" className="thc-glow thc-btn-gradient text-xs font-semibold">
              <Link href="/register">Register Premium</Link>
            </Button>
          )}
        </div>
      </div>
      <MobileNavigation />
      <IndexTicker />
    </header>
  );
}
