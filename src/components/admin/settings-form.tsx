"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveAppSettings } from "@/app/admin/(protected)/settings/actions";
import type { ActiveBroker, AppSettingsData } from "@/lib/app-settings";
import { cn } from "@/lib/utils";

interface AdminSettingsFormProps {
  initial: AppSettingsData;
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

const BROKER_OPTIONS: { value: Exclude<ActiveBroker, null>; label: string; description: string }[] = [
  {
    value: "dhan",
    label: "Dhan",
    description: "Personal-token connect — subscribers link their own Dhan account.",
  },
  {
    value: "goodwill",
    label: "Goodwill",
    description: "Manual order-request flow (GIGAPRO) — no live order API yet.",
  },
];

export function AdminSettingsForm({ initial }: AdminSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<AppSettingsData>(initial);

  function persist(partial: Partial<AppSettingsData>, successMessage: string) {
    const next = { ...settings, ...partial };
    setSettings(next);
    startTransition(async () => {
      const result = await saveAppSettings(partial);
      if (!result.success) {
        toast.error(result.error ?? "Couldn't save that setting.");
        setSettings(settings); // revert optimistic update
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="signalflow-glass signalflow-gold-border rounded-2xl border p-5">
        <h2 className="font-heading text-lg font-bold">
          Broker <span className="signalflow-gold-text">Connect</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lets subscribers place real orders straight from ongoing trade signals. Dhan and
          Goodwill are mutually exclusive — only one broker can be live at a time. More brokers
          can be added to the list below later.
        </p>
        <div className="mt-2 divide-y divide-white/5">
          <ToggleRow
            title="Enable broker connect"
            description="Master switch — turning this off hides all broker-connect UI regardless of which broker is selected below."
            checked={settings.brokerConnectEnabled}
            disabled={isPending}
            onCheckedChange={(checked) =>
              persist(
                { brokerConnectEnabled: checked },
                checked ? "Broker connect enabled." : "Broker connect disabled.",
              )
            }
          />
        </div>
        <div
          className={cn(
            "mt-2 flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3",
            !settings.brokerConnectEnabled && "pointer-events-none opacity-40",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active broker
          </p>
          {BROKER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 transition-colors",
                settings.activeBroker === option.value && "border-primary/40 bg-primary/10",
              )}
            >
              <input
                type="radio"
                name="active-broker"
                className="mt-1 h-3.5 w-3.5 accent-[var(--primary)]"
                checked={settings.activeBroker === option.value}
                disabled={isPending || !settings.brokerConnectEnabled}
                onChange={() =>
                  persist({ activeBroker: option.value }, `${option.label} is now the active broker.`)
                }
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="signalflow-glass signalflow-gold-border rounded-2xl border p-5">
        <h2 className="font-heading text-lg font-bold">
          Communications &amp; <span className="signalflow-gold-text">Content</span>
        </h2>
        <div className="mt-2 divide-y divide-white/5">
          <ToggleRow
            title="Weekly performance digest email"
            description="Sends the scheduled weekly win-rate summary email to subscribers who haven't opted out."
            checked={settings.digestEnabled}
            disabled={isPending}
            onCheckedChange={(checked) =>
              persist(
                { digestEnabled: checked },
                checked ? "Weekly digest email enabled." : "Weekly digest email disabled.",
              )
            }
          />
          <ToggleRow
            title="News & Market Alerts panel"
            description="Shows the market news/alerts section on the home page."
            checked={settings.newsAlertsEnabled}
            disabled={isPending}
            onCheckedChange={(checked) =>
              persist(
                { newsAlertsEnabled: checked },
                checked ? "News & Market Alerts panel enabled." : "News & Market Alerts panel disabled.",
              )
            }
          />
        </div>
      </section>
    </div>
  );
}
