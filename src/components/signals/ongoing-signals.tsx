"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn, formatSignalDate, formatSignalTime, formatUpdateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PlaceOrderTrigger } from "@/components/account/place-order-trigger";
import { OrderExpansionPanel } from "@/components/account/order-expansion-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OngoingRiskRewardChart } from "@/components/admin/dashboard-charts";
import { ManageSignalsTable } from "@/components/admin/manage-signals-table";
import type { SignalRow } from "@/components/signals/signals-explorer";
import { INSTRUMENT_LABEL } from "@/lib/instruments";
import { clientConfig, getActiveOrderBroker } from "@/lib/client-config";

const ORDER_BROKER = getActiveOrderBroker();

function instrumentPrefix(signal: SignalRow) {
  return signal.instrument ? `${INSTRUMENT_LABEL[signal.instrument]} ` : "";
}

function toRiskReward(signal: SignalRow) {
  const bestTarget = signal.targets.length > 0 ? Math.max(...signal.targets) : signal.entryPrice;
  const gainPercent = Math.abs(((bestTarget - signal.entryPrice) / signal.entryPrice) * 100);
  const lossPercent = -Math.abs(
    ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100,
  );
  return {
    label: `${instrumentPrefix(signal)}${signal.strike}${signal.optionType}`,
    buyPrice: signal.entryPrice,
    sellTargetPrice: bestTarget,
    sellSlPrice: signal.stopLoss,
    gainPercent: Math.round(gainPercent * 100) / 100,
    lossPercent: Math.round(lossPercent * 100) / 100,
  };
}

