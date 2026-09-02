import { NavbarLogo } from "@/components/site/navbar-logo";
import { HelpNavLink } from "@/components/site/help-nav-link";
import { NotificationBell } from "@/components/site/notification-bell";
import { IndexTicker } from "@/components/site/index-ticker";
import { SubscriberNavStatus } from "@/components/site/subscriber-nav-status";
import { AdminNavLink } from "@/components/site/admin-nav-link";
import { DesktopNavigation, MobileNavigation } from "@/components/site/main-navigation";
import { IstClock } from "@/components/site/ist-clock";
import { getCurrentSubscriber, getHasRegisteredBrowser } from "@/lib/subscriber-auth";

export async function Navbar() {
  const subscriber = await getCurrentSubscriber();
  const hasRegistered = await getHasRegisteredBrowser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 signalflow-glass">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavbarLogo />
        <DesktopNavigation />
        <div className="flex items-center gap-2.5 sm:gap-3">
          <IstClock />
          <HelpNavLink href="/help" />
          <NotificationBell />
          <SubscriberNavStatus
            subscriberName={subscriber?.name ?? null}
            hasRegistered={hasRegistered}
          />
          <AdminNavLink />
        </div>
      </div>
      <MobileNavigation />
      <IndexTicker />
    </header>
  );
}
