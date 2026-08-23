import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/site/logo";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminUser } from "@/lib/admin-rbac";

/**
 * Admin login page.
 *
 * Defense-in-depth: an already-authenticated admin is redirected immediately
 * to /admin/dashboard.
 *
 * Authentication: a single hardcoded admin account (ADMIN_EMAIL +
 * ADMIN_PASSWORD_HASH env vars), verified in src/app/admin/login/actions.ts.
 * Session: an HMAC-signed cookie, checked in requireAdmin() / admin-rbac.ts.
 */
export default async function AdminLoginPage() {
  const result = await getAdminUser();
  if (result.ok) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <Logo />
      <div className="signalflow-glass signalflow-gold-border w-full max-w-sm rounded-2xl p-8">
        <h1 className="font-heading text-xl font-bold">Admin Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with your admin email and password.
        </p>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
