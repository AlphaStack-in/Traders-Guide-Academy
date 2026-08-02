"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn, formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INSTRUMENTS, INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

export interface SignalRow {
  id: string;
  strike: number;
  optionType: "CE" | "PE";
  instrument: InstrumentLiteral | null;
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  sellPrice: number | null;
  pnlPercent: number | null;
  status: "OPEN" | "TARGET_HIT" | "SL_HIT" | "CLOSED_MANUAL";
  signalTime: string;
  adminNote: string | null;
  adminNoteAt: string | null;
}

const STATUS_LABEL: Record<SignalRow["status"], string> = {
  OPEN: "Open*",
  TARGET_HIT: "Target Hit",
  SL_HIT: "SL Hit",
  CLOSED_MANUAL: "Closed",
};

type OptionFilter = "ALL" | "CE" | "PE";
type InstrumentFilter = "ALL" | InstrumentLiteral;
type ResultFilter = "ALL" | "WIN" | "LOSS" | "OPEN";
type SortColumn = "date" | "strike" | "entry" | "sl" | "pnl";
type SortDirection = "asc" | "desc";

function outcomeClass(pnlPercent: number | null) {
  if (pnlPercent == null) return "border-l-[var(--thc-gold-start)]";
  if (pnlPercent > 0) return "border-l-[var(--thc-win)]";
  if (pnlPercent < 0) return "border-l-[var(--thc-loss)]";
  return "border-l-[var(--thc-gold-start)]";
}

function sortValue(signal: SignalRow, column: SortColumn): number {
  switch (column) {
    case "date":
      return new Date(signal.signalTime).getTime();
    case "strike":
      return signal.strike;
    case "entry":
      return signal.entryPrice;
    case "sl":
      return signal.stopLoss;
    case "pnl":
      return signal.pnlPercent ?? Number.NEGATIVE_INFINITY;
  }
}

const filterTriggerClass =
  "h-6 w-fit gap-1 border-none bg-transparent px-1 text-[10px] font-medium normal-case text-muted-foreground hover:text-foreground data-[size=sm]:h-6";

function SortButton({
  label,
  column,
  active,
  direction,
  onSort,
}: {
  label: string;
  column: SortColumn;
  active: boolean;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
}) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

export function SignalsExplorer({ signals }: { signals: SignalRow[] }) {
  const [optionFilter, setOptionFilter] = useState<OptionFilter>("ALL");
  const [instrumentFilter, setInstrumentFilter] = useState<InstrumentFilter>("ALL");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("ALL");
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  }

  const filtered = useMemo(() => {
    let list = signals;

    if (optionFilter !== "ALL") {
      list = list.filter((s) => s.optionType === optionFilter);
    }

    if (instrumentFilter !== "ALL") {
      list = list.filter((s) => s.instrument === instrumentFilter);
    }

    if (resultFilter === "WIN") {
      list = list.filter((s) => s.pnlPercent != null && s.pnlPercent > 0);
    } else if (resultFilter === "LOSS") {
      list = list.filter((s) => s.pnlPercent != null && s.pnlPercent < 0);
    } else if (resultFilter === "OPEN") {
      list = list.filter((s) => s.status === "OPEN");
    }

    return [...list].sort((a, b) => {
      const diff = sortValue(a, sortColumn) - sortValue(b, sortColumn);
      return sortDirection === "asc" ? diff : -diff;
    });
  }, [signals, optionFilter, instrumentFilter, resultFilter, sortColumn, sortDirection]);

  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm text-muted-foreground">
        {filtered.length} signal{filtered.length === 1 ? "" : "s"}
      </span>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No signals match these filters.
        </p>
      ) : (
        <div className="thc-glass overflow-hidden rounded-xl border border-white/5">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/10 hover:bg-transparent">
                  <TableHead className="hidden sm:table-cell">
                    <SortButton
                      label="Date"
                      column="date"
                      active={sortColumn === "date"}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1">
                      <span>Instrument</span>
                      <Select
                        value={instrumentFilter}
                        onValueChange={(v) => setInstrumentFilter(v as InstrumentFilter)}
                      >
                        <SelectTrigger size="sm" className={filterTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Instruments</SelectItem>
                          {INSTRUMENTS.map((i) => (
                            <SelectItem key={i} value={i}>
                              {INSTRUMENT_LABEL[i]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1">
                      <SortButton
                        label="Strike"
                        column="strike"
                        active={sortColumn === "strike"}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <Select
                        value={optionFilter}
                        onValueChange={(v) => setOptionFilter(v as OptionFilter)}
                      >
                        <SelectTrigger size="sm" className={filterTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          <SelectItem value="CE">CE only</SelectItem>
                          <SelectItem value="PE">PE only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <SortButton
                      label="Entry"
                      column="entry"
                      active={sortColumn === "entry"}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <SortButton
                      label="SL"
                      column="sl"
                      active={sortColumn === "sl"}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Target(s)</TableHead>
                  <TableHead className="hidden lg:table-cell">Sell Price</TableHead>
                  <TableHead>
                    <SortButton
                      label="P&L %"
                      column="pnl"
                      active={sortColumn === "pnl"}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <div className="flex flex-col gap-1">
                      <span>Status</span>
                      <Select
                        value={resultFilter}
                        onValueChange={(v) => setResultFilter(v as ResultFilter)}
                      >
                        <SelectTrigger size="sm" className={filterTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Results</SelectItem>
                          <SelectItem value="WIN">Wins</SelectItem>
                          <SelectItem value="LOSS">Losses</SelectItem>
                          <SelectItem value="OPEN">Open</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((signal) => {
                  const isWin = signal.pnlPercent != null && signal.pnlPercent > 0;
                  const isLoss = signal.pnlPercent != null && signal.pnlPercent < 0;
                  const pnlClass = isWin
                    ? "text-[var(--thc-win)]"
                    : isLoss
                      ? "text-[var(--thc-loss)]"
                      : "text-primary";

                  return (
                    <TableRow
                      key={signal.id}
                      className={cn(
                        "border-l-2 border-b-white/5 transition-colors hover:bg-white/[0.03]",
                        outcomeClass(signal.pnlPercent),
                      )}
                    >
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                        {formatSignalDate(signal.signalTime)}{" "}
                        <span className="text-xs">{formatSignalTime(signal.signalTime)}</span>
                      </TableCell>
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
                      <TableCell className="hidden sm:table-cell">{signal.entryPrice}</TableCell>
                      <TableCell className="hidden md:table-cell">{signal.stopLoss}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {signal.targets.join(", ")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {signal.sellPrice ?? "—"}
                      </TableCell>
                      <TableCell className={cn("font-heading font-bold", pnlClass)}>
                        {signal.pnlPercent != null
                          ? `${signal.pnlPercent > 0 ? "+" : ""}${signal.pnlPercent.toFixed(1)}%`
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {STATUS_LABEL[signal.status]}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
