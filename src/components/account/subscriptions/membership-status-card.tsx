"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContinuePremiumPanel } from "@/components/site/continue-premium-panel";
import { cancelMySubscription } from "@/app/account/billing/actions";
import { formatDateOnly } from "@/lib/utils";
import type { MembershipSummary, PlanBillingSummary } from "@/lib/subscriptions";

interface MembershipStatusCardProps {
  membership: MembershipSummary | null;
  /** Registration plan, Joined date, estimated period, and Upgrade/Extend data — see lib/subscriptions.ts. */
  planBilling: PlanBillingSummary;
  /** Prefills the Upgrade/Extend WhatsApp/checkout flow (see ContinuePremiumPanel). */
  phone: string;
}

/**
 * "Plan & Billing" card for /account/subscriptions — combines the recurring
 * signals-membership (Cashfree Autopay) status with the plain facts that
 * used to live in the Your Info card on /account/profile (registration
 * plan, Joined date, estimated billing period) plus the Upgrade/Extend
 * actions. Deliberately reuses the existing cancelMySubscription server
 * action (src/app/account/billing/actions.ts) rather than duplicating any
 * Cashfree logic.
 */
export function MembershipStatusCard({ membership, planBilling, phone }: MembershipStatusCardProps) {
  const router = useRouter();
  const [isCancelling, startCancelling] = useTransition();

  function handleCancel() {
    startCancelling(async () => {
      const result = await cancelMySubscription();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Autopay cancelled — you won't be charged again.");
      router.refresh();
    });
  }

  return (
    <div className="signalflow-glass signalflow-gold-border flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">
            Plan &amp; <span className="signalflow-gold-text">Billing</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your plan, renewal, and premium signals subscription.
          </p>
        </div>
        {membership?.isActive && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCancelling}
            onClick={handleCancel}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            {isCancelling ? "Cancelling…" : "Cancel Autopay"}
          </Button>
        )}
      </div>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr className="border-b border-white/5">
            <td className="w-[38%] py-2 pr-4 align-top text-xs text-muted-foreground">Plan</td>
            <td className="py-2 font-heading font-semibold">{planBilling.planLabel}</td>
          </tr>
          {membership ? (
            <tr className={membership.currentPeriodEnd ? "border-b border-white/5" : undefined}>
              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Autopay</td>
              <td className="py-2 font-heading font-semibold">
                {membership.statusLabel}
                {membership.currentPeriodEnd && (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    · renews {formatDateOnly(membership.currentPeriodEnd)}
                  </span>
                )}
              </td>
            </tr>
          ) : (
            planBilling.periodStartLabel &&
            planBilling.periodEndLabel && (
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Period (est.)</td>
                <td className="py-2 font-heading font-semibold">
                  {planBilling.periodStartLabel} – {planBilling.periodEndLabel}
                </td>
              </tr>
            )
          )}
          <tr>
            <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Joined</td>
            <td className="py-2 font-heading font-semibold">{planBilling.joinedLabel}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
        {planBilling.showUpgrade && (
          <ContinuePremiumPanel
            plans={planBilling.plans}
            triggerLabel="Upgrade"
            defaultPlanId={planBilling.upgradePlanId}
            initialPhone={phone}
            authenticated
          />
        )}
        <ContinuePremiumPanel
          plans={planBilling.plans}
          triggerLabel="Extend"
          defaultPlanId={planBilling.currentPlanId}
          initialPhone={phone}
          authenticated
        />
      </div>
    </div>
  );
}
