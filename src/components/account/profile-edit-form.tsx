"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BROKER_OPTIONS } from "@/lib/brokers";
import { updateSubscriberProfile } from "@/app/account/profile/actions";
import { ContinuePremiumPanel } from "@/components/site/continue-premium-panel";
import type { PricingPlan } from "@/lib/client-config";

interface ProfileEditFormProps {
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialCurrentBroker: string | null;
  /** Pre-formatted, read-only — which pricing tier they registered under. */
  planLabel: string;
  /**
   * Pre-formatted, read-only — an *estimated* current-period range projected
   * from registration date + plan length (there's no real renewal tracking
   * yet, payment is still manual/off-platform). Both null together when the
   * subscriber has no billing cycle on record to project from.
   */
  periodStartLabel: string | null;
  periodEndLabel: string | null;
  /** Pre-formatted, read-only. */
  joinedLabel: string;
  /** For the Upgrade/Extend panels below the Plan row. */
  plans: PricingPlan[];
  currentPlanId?: PricingPlan["id"];
  upgradePlanId?: PricingPlan["id"];
  /** False once already on the top tier — nothing to upgrade to. */
  showUpgrade: boolean;
}

/**
 * Lets a subscriber view and edit their own Name/Phone/Email/Current Broker
 * on the account dashboard (src/app/account/profile/page.tsx). Plan, period
 * dates, and Joined date stay read-only — those aren't self-service fields
 * (a plan change routes through the Upgrade/Extend WhatsApp flow, not a
 * plain form edit).
 */
export function ProfileEditForm({
  initialName,
  initialPhone,
  initialEmail,
  initialCurrentBroker,
  planLabel,
  periodStartLabel,
  periodEndLabel,
  joinedLabel,
  plans,
  currentPlanId,
  upgradePlanId,
  showUpgrade,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [currentBroker, setCurrentBroker] = useState(initialCurrentBroker ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setName(initialName);
    setPhone(initialPhone);
    setEmail(initialEmail);
    setCurrentBroker(initialCurrentBroker ?? "");
    setError(null);
    setIsEditing(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateSubscriberProfile({
        name,
        phone,
        email,
        currentBroker: currentBroker || null,
      });
      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (!isEditing) {
    return (
      <div className="signalflow-glass signalflow-neutral-border flex flex-col gap-3 rounded-2xl border p-5">
        <div className="flex items-start justify-between">
          <h3 className="font-heading font-bold text-base">Your Info</h3>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-white/5">
              <td className="w-[38%] py-2 pr-4 align-top text-xs text-muted-foreground">Name</td>
              <td className="py-2 font-heading font-semibold">{initialName}</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Phone</td>
              <td className="py-2 font-heading font-semibold">{initialPhone}</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Email</td>
              <td className="py-2 font-heading font-semibold">{initialEmail}</td>
            </tr>
            {initialCurrentBroker && (
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Current Broker</td>
                <td className="py-2 font-heading font-semibold">{initialCurrentBroker}</td>
              </tr>
            )}
            <tr className="border-b border-white/5">
              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Plan</td>
              <td className="py-2 font-heading font-semibold">{planLabel}</td>
            </tr>
            {periodStartLabel && periodEndLabel && (
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Period (est.)</td>
                <td className="py-2 font-heading font-semibold">
                  {periodStartLabel} – {periodEndLabel}
                </td>
              </tr>
            )}
            <tr>
              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Joined</td>
              <td className="py-2 font-heading font-semibold">{joinedLabel}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
          {showUpgrade && (
            <ContinuePremiumPanel
              plans={plans}
              triggerLabel="Upgrade"
              defaultPlanId={upgradePlanId}
              initialPhone={initialPhone}
            />
          )}
          <ContinuePremiumPanel
            plans={plans}
            triggerLabel="Extend"
            defaultPlanId={currentPlanId}
            initialPhone={initialPhone}
          />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="signalflow-glass signalflow-gold-border flex flex-col gap-3 rounded-2xl border p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">Edit Your Info</h3>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Cancel editing"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-phone">Phone</Label>
        <Input
          id="profile-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground/70">
          This is also your login email — change it carefully.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-broker">Current Trading Broker</Label>
        <select
          id="profile-broker"
          value={currentBroker}
          onChange={(e) => setCurrentBroker(e.target.value)}
          className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="" className="bg-neutral-900 text-foreground">
            —
          </option>
          {BROKER_OPTIONS.map((broker) => (
            <option key={broker} value={broker} className="bg-neutral-900 text-foreground">
              {broker === "Other" ? "Other Broker" : broker}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-[var(--signalflow-loss)]">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="signalflow-glow signalflow-btn-gradient flex-1"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
