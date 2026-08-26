import Link from "next/link";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";

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
export function PaymentDetailsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-black/20 p-4 text-sm",
        className,
      )}
    >
      <p className="font-heading font-semibold">
        Pay ₹{clientConfig.batchInfo.priceInr.toLocaleString("en-IN")} via UPI
      </p>
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
