import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-nav";
import { BuildVersionIndicator } from "@/components/site/build-version-indicator";
import { requireAdmin } from "@/lib/admin-auth";
import { clientConfig } from "@/lib/client-config";
import { getActiveBroker } from "@/lib/app-settings";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let isSuperAdmin = false;
  let adminEmail: string | null = null;
  try {
    const admin = await requireAdmin();
    isSuperAdmin = admin.accessLevel === "SUPER_ADMIN";
    adminEmail = admin.email;
  } catch {
    // Not authenticated or not an admin — send to login.
    redirect("/admin/login");
  }

  const activeBroker = await getActiveBroker();

  return (
    <div className="flex min-h-screen flex-col md:pl-64">
      <AdminSidebar isSuperAdmin={isSuperAdmin} adminEmail={adminEmail} activeBroker={activeBroker} />
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-white/5 bg-card/40 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-1.5 px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} {clientConfig.siteName} · Admin Portal</p>
          <BuildVersionIndicator />
        </div>
      </footer>
    </div>
  );
}
