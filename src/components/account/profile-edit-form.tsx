"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/site/icons";
import { BROKER_OPTIONS, NEEDS_DEMAT_BROKER_VALUE } from "@/lib/brokers";
import { updateSubscriberProfile } from "@/app/account/profile/actions";
import { ProfilePhotoPicker } from "@/components/account/profile-photo-picker";
import { clientConfig } from "@/lib/client-config";

interface ProfileEditFormProps {
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialCurrentBroker: string | null;
  initialPhotoUrl: string | null;
}

/**
 * CTA shown when a subscriber has no broker on record, or has explicitly
 * flagged (via NEEDS_DEMAT_BROKER_VALUE in the Current Broker select) that
 * they need one — points them at opening a Demat account under our
 * referral. There's no self-service online referral link yet (broker
 * partner signup is still a manual, WhatsApp-confirmed flow — same as the
 * "Free Demat account" offer on the pricing page), so this routes to
 * WhatsApp rather than a direct broker URL.
 */
function NewDematAccountCta() {
  const brandName = clientConfig.brokerOffer?.brandName ?? "our partner broker";
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Don&apos;t have a Demat account yet? Open one with{" "}
        <span className="font-semibold signalflow-gold-text">{brandName}</span> under our referral.
      </p>
      <Button asChild size="sm" variant="outline" className="signalflow-glow w-fit shrink-0 gap-1.5">
        <a href={clientConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4" />
          Open New Demat Account
        </a>
      </Button>
    </div>
  );
}

/**
 * Lets a subscriber view and edit their own photo/Name/Phone/Email/Current
 * Broker on the account dashboard (src/app/account/profile/page.tsx).
 *
 * Plan, billing period, and Joined date used to live in this card too, but
 * now live on the "Plan & Billing" section of /account/subscriptions (see
 * membership-status-card.tsx) alongside every other purchase a subscriber
 * has made — this card is just their contact identity now, which is what
 * keeps it short.
 */
export function ProfileEditForm({
  initialName,
  initialPhone,
  initialEmail,
  initialCurrentBroker,
  initialPhotoUrl,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [currentBroker, setCurrentBroker] = useState(initialCurrentBroker ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // No broker on record at all, or they've explicitly flagged (via the
  // Current Broker select) that they need a Demat account.
  const initialNeedsDemat =
    !initialCurrentBroker || initialCurrentBroker === NEEDS_DEMAT_BROKER_VALUE;

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <ProfilePhotoPicker name={initialName} initialPhotoUrl={initialPhotoUrl} />
            <div>
              <h3 className="font-heading font-bold text-base">{initialName}</h3>
              <p className="text-xs text-muted-foreground">{initialPhone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className={initialCurrentBroker && initialCurrentBroker !== NEEDS_DEMAT_BROKER_VALUE ? "border-b border-white/5" : undefined}>
              <td className="w-[38%] py-2 pr-4 align-top text-xs text-muted-foreground">Email</td>
              <td className="py-2 font-heading font-semibold">{initialEmail}</td>
            </tr>
            {initialCurrentBroker && initialCurrentBroker !== NEEDS_DEMAT_BROKER_VALUE && (
              <tr>
                <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Current Broker</td>
                <td className="py-2 font-heading font-semibold">{initialCurrentBroker}</td>
              </tr>
            )}
          </tbody>
        </table>

        {initialNeedsDemat && <NewDematAccountCta />}
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

      <div className="flex items-center gap-4">
        <ProfilePhotoPicker name={initialName} initialPhotoUrl={initialPhotoUrl} />
        <p className="text-xs text-muted-foreground">
          Tap the camera icon to change your photo — it saves right away.
        </p>
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
        {currentBroker === NEEDS_DEMAT_BROKER_VALUE && <NewDematAccountCta />}
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