export function OngoingSignals({
  signals,
  editable = false,
  collapsible = false,
  defaultOpen = true,
}: {
  signals: SignalRow[];
  editable?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const showBody = !collapsible || open;

  function toggleOrderExpanded(signalId: string) {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(signalId)) next.delete(signalId);
      else next.add(signalId);
      return next;
    });
  }
  const isEmpty = signals.length === 0;
  const chartData = signals.map(toRiskReward);
  const avgGain = chartData.length
    ? chartData.reduce((sum, d) => sum + d.gainPercent, 0) / chartData.length
    : 0;
  const avgLoss = chartData.length
    ? chartData.reduce((sum, d) => sum + d.lossPercent, 0) / chartData.length
    : 0;

  return (
    <div className="thc-glass thc-neutral-border mb-8 rounded-2xl border p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                isEmpty ? "bg-muted-foreground/40" : "bg-primary",
              )}
            />
            <h2 className="font-heading text-sm font-semibold">
              {signals.length} Ongoing Trade{signals.length === 1 ? "" : "s"}
            </h2>
          </div>
          {!isEmpty &&
            showBody &&
            signals.map((signal) => (
              <span
                key={signal.id}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-muted-foreground"
              >
                <span className="font-heading text-base font-bold thc-gold-text">
                  {instrumentPrefix(signal)}{signal.strike} {signal.optionType}
                </span>
                <span>
                  · Entry @{" "}
                  <span
                    className={cn(
                      "font-heading text-base font-bold",
                      // The blue gradient clip reads poorly on this small chip
                      // for StockOps — plain bright text is more legible there,
                      // while THC's gold gradient stays as-is.
                      clientConfig.id === "stockops" ? "text-foreground" : "thc-gold-text",
                    )}
                  >
                    ₹{signal.entryPrice}
                  </span>
                </span>
              </span>
            ))}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
            aria-label={open ? "Collapse Ongoing Trades" : "Expand Ongoing Trades"}
          >
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        )}
      </div>

      {showBody && (
        <>
      <div className="grid gap-4 lg:grid-cols-[2fr_minmax(120px,0.7fr)_2fr]">
        <div className="rounded-xl border border-white/5 bg-black/10 p-3 lg:flex lg:h-full lg:items-stretch">
          {isEmpty ? (
            <div className="flex h-[140px] w-full flex-col items-center justify-center gap-1 text-center lg:h-full">
              <p className="text-xs text-muted-foreground">
                No open trades right now — the risk/reward chart will populate once a signal goes
                live.
              </p>
            </div>
          ) : (
            <div className="h-full w-full">
              <OngoingRiskRewardChart data={chartData} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:h-full">
          <div className="thc-glass flex flex-1 flex-col items-center justify-center rounded-xl border border-white/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Avg Potential Gain
            </p>
            <p
              className={cn(
                "mt-1 font-heading text-2xl font-bold",
                isEmpty ? "text-muted-foreground" : "text-[var(--thc-win)]",
              )}
            >
              {isEmpty ? "—" : `+${avgGain.toFixed(1)}%`}
            </p>
          </div>
          <div className="thc-glass flex flex-1 flex-col items-center justify-center rounded-xl border border-white/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Avg Potential Risk
            </p>
            <p
              className={cn(
                "mt-1 font-heading text-2xl font-bold",
                isEmpty ? "text-muted-foreground" : "text-[var(--thc-loss)]",
              )}
            >
              {isEmpty ? "—" : `${avgLoss.toFixed(1)}%`}
            </p>
          </div>
          <div className="thc-glass flex flex-1 flex-col items-center justify-center rounded-xl border border-white/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Open Positions
            </p>
            <p className="mt-1 font-heading text-2xl font-bold thc-gold-text">{signals.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/10 p-3 lg:flex lg:h-full lg:flex-col">
          {signals.some((signal) => (signal.adminUpdates && signal.adminUpdates.length > 0) || signal.adminNote) ? (
            <div className="flex w-full flex-col gap-3">
              {signals
                .filter((signal) => (signal.adminUpdates && signal.adminUpdates.length > 0) || signal.adminNote)
                .map((signal) => {
                  const updates =
                    signal.adminUpdates && signal.adminUpdates.length > 0
                      ? signal.adminUpdates
                      : signal.adminNote
                        ? [{ id: signal.id, message: signal.adminNote, createdAt: signal.adminNoteAt ?? signal.signalTime }]
                        : [];
                  return (
                    <div
                      key={signal.id}
                      className="thc-glass rounded-xl border border-primary/20 bg-primary/5 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Update on {instrumentPrefix(signal)}{signal.strike} {signal.optionType}
                        </p>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto pr-1 flex flex-col gap-2.5">
                        {updates.map((update, idx) => (
                          <div key={update.id || idx} className={cn(idx > 0 && "border-t border-white/5 pt-2")}>
                            <div className="flex items-start justify-between gap-2">
                              <p className="whitespace-pre-line text-xs text-foreground/90">
                                {update.message}
                              </p>
                              <p className="shrink-0 text-xs text-muted-foreground pt-0.5">
                                {formatUpdateTime(update.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex h-[140px] w-full flex-col items-center justify-center gap-1 text-center lg:h-full">
              <p className="text-xs text-muted-foreground">
                No admin updates on open trades yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {editable ? (
          <ManageSignalsTable signals={signals} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/10 hover:bg-transparent">
                  <TableHead>Instrument</TableHead>
                  <TableHead>Strike</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>SL</TableHead>
                  <TableHead>Target(s)</TableHead>
                  <TableHead>Since</TableHead>
                  {ORDER_BROKER && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isEmpty ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={ORDER_BROKER ? 7 : 6}
                      className="py-6 text-center text-xs text-muted-foreground"
                    >
                      No ongoing trades at the moment.
                    </TableCell>
                  </TableRow>
                ) : (
                  signals.map((signal) => (
                    <Fragment key={signal.id}>
                      <TableRow className="border-b-white/5">
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {signal.instrument ? INSTRUMENT_LABEL[signal.instrument] : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold">{signal.strike}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0 text-[10px] font-bold",
                                signal.optionType === "CE"
                                  ? "border-[var(--thc-ce)]/50 text-[var(--thc-ce)]"
                                  : "border-[var(--thc-pe)]/50 text-[var(--thc-pe)]",
                              )}
                            >
                              {signal.optionType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{signal.entryPrice}</TableCell>
                        <TableCell>{signal.stopLoss}</TableCell>
                        <TableCell>{signal.targets.join(", ")}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatSignalDate(signal.signalTime)}{" "}
                          {formatSignalTime(signal.signalTime)}
                        </TableCell>
                        {ORDER_BROKER && (
                          <TableCell>
                            <PlaceOrderTrigger
                              signalId={signal.id}
                              brokerType={ORDER_BROKER}
                              expanded={expandedOrderIds.has(signal.id)}
                              onToggle={() => toggleOrderExpanded(signal.id)}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                      {ORDER_BROKER && expandedOrderIds.has(signal.id) && (
                        <TableRow className="border-b-white/5 hover:bg-transparent">
                          <TableCell colSpan={7} className="bg-black/10 py-3">
                            <OrderExpansionPanel signalId={signal.id} brokerType={ORDER_BROKER} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
