import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";

/**
 * Live, admin-editable site feature flags — see the admin Settings page
 * (src/app/admin/(protected)/settings). These replace what used to be
 * hardcoded booleans in client-config.ts (dhanConnectEnabled,
 * goodwillBrokerEnabled, digestEnabled, newsAlertsEnabled), which needed a
 * code change + redeploy to flip. Backed by the singleton AppSettings row
 * (prisma/schema.prisma) — read on every call rather than cached, since
 * this app's traffic is low enough that a single indexed findUnique per
 * request is negligible, and it keeps a toggle flip instant everywhere
 * with no cache-invalidation edge cases to reason about.
 */

const SETTINGS_ID = "singleton";

export type ActiveBroker = "dhan" | "goodwill" | null;

export interface AppSettingsData {
  digestEnabled: boolean;
  newsAlertsEnabled: boolean;
  brokerConnectEnabled: boolean;
  activeBroker: ActiveBroker;
}

// Only used the very first time this deployment runs after the AppSettings
// table is introduced, before any admin has saved anything from the
// Settings page yet — mirrors whatever client-config.ts previously had
// hardcoded, so turning this feature on doesn't silently change behavior
// for an existing deployment.
function defaultSettings(): AppSettingsData {
  const activeBroker: ActiveBroker = clientConfig.dhanConnectEnabled
    ? "dhan"
    : clientConfig.goodwillBrokerEnabled
      ? "goodwill"
      : null;
  return {
    digestEnabled: clientConfig.digestEnabled,
    newsAlertsEnabled: clientConfig.newsAlertsEnabled,
    brokerConnectEnabled: activeBroker !== null,
    activeBroker,
  };
}

export async function getAppSettings(): Promise<AppSettingsData> {
  const row = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!row) return defaultSettings();
  return {
    digestEnabled: row.digestEnabled,
    newsAlertsEnabled: row.newsAlertsEnabled,
    brokerConnectEnabled: row.brokerConnectEnabled,
    activeBroker: (row.activeBroker as ActiveBroker) ?? null,
  };
}

// The single source of truth for "which broker's connect/order-placement
// flow is live right now" — null whenever the master switch is off, even
// if a broker is still recorded as selected. Mirrors the old
// getActiveOrderBroker() in client-config.ts (now removed in favor of this
// DB-backed version).
export async function getActiveBroker(): Promise<ActiveBroker> {
  const settings = await getAppSettings();
  return settings.brokerConnectEnabled ? settings.activeBroker : null;
}

export async function updateAppSettings(
  partial: Partial<AppSettingsData>,
  updatedBy?: string | null,
): Promise<AppSettingsData> {
  const current = await getAppSettings();
  const merged: AppSettingsData = { ...current, ...partial };
  // Never leave a dangling activeBroker selection out of sync with the
  // master switch — turning brokerConnectEnabled off doesn't need to clear
  // activeBroker (so re-enabling remembers the last choice), but turning it
  // on with no broker chosen yet should stay a no-op broker-wise.
  const row = await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      digestEnabled: merged.digestEnabled,
      newsAlertsEnabled: merged.newsAlertsEnabled,
      brokerConnectEnabled: merged.brokerConnectEnabled,
      activeBroker: merged.activeBroker,
      updatedBy: updatedBy ?? null,
    },
    update: {
      digestEnabled: merged.digestEnabled,
      newsAlertsEnabled: merged.newsAlertsEnabled,
      brokerConnectEnabled: merged.brokerConnectEnabled,
      activeBroker: merged.activeBroker,
      updatedBy: updatedBy ?? null,
    },
  });
  return {
    digestEnabled: row.digestEnabled,
    newsAlertsEnabled: row.newsAlertsEnabled,
    brokerConnectEnabled: row.brokerConnectEnabled,
    activeBroker: (row.activeBroker as ActiveBroker) ?? null,
  };
}
