"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  updateSubscriberPreferences,
  type SubscriberPreferences,
} from "@/app/account/settings/actions";

interface SubscriberSettingsFormProps {
  initial: SubscriberPreferences;
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({ title, description, checked, disabled, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SubscriberSettingsForm({ initial }: SubscriberSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState<SubscriberPreferences>(initial);

  function persist(partial: Partial<SubscriberPreferences>, successMessage: string) {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    startTransition(async () => {
      const result = await updateSubscriberPreferences(partial);
      if (!result.success) {
        toast.error(result.error ?? "Couldn't save that setting.");
        setPrefs(prefs); // revert optimistic update
        return;
      }
      toast.success(successMessage);
    });
  }

  return (
    <section className="signalflow-glass signalflow-gold-border rounded-2xl border p-5">
      <h2 className="font-heading text-lg font-bold">
        Notification <span className="signalflow-gold-text">Preferences</span>
      </h2>
      <div className="mt-2 divide-y divide-white/5">
        <ToggleRow
          title="Weekly performance digest email"
          description="A weekly summary of win rate and signals sent to your email. Off means you're unsubscribed."
          checked={!prefs.emailDigestOptOut}
          disabled={isPending}
          onCheckedChange={(checked) =>
            persist(
              { emailDigestOptOut: !checked },
              checked ? "You'll receive the weekly digest email." : "You're unsubscribed from the weekly digest.",
            )
          }
        />
        <ToggleRow
          title="Notification bell alerts"
          description="Instant alerts in the bell icon (top nav) for new signals and admin updates."
          checked={prefs.notificationsEnabled}
          disabled={isPending}
          onCheckedChange={(checked) =>
            persist(
              { notificationsEnabled: checked },
              checked ? "Notification bell alerts turned on." : "Notification bell alerts turned off.",
            )
          }
        />
      </div>
    </section>
  );
}
