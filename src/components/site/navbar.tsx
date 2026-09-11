import { SiteSidebar } from "@/components/site/site-sidebar";
import { AdminNavLink } from "@/components/site/admin-nav-link";
import { getCurrentSubscriber, getHasRegisteredBrowser } from "@/lib/subscriber-auth";
import { getActiveBroker } from "@/lib/app-settings";

export async function Navbar() {
  const subscriber = await getCurrentSubscriber();
  const hasRegistered = await getHasRegisteredBrowser();
  const activeBroker = await getActiveBroker();

  return (
    <SiteSidebar
      subscriberName={subscriber?.name ?? null}
      hasRegistered={hasRegistered}
      notificationsEnabled={subscriber?.notificationsEnabled ?? true}
      activeBroker={activeBroker}
      adminLink={<AdminNavLink />}
    />
  );
}
