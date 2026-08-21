"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitReferral, getReferralsByPhone } from "@/app/contact/actions";

interface ReferralItem {
  id: string;
  referredName: string;
  referredPhone: string;
  createdAt: string;
}

const EMPTY = { referrerName: "", referrerPhone: "", referredName: "", referredPhone: "" };

export function ReferralForm() {
  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, startSubmitting] = useTransition();

  const [lookupPhone, setLookupPhone] = useState("");
  const [referrals, setReferrals] = useState<ReferralItem[] | null>(null);
  const [isLookingUp, startLookup] = useTransition();

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startSubmitting(async () => {
      const result = await submitReferral(form);
      if (result.success) {
        toast.success(`Thanks — we've noted your referral for ${form.referredName}.`);
        setForm({ ...EMPTY, referrerName: form.referrerName, referrerPhone: form.referrerPhone });
        if (lookupPhone === form.referrerPhone) {
          const refreshed = await getReferralsByPhone(form.referrerPhone);
          if (refreshed.success) setReferrals(refreshed.referrals);
        }
      } else {
        toast.error(result.error ?? "Failed to submit referral.");
      }
    });
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    startLookup(async () => {
      const result = await getReferralsByPhone(lookupPhone);
      if (result.success) {
        setReferrals(result.referrals);
        if (result.referrals.length === 0) {
          toast.info("No referrals found for that phone number yet.");
        }
      } else {
        toast.error(result.error ?? "Failed to look up referrals.");
      }
    });
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <div className="signalflow-glass signalflow-glow rounded-2xl border border-white/5 p-6">
        <h2 className="font-heading text-lg font-bold">
          Refer a <span className="signalflow-gold-text">Friend</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Know someone who&apos;d benefit from our signals? Let us know.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referrerName">Your Name</Label>
              <Input
                id="referrerName"
                required
                value={form.referrerName}
                onChange={(e) => set("referrerName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referrerPhone">Your Phone</Label>
              <Input
                id="referrerPhone"
                type="tel"
                required
                value={form.referrerPhone}
                onChange={(e) => set("referrerPhone", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referredName">Friend&apos;s Name</Label>
              <Input
                id="referredName"
                required
                value={form.referredName}
                onChange={(e) => set("referredName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referredPhone">Friend&apos;s Phone</Label>
              <Input
                id="referredPhone"
                type="tel"
                required
                value={form.referredPhone}
                onChange={(e) => set("referredPhone", e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="signalflow-glow signalflow-btn-gradient mt-1 w-fit"
          >
            {isSubmitting ? "Submitting…" : "Submit Referral"}
          </Button>
        </form>
      </div>

      <div className="signalflow-glass signalflow-glow rounded-2xl border border-white/5 p-6">
        <h2 className="font-heading text-lg font-bold">Your Referrals</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your phone number to see who you&apos;ve referred so far.
        </p>
        <form onSubmit={handleLookup} className="mt-4 flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="lookupPhone">Your Phone</Label>
            <Input
              id="lookupPhone"
              type="tel"
              required
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" disabled={isLookingUp} className="signalflow-glow">
            {isLookingUp ? "Checking…" : "Check"}
          </Button>
        </form>

        {referrals != null && (
          <div className="mt-4 flex flex-col gap-2">
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrals yet.</p>
            ) : (
              referrals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{r.referredName}</p>
                    <p className="text-xs text-muted-foreground">{r.referredPhone}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
