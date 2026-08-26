import Link from "next/link";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";

interface PaymentDetailsCardProps {
  className?: string;
  /**
   * The specific plan being paid for (label + price). Omit to show all
   * pricing tiers instead — used on the account dashboard for a subscriber
   * with no billingCycle on record yet (e.g. created before this field
   * existed), where assuming a specific plan would be misleading.
   */
  plan?: { label: string; priceInr: number; periodLabel: string } | null;
}

/**
 * The manual UPI-payment instructions (price, UPI IDs, contact managers,
 * refund policy). Shared between the post-registration success screen
 * (src/components/register/register-form.tsx) and the account dashboard
 * (src/app/account/profile/page.tsx) so subscribers can always come back
 * to it, not just see it once right after registering.
 *
 * There's no payment-status field on Subscriber yet — this only ever
 * displays the payment instructions themselves, matching how payment is
 * actually tracked today (manually, off-platform, by the admin/managers).
 */
export function PaymentDetailsCard({ className, plan }: PaymentDetailsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-black/20 p-4 text-sm",
        className,
      )}
    >
      {plan ? (
        <p className="font-heading font-semibold">
          Pay ₹{plan.priceInr.toLocaleString("en-IN")} via UPI{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({plan.label} plan{plan.periodLabel})
          </span>
        </p>
      ) : (
        <div>
          <p className="font-heading font-semibold">Pay via UPI</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
            {clientConfig.pricingPlans.map((p) => (
              <li key={p.id}>
                {p.label}:{" "}
                <span className="font-medium text-foreground">
                  ₹{p.priceInr.toLocaleString("en-IN")}
                </span>
                {p.periodLabel}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
        {clientConfig.paymentInfo.upiIds.map((upi) => (
          <li key={upi.vpa}>
            <span className="font-medium text-foreground">{upi.vpa}</span> ({upi.name})
          </li>
        ))}
      </ul>
      <p className="mt-3 font-heading font-semibold">Questions? Contact</p>
      <ul className="mt-1 flex flex-col gap-1 text-muted-foreground">
        {clientConfig.paymentInfo.managers.map((manager) => (
          <li key={manager.phone}>
            {manager.name} —{" "}
            <a href={`tel:${manager.phone}`} className="text-primary">
              {manager.phone}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground/70">
        {clientConfig.batchInfo.refundPolicy}{" "}
        <Link href="/terms" className="text-primary underline underline-offset-2">
          T &amp; C
        </Link>
      </p>
    </div>
  );
}
