import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

export interface GoodwillOrderRequestRow {
  id: string;
  subscriberName: string;
  subscriberPhone: string;
  instrument: InstrumentLiteral | null;
  strike: number;
  optionType: "CE" | "PE";
  lotSize: number;
  productType: "INTRADAY" | "MARGIN";
  requestedAt: string;
}

// Read-only — no revoke/action concept here, unlike BrokerSessionsTable.
// Just enough for admin to see incoming Goodwill order requests and action
// them manually until real GIGAPRO integration exists.
export function GoodwillOrderRequestsTable({ requests }: { requests: GoodwillOrderRequestRow[] }) {
  return (
    <div className="signalflow-glass signalflow-neutral-border overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subscriber</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Lots</TableHead>
            <TableHead>Trade Type</TableHead>
            <TableHead>Requested</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                No order requests yet.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.subscriberName}</div>
                  <div className="text-xs text-muted-foreground">{r.subscriberPhone}</div>
                </TableCell>
                <TableCell>
                  {r.instrument ? `${INSTRUMENT_LABEL[r.instrument]} ` : ""}
                  {r.strike} {r.optionType}
                </TableCell>
                <TableCell>{r.lotSize}</TableCell>
                <TableCell>
                  <Badge variant="outline">{r.productType}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {formatSignalDate(r.requestedAt)} {formatSignalTime(r.requestedAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
