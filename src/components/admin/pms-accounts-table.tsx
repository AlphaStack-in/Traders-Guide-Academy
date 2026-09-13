"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateOnly, formatFullTimestamp } from "@/lib/utils";
import { formatPriceInPaise } from "@/lib/products";
import { addPmsValuationEntry } from "@/app/admin/(protected)/pms-accounts/actions";

export interface PmsAccountRow {
  purchaseId: string;
  subscriberName: string;
  subscriberPhone: string;
  productName: string;
  purchasedAt: string;
  contributedAmountInPaise: number;
  latestValueInPaise: number | null;
  latestAsOfDate: string | null;
  valuationCount: number;
}

function AddValuationForm({ purchaseId, onDone }: { purchaseId: string; onDone: () => void }) {
  const router = useRouter();
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const currentValueInRupees = Number(value);
    startTransition(async () => {
      const result = await addPmsValuationEntry({
        productPurchaseId: purchaseId,
        asOfDate,
        currentValueInRupees,
        note: note || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Valuation added.");
      setValue("");
      setNote("");
      onDone();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-end sm:gap-2"
    >
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor={`asOfDate-${purchaseId}`} className="text-xs">
          As of date
        </Label>
        <Input
          id={`asOfDate-${purchaseId}`}
          type="date"
          required
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <Label htmlFor={`value-${purchaseId}`} className="text-xs">
          Current value (₹)
        </Label>
        <Input
          id={`value-${purchaseId}`}
          type="number"
          min={0}
          step="1"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <div className="flex flex-[2] flex-col gap-1">
        <Label htmlFor={`note-${purchaseId}`} className="text-xs">
          Note (optional)
        </Label>
        <Input
          id={`note-${purchaseId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Q3 fund NAV update"
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="shrink-0">
        {isPending ? "Saving…" : "Add"}
      </Button>
    </form>
  );
}

export function PmsAccountsTable({ accounts }: { accounts: PmsAccountRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No PMS purchases on record yet — this fills in once someone buys the PMS product.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((account) => {
        const growthPercent =
          account.latestValueInPaise != null
            ? ((account.latestValueInPaise - account.contributedAmountInPaise) /
                account.contributedAmountInPaise) *
              100
            : null;
        const open = openId === account.purchaseId;
        return (
          <div key={account.purchaseId} className="rounded-xl border border-white/10 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-heading font-semibold">
                  {account.subscriberName}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({account.subscriberPhone})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {account.productName} · joined {formatDateOnly(account.purchasedAt)} · contributed{" "}
                  {formatPriceInPaise(account.contributedAmountInPaise)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <p className="font-heading font-semibold">
                    {account.latestValueInPaise != null
                      ? formatPriceInPaise(account.latestValueInPaise)
                      : "No valuation yet"}
                  </p>
                  {growthPercent != null && (
                    <p
                      className="text-xs"
                      style={{
                        color:
                          growthPercent >= 0 ? "var(--signalflow-win)" : "var(--signalflow-loss)",
                      }}
                    >
                      {growthPercent >= 0 ? "+" : ""}
                      {growthPercent.toFixed(1)}% · {account.valuationCount} update
                      {account.valuationCount === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenId(open ? null : account.purchaseId)}
                >
                  {open ? "Close" : "Add valuation"}
                </Button>
              </div>
            </div>
            {account.latestAsOfDate && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Last updated {formatFullTimestamp(account.latestAsOfDate)}
              </p>
            )}
            {open && (
              <AddValuationForm purchaseId={account.purchaseId} onDone={() => setOpenId(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
