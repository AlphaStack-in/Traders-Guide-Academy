import { getAppSettings } from "@/lib/app-settings";
import { AdminSettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

// Auth is inherited from src/app/admin/(protected)/layout.tsx, same as
// every other page in this route group.
export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

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
      <AdminSettingsForm initial={settings} />
    </div>
  );
}
