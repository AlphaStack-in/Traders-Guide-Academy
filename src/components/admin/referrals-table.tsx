"use client";

import { useMemo, useState } from "react";
import { Download, Search, Users, Wallet } from "lucide-react";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AdminReferralMemberRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  successfulCount: number;
  pendingCount: number;
  totalRewards: number;
  availableCredit: number;
  redeemedCredit: number;
  socialRewards: number;
  lastReferral: string | null;
  status: "ALL" | "SUCCESSFUL" | "PENDING" | "INVITED" | "REWARD_CREDITED" | "REDEEMED";
  createdAt: string;
}

export function AdminReferralsTable({ members }: { members: AdminReferralMemberRow[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    let result = members;
    const q = query.trim().toLowerCase();

    if (q) {
      result = result.filter((m) =>
        [m.name, m.phone, m.email || ""].some((field) => field.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((m) => m.status === statusFilter);
    }

    return result;
  }, [members, query, statusFilter]);

  function exportCSV() {
    const headers = [
      "Member Name",
      "Phone",
      "Email",
      "Successful Referrals",
      "Pending Referrals",
      "Total Rewards (INR)",
      "Available Credit (INR)",
      "Redeemed Credit (INR)",
      "Social Rewards (INR)",
      "Last Referral Date",
    ];

    const rows = filtered.map((m) => [
      `"${m.name}"`,
      `"${m.phone}"`,
      `"${m.email || ""}"`,
      m.successfulCount,
      m.pendingCount,
      m.totalRewards,
      m.availableCredit,
      m.redeemedCredit,
      m.socialRewards,
      m.lastReferral ? `"${m.lastReferral}"` : '""',
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Referrals_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, or email…"
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "SUCCESSFUL", "PENDING", "REWARD_CREDITED", "REDEEMED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-black/30 text-muted-foreground border border-white/10 hover:text-foreground"
              }`}
            >
              {st === "ALL"
                ? "All Members"
                : st === "SUCCESSFUL"
                ? "Successful"
                : st === "PENDING"
                ? "Pending"
                : st === "REWARD_CREDITED"
                ? "Reward Credited"
                : "Redeemed"}
            </button>
          ))}

          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs font-medium border-white/10"
            onClick={exportCSV}
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Admin Table */}
      <div className="signalflow-glass overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/10 hover:bg-transparent">
                <TableHead>Member</TableHead>
                <TableHead className="text-center">Successful</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-right">Total Earned</TableHead>
                <TableHead className="text-right">Available Credit</TableHead>
                <TableHead className="text-right">Redeemed</TableHead>
                <TableHead className="text-right">Social Rewards</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No member referral records match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m.id} className="border-b-white/5 text-xs">
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="text-foreground font-semibold">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground">{m.phone}</div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sky-400">
                      {m.successfulCount}
                    </TableCell>
                    <TableCell className="text-center font-bold text-amber-400">
                      {m.pendingCount}
                    </TableCell>
                    <TableCell className="text-right font-bold signalflow-gold-text">
                      ₹{m.totalRewards.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-400">
                      ₹{m.availableCredit.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-muted-foreground">
                      ₹{m.redeemedCredit.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      ₹{m.socialRewards.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-[11px]">
                      {m.lastReferral ? (
                        <>
                          {formatSignalDate(m.lastReferral)}{" "}
                          <span className="text-[10px]">{formatSignalTime(m.lastReferral)}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
