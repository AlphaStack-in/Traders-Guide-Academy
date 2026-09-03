"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  updateAppSettings,
  type ActiveBroker,
  type AppSettingsData,
} from "@/lib/app-settings";

export async function saveAppSettings(
  partial: Partial<AppSettingsData>,
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  // Dhan and Goodwill are mutually exclusive (see client-config.ts's old
  // comment on goodwillBrokerEnabled) — guard it here too, not just in the
  // form, since this is the actual trust boundary.
  const broker = partial.activeBroker as ActiveBroker | undefined;
  if (broker !== undefined && broker !== null && broker !== "dhan" && broker !== "goodwill") {
    return { success: false, error: "Unknown broker." };
  }

  await updateAppSettings(partial, admin.email);

  // Revalidate every page whose nav or content depends on these flags.
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");

  return { success: true };
}
