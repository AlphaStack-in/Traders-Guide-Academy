import { cn, formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInstrumentLabel, type InstrumentValue } from "@/lib/instruments";
import { calcPnlPoints } from "@/lib/signal-metrics";

export interface RecentSignalItem {
  id: string;
  strike: number;
  optionType: "CE" | "PE";
  instrument: InstrumentValue | null;
  stockSymbol?: string | null;
  entryPrice: number;
  sellPrice: number | null;
  pnlPercent: number | null;
  status: "OPEN" | "TARGET_HIT" | "SL_HIT" | "CLOSED_MANUAL" | "EXPIRED";
  signalTime: string | Date;
}

const STATUS_LABEL: Record<RecentSignalItem["status"], string> = {
  OPEN: "Open*",
  TARGET_HIT: "Target Hit",
  SL_HIT: "SL Hit",
  CLOSED_MANUAL: "Closed",
  EXPIRED: "Expired",
};

export function RecentSignalsList({ signals }: { signals: RecentSignalItem[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b-white/10 hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Instrument</TableHead>
            <TableHead>Strike</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Points</TableHead>
            <TableHead className="text-right">P&amp;L %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((signal) => {
            const isWin = signal.pnlPercent != null && signal.pnlPercent > 0;
            const isLoss = signal.pnlPercent != null && signal.pnlPercent < 0;
            const pnlPoints =
              signal.sellPrice != null ? calcPnlPoints(signal.entryPrice, signal.sellPrice) : null;
            const dotColor = isWin
              ? "bg-[var(--signalflow-win)]"
              : isLoss
                ? "bg-[var(--signalflow-loss)]"
                : "bg-primary";

            return (
              <TableRow key={signal.id} className="border-b-white/5">
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatSignalDate(signal.signalTime)} {formatSignalTime(signal.signalTime)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatInstrumentLabel(signal.instrument, signal.stockSymbol) || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />
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
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {STATUS_LABEL[signal.status]}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-heading font-bold",
                    isWin
                      ? "text-[var(--signalflow-win)]"
                      : isLoss
                        ? "text-[var(--signalflow-loss)]"
                        : "text-muted-foreground",
                  )}
                >
                  {pnlPoints != null ? `${pnlPoints > 0 ? "+" : ""}${pnlPoints.toFixed(1)}` : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-heading font-bold",
                    isWin
                      ? "text-[var(--signalflow-win)]"
                      : isLoss
                        ? "text-[var(--signalflow-loss)]"
                        : "text-muted-foreground",
                  )}
                >
                  {signal.pnlPercent != null
                    ? `${signal.pnlPercent > 0 ? "+" : ""}${signal.pnlPercent.toFixed(1)}%`
                    : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
