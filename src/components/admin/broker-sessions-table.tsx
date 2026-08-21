"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { revokeBrokerConnection } from "@/app/admin/(protected)/broker-sessions/actions";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

export interface BrokerSessionRow {
  subscriberId: string;
  subscriberName: string;
  subscriberPhone: string;
  dhanClientId: string;
  dhanClientName: string | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  tokenExpiresAt: string;
  lastRenewedAt: string | null;
  lastError: string | null;
}

export interface OrderAuditRow {
  id: string;
  subscriberName: string;
  subscriberPhone: string;
  instrument: InstrumentLiteral | null;
  strike: number;
  optionType: "CE" | "PE";
  lotSize: number;
  dhanOrderId: string | null;
  status: "PLACED" | "REJECTED" | "ERROR";
  errorMessage: string | null;
  placedAt: string;
}

function statusVariant(status: BrokerSessionRow["status"] | OrderAuditRow["status"]) {
  if (status === "ACTIVE" || status === "PLACED") return "default" as const;
  if (status === "EXPIRED" || status === "REJECTED" || status === "ERROR") {
    return "destructive" as const;
  }
  return "outline" as const;
}

function RevokeButton({ subscriberId, disabled }: { subscriberId: string; disabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const result = await revokeBrokerConnection(subscriberId);
      if (result.success) {
        toast.success("Broker session revoked.");
      } else {
        toast.error("Couldn't revoke that session.");
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled || isPending}
      onClick={handleRevoke}
    >
      {isPending ? "Revoking…" : "Revoke"}
    </Button>
  );
}

export function BrokerSessionsTable({
  sessions,
  orders,
}: {
  sessions: BrokerSessionRow[];
  orders: OrderAuditRow[];
}) {
  const [tab, setTab] = useState<"sessions" | "orders">("sessions");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "sessions" ? "default" : "outline"}
          onClick={() => setTab("sessions")}
        >
          Sessions
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "orders" ? "default" : "outline"}
          onClick={() => setTab("orders")}
        >
          Recent Orders
        </Button>
      </div>

      {tab === "sessions" ? (
        <div className="signalflow-glass signalflow-neutral-border overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Dhan Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Token Expires</TableHead>
                <TableHead>Last Renewed</TableHead>
                <TableHead>Last Error</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No broker connections yet.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => (
                  <TableRow key={s.subscriberId}>
                    <TableCell>
                      <div className="font-medium">{s.subscriberName}</div>
                      <div className="text-xs text-muted-foreground">{s.subscriberPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div>{s.dhanClientName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{s.dhanClientId}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatSignalDate(s.tokenExpiresAt)} {formatSignalTime(s.tokenExpiresAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.lastRenewedAt
                        ? `${formatSignalDate(s.lastRenewedAt)} ${formatSignalTime(s.lastRenewedAt)}`
                        : "Never"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {s.lastError ?? "—"}
                    </TableCell>
                    <TableCell>
                      <RevokeButton subscriberId={s.subscriberId} disabled={s.status === "REVOKED"} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="signalflow-glass signalflow-neutral-border overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Lots</TableHead>
                <TableHead>Dhan Order Id</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No orders placed yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.subscriberName}</div>
                      <div className="text-xs text-muted-foreground">{o.subscriberPhone}</div>
                    </TableCell>
                    <TableCell>
                      {o.instrument ? `${INSTRUMENT_LABEL[o.instrument]} ` : ""}
                      {o.strike} {o.optionType}
                    </TableCell>
                    <TableCell>{o.lotSize}</TableCell>
                    <TableCell className="text-xs">{o.dhanOrderId ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {o.errorMessage ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatSignalDate(o.placedAt)} {formatSignalTime(o.placedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
