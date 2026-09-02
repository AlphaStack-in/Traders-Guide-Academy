"use client";

import { Fragment, useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn, formatSignalDate, formatSignalTime, formatUpdateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { formatInstrumentLabel } from "@/lib/instruments";
import { getActiveOrderBroker } from "@/lib/client-config";
import {
  postGeneralAdminUpdate,
  type AdminUpdateItem,
} from "@/app/admin/(protected)/signals/actions";

const ORDER_BROKER = getActiveOrderBroker();

interface FeedItem {
  id: string;
  message: string;
  createdAt: string;
  // Null for a general broadcast update (not tied to a specific signal) —
  // rendered without the instrument/strike tag those carry.
  context: string | null;
}

// Small always-available composer for posting a general "Admin Updates"
// message that isn't tied to any specific signal — usable even when there
// are zero ongoing trades, unlike the per-signal admin note field on
// Manage Signals which requires an actual open trade to attach to.
function GeneralUpdateComposer() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handlePost() {
    const trimmed = message.trim();
    if (!trimmed) {
      toast.error("Type a message first.");
      return;
    }
    startTransition(async () => {
      const result = await postGeneralAdminUpdate(trimmed);
      if (result.success) {
        toast.success("Posted — visible under Admin Updates.");
        setMessage("");
      } else {
        toast.error(result.error ?? "Failed to post update.");
      }
    });
  }

  return (
    <div className="mb-2.5 flex flex-col gap-1.5 border-b border-white/5 pb-2.5">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Post an update visible to subscribers (e.g. no signals today, market holiday)…"
        className="min-h-[52px] text-xs bg-black/40 border-white/10 focus:border-primary/50"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={handlePost}
          disabled={isPending}
          className="h-7 signalflow-glow signalflow-btn-gradient px-3 text-[11px]"
        >
          {isPending ? "Posting…" : "Post Update"}
        </Button>
      </div>
    </div>
  );
}

function instrumentPrefix(signal: SignalRow) {
  const label = formatInstrumentLabel(signal.instrument, signal.stockSymbol);
  return label ? `${label} ` : "";
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
  generalUpdates = [],
  editable = false,
  collapsible = false,
  defaultOpen = true,
}: {
  signals: SignalRow[];
  // Broadcast admin updates not tied to any specific signal (see
  // postGeneralAdminUpdate) — shown in the "Admin Updates" panel alongside
  // per-signal updates, regardless of how many trades are ongoing.
  generalUpdates?: AdminUpdateItem[];
  editable?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Same "re-sync when defaultOpen actually flips" pattern as
  // AddSignalSection — see that file for why. Here it's what makes this
  // section auto-expand the moment the first ongoing trade appears (or
  // auto-collapse once the last one closes), even though the sound-alert
  // poller's router.refresh() lands on an already-mounted component.
  const [prevDefaultOpen, setPrevDefaultOpen] = useState(defaultOpen);
  if (defaultOpen !== prevDefaultOpen) {
    setPrevDefaultOpen(defaultOpen);
    setOpen(defaultOpen);
  }
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

  // "Admin Updates" feed: general broadcast updates (no specific signal)
  // merged with each ongoing signal's own updates/note, newest first
  // overall — this used to be per-signal boxes only, which meant a message
  // with no signal attached had nowhere to go.
  const generalFeedItems: FeedItem[] = generalUpdates.map((u) => ({
    id: u.id,
    message: u.message,
    createdAt: u.createdAt,
    context: null,
  }));
  const perSignalFeedItems: FeedItem[] = signals.flatMap((signal) => {
    const updates =
      signal.adminUpdates && signal.adminUpdates.length > 0
        ? signal.adminUpdates
        : signal.adminNote
          ? [{ id: signal.id, message: signal.adminNote, createdAt: signal.adminNoteAt ?? signal.signalTime }]
          : [];
    const context = `${instrumentPrefix(signal)}${signal.strike} ${signal.optionType}`;
    return updates.map((u, idx) => ({
      id: u.id || `${signal.id}-note-${idx}`,
      message: u.message,
      createdAt: u.createdAt,
      context,
    }));
  });
  const feedItems = [...generalFeedItems, ...perSignalFeedItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="signalflow-glass signalflow-neutral-border mb-8 rounded-2xl border p-4 sm:p-6">
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
                <span className="font-heading text-base font-bold signalflow-gold-text">
                  {instrumentPrefix(signal)}{signal.strike} {signal.optionType}
                </span>
                <span>
                  · Entry @{" "}
                  <span
                    className={cn("font-heading text-base font-bold", "signalflow-gold-text")}
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
          <div className="signalflow-glass flex flex-1 flex-col items-center justify-center rounded-xl border border-white/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Avg Potential Gain
            </p>
            <p
              className={cn(
                "mt-1 font-heading text-2xl font-bold",
                isEmpty ? "text-muted-foreground" : "text-[var(--signalflow-win)]",
              )}
            >
              {isEmpty ? "—" : `+${avgGain.toFixed(1)}%`}
            </p>
          </div>
          <div className="signalflow-glass flex flex-1 flex-col items-center justify-center rounded-xl border border-white/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Avg Potential Risk
            </p>
            <p
              className={cn(
                "mt-1 font-heading text-2xl font-bold",
                isEmpty ? "text-muted-foreground" : "text-[var(--signalflow-loss)]",
              )}
            >
              {isEmpty ? "—" : `${avgLoss.toFixed(1)}%`}
            </p>
          </div>
          <div className="signalflow-glass flex flex-1 flex-col items-center justify-center rounded-xl border border-white/5 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Open Positions
            </p>
            <p className="mt-1 font-heading text-2xl font-bold signalflow-gold-text">{signals.length}</p>
          </div>
        </div>

        {/* id targeted by NotificationBell's click-to-navigate — lets a
            clicked notification jump straight to this panel via #admin-updates */}
        <div
          id="admin-updates"
          className="scroll-mt-24 rounded-xl border border-white/5 bg-black/10 p-3 lg:flex lg:h-full lg:flex-col"
        >
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Admin Updates
            </p>
          </div>

          {editable && <GeneralUpdateComposer />}

          {feedItems.length > 0 ? (
            <div className="max-h-[240px] overflow-y-auto pr-1 flex flex-col gap-2.5">
              {feedItems.map((item, idx) => (
                <div key={item.id} className={cn(idx > 0 && "border-t border-white/5 pt-2")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-semibold signalflow-gold-text">
                        {item.context ?? "General"}
                      </p>
                      <p className="whitespace-pre-line text-xs text-foreground/90">
                        {item.message}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground pt-0.5">
                      {formatUpdateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 w-full flex-col items-center justify-center gap-1 text-center">
              <p className="text-xs text-muted-foreground">No admin updates yet.</p>
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
                          {formatInstrumentLabel(signal.instrument, signal.stockSymbol) || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold">{signal.strike}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-1.5 py-0 text-[10px] font-bold",
                                signal.optionType === "CE"
                                  ? "border-[var(--signalflow-ce)]/50 text-[var(--signalflow-ce)]"
                                  : "border-[var(--signalflow-pe)]/50 text-[var(--signalflow-pe)]",
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
