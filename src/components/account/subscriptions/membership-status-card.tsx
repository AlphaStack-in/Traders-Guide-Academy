"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ContinuePremiumPanel } from "@/components/site/continue-premium-panel";
import { cancelMySubscription } from "@/app/account/billing/actions";
import { formatDateOnly } from "@/lib/utils";
import { TerminalCard, ProgressRing, EyebrowBadge } from "@/components/account/subscriptions/ui";
import type { MembershipSummary, PlanBillingSummary } from "@/lib/subscriptions";

interface MembershipStatusCardProps {
  membership: MembershipSummary | null;
  /** Registration plan, Joined date, estimated period, and Upgrade/Extend data — see lib/subscriptions.ts. */
  planBilling: PlanBillingSummary;
  /** Prefills the Upgrade/Extend WhatsApp/checkout flow (see ContinuePremiumPanel). */
  phone: string;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-200">{value}</span>
    </div>
  );
}

/**
 * "Plan & Billing" card for /account/subscriptions — the dashboard's
 * flagship card: combines the recurring signals-membership (Cashfree
 * Autopay) status with the plain facts that used to live in the Your Info
 * card on /account/profile (registration plan, Joined date, estimated
 * billing period), a progress ring for the current period
 * (planBilling.progress — see lib/subscriptions.ts), and the Upgrade/Extend
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

  const periodLabel = membership?.currentPeriodEnd
    ? `Renews ${formatDateOnly(membership.currentPeriodEnd)}`
    : planBilling.periodStartLabel && planBilling.periodEndLabel
      ? `${planBilling.periodStartLabel} – ${planBilling.periodEndLabel}`
      : null;

  return (
    <TerminalCard
      title={
        <>
          Plan &amp; <span className="signalflow-gold-text">Billing</span>
        </>
      }
      subtitle="Your plan, renewal, and premium signals subscription."
      accent="primary"
      action={
        membership?.isActive && (
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
        )
      }
    >
      <div className="flex items-center justify-between gap-3">
        <EyebrowBadge tone={membership?.isActive ? "win" : "primary"} pulse={!!membership?.isActive}>
          {membership ? membership.statusLabel : "Registered"}
        </EyebrowBadge>
        {membership && (
          <span className="text-[10px] font-mono text-muted-foreground">{membership.billingCycleLabel}</span>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</p>
        <h3 className="mt-0.5 font-heading text-lg font-extrabold text-white">{planBilling.planLabel}</h3>
      </div>

      {planBilling.progress && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="space-y-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {membership?.currentPeriodEnd ? "Current Period" : "Estimated Period"}
            </span>
            {periodLabel && <p className="text-xs font-semibold text-white">{periodLabel}</p>}
            <span className="inline-block font-mono text-[11px] font-semibold text-[var(--signalflow-win)]">
              {planBilling.progress.daysRemaining} days remaining
            </span>
          </div>
          <ProgressRing percent={planBilling.progress.percent} />
        </div>
      )}

      <div className="pt-1">
        <DetailRow label="Joined" value={planBilling.joinedLabel} />
      </div>

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
    </TerminalCard>
  );
}
