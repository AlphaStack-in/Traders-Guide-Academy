import { redirect } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { AdminNav, AdminMobileNav } from "@/components/admin/admin-nav";
import { BuildVersionIndicator } from "@/components/site/build-version-indicator";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    // Not authenticated or not an admin — send to login.
    // We catch here rather than letting the throw propagate as an unhandled
    // error so users see the login page rather than a 500 error screen.
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 thc-glass">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <AdminNav />
        </div>
        <AdminMobileNav />
      </header>
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-white/5 bg-card/40 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-1.5 px-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Traders Hub Center · Admin Portal</p>
          <BuildVersionIndicator />
        </div>
      </footer>
    </div>
  );
}

