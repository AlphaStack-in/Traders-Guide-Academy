"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelMySubscription } from "@/app/account/billing/actions";
import { formatDateOnly } from "@/lib/utils";
import type { MembershipSummary } from "@/lib/subscriptions";

/**
 * Signals-membership (Cashfree Autopay) status card for /account/subscriptions.
 * Deliberately reuses the existing cancelMySubscription server action
 * (src/app/account/billing/actions.ts) rather than duplicating any Cashfree
 * logic — this is a new view over the same data already shown inline on
 * /account/profile, not a parallel implementation.
 */
export function MembershipStatusCard({ membership }: { membership: MembershipSummary | null }) {
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
            Signals <span className="signalflow-gold-text">Membership</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your recurring premium signals subscription.
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

      {membership ? (
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-white/5">
              <td className="w-[38%] py-2 pr-4 align-top text-xs text-muted-foreground">Plan</td>
              <td className="py-2 font-heading font-semibold">{membership.billingCycleLabel}</td>
            </tr>
            <tr className={membership.currentPeriodEnd ? "border-b border-white/5" : undefined}>
              <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Status</td>
              <td className="py-2 font-heading font-semibold">{membership.statusLabel}</td>
            </tr>
            {membership.currentPeriodEnd && (
              <tr>
                <td className="py-2 pr-4 align-top text-xs text-muted-foreground">Renews</td>
                <td className="py-2 font-heading font-semibold">
                  {formatDateOnly(membership.currentPeriodEnd)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted-foreground">
          No online Autopay subscription on record yet — see your Profile page for the manual
          payment/renewal flow.
        </p>
      )}
    </div>
  );
}
