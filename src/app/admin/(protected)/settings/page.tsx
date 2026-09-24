import { getAppSettings } from "@/lib/app-settings";
import { AdminSettingsForm } from "@/components/admin/settings-form";
import { AdminChangePasswordForm } from "@/components/admin/change-password-form";
import { getAdminUser } from "@/lib/admin-rbac";
import { hasPermission } from "@/lib/admin-roles";

export const dynamic = "force-dynamic";

// Auth is inherited from src/app/admin/(protected)/layout.tsx, same as
// every other page in this route group.
export default async function AdminSettingsPage() {
  const [settings, me] = await Promise.all([getAppSettings(), getAdminUser()]);
  const canEditSite = me.ok && hasPermission(me.accessLevel, "ADMIN");
  const passwordMode = !me.ok || me.kind === "owner" ? "owner" : me.kind === "env" ? "google-only" : "staff";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          Site <span className="signalflow-gold-text">Settings</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn platform features on or off instantly — no code change or redeploy needed. Changes
          apply immediately for every visitor.
        </p>
      </div>
      {canEditSite ? (
        <AdminSettingsForm initial={settings} />
      ) : (
        <p className="signalflow-glass rounded-2xl border border-white/5 p-5 text-sm text-muted-foreground">
          Site settings can only be changed by an Admin or Super Admin.
        </p>
      )}
      <AdminChangePasswordForm mode={passwordMode} />
    </div>
  );
}
