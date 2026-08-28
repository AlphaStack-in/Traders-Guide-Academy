"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { BillingCycle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/site/icons";
import { SubscriptionCheckoutButton } from "@/components/site/subscription-checkout-button";
import { clientConfig, type PricingPlan } from "@/lib/client-config";
import { checkExistingMember } from "@/app/register/actions";
import { cn } from "@/lib/utils";

function toWhatsAppLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/**
 * Shared "confirm existing membership, then pay" flow. Used both on the
 * home page pricing section (as "Continue Premium", for a not-yet-identified
 * visitor) and on the account profile page (as "Upgrade" / "Extend" next to
 * the subscriber's current plan — see profile-edit-form.tsx).
 *
 * When `authenticated` is true (the profile-page case — the visitor already
 * has a subscriber session), a real self-service Cashfree Autopay checkout
 * (SubscriptionCheckoutButton) is the primary action once their membership
 * is confirmed, with "Continue via WhatsApp" kept as a manual fallback.
 * When false (the anonymous home-page case), we can't safely start a
 * billing mandate without knowing who's actually logged in, so the primary
 * action is "Log in to renew" instead, WhatsApp still offered as a
 * no-login-required fallback.
 */
export function ContinuePremiumPanel({
  plans,
  triggerLabel = "Continue Premium",
  defaultPlanId,
  initialPhone = "",
  authenticated = false,
}: {
  plans: PricingPlan[];
  triggerLabel?: string;
  defaultPlanId?: PricingPlan["id"];
  initialPhone?: string;
  /** True when rendered for an already-logged-in subscriber (the account
   * profile page's Upgrade/Extend buttons) — enables real self-service
   * checkout instead of just the WhatsApp handoff. */
  authenticated?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(
    defaultPlanId ?? plans.find((p) => p.highlight)?.id ?? plans[0]?.id,
  );
  const [phone, setPhone] = useState(initialPhone);
  const [result, setResult] = useState<{ found: boolean; name: string | null } | null>(null);
  const [isChecking, startChecking] = useTransition();

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0];

  function handleCheck() {
    if (phone.replace(/\D/g, "").length < 8) return;
    startChecking(async () => {
      const data = await checkExistingMember(phone);
      setResult(data);
    });
  }

  if (!open) {
    return (
      <Button
        variant={clientConfig.logoAccent ? undefined : "outline"}
        size="sm"
        className={cn(
          "signalflow-glow w-fit shrink-0 gap-1.5 rounded-full text-xs font-semibold",
          clientConfig.logoAccent && "border-0",
        )}
        style={
          clientConfig.logoAccent
            ? { backgroundColor: clientConfig.logoAccent, color: "#fff" }
            : undefined
        }
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
    );
  }

  const manager = clientConfig.paymentInfo.managers[0];

  return (
    <div className="signalflow-glass mt-3 w-full rounded-xl border border-white/5 p-4 sm:basis-full">
      <p className="text-sm font-medium text-foreground">Which plan are you continuing on?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPlanId(p.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              p.id === selectedPlanId
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-white/10 text-muted-foreground hover:border-white/20",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">
        Enter your registered phone number to confirm your membership.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setResult(null);
          }}
          placeholder="Phone number"
          inputMode="tel"
          className="sm:flex-1"
        />
        <Button
          className="signalflow-glow signalflow-btn-gradient"
          disabled={isChecking}
          onClick={handleCheck}
        >
          {isChecking ? "Checking…" : "Validate"}
        </Button>
      </div>

      {result && selectedPlan && (
        <div className="mt-3">
          {result.found ? (
            <div className="rounded-lg border border-[var(--signalflow-win)]/40 bg-[var(--signalflow-win)]/10 p-3 text-sm">
              <p className="text-foreground/90">
                {result.name ? `Welcome back, ${result.name}!` : "Membership confirmed!"}{" "}
                Continue on the {selectedPlan.label} plan at{" "}
                <span className="font-semibold text-[var(--signalflow-win)]">
                  ₹{selectedPlan.existingMemberPriceInr.toLocaleString("en-IN")}
                </span>
                .
              </p>

              {authenticated ? (
                <>
                  <SubscriptionCheckoutButton
                    billingCycle={selectedPlan.id.toUpperCase() as BillingCycle}
                    label={`Pay ₹${selectedPlan.existingMemberPriceInr.toLocaleString("en-IN")} & enable Autopay`}
                    className="signalflow-btn-gradient mt-3 w-full"
                    size="sm"
                  />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Autopay charges this amount automatically each {selectedPlan.periodLabel.replace("/", "")} via UPI —
                    cancel anytime from your account. Prefer to arrange payment manually instead?{" "}
                    {manager && (
                      <a
                        href={toWhatsAppLink(
                          manager.phone,
                          `Hi, I'd like to continue my premium membership on the ${selectedPlan.label} plan at the existing-member price of ₹${selectedPlan.existingMemberPriceInr}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Continue via WhatsApp
                      </a>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <Button asChild size="sm" className="signalflow-glow signalflow-btn-gradient mt-3 w-full">
                    <Link href="/login?redirectTo=/account/profile">Log in to renew</Link>
                  </Button>
                  {manager && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Prefer not to log in?{" "}
                      <a
                        href={toWhatsAppLink(
                          manager.phone,
                          `Hi, I'd like to continue my premium membership on the ${selectedPlan.label} plan at the existing-member price of ₹${selectedPlan.existingMemberPriceInr}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        Continue via WhatsApp
                      </a>{" "}
                      instead.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
              We couldn&apos;t find an existing membership for that number.{" "}
              <Link href="/register" className="text-primary underline underline-offset-2">
                Register as a new member
              </Link>{" "}
              instead.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
