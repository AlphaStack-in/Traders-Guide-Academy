"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteReferral } from "@/app/admin/(protected)/referrals/actions";

export interface ReferralRow {
  id: string;
  referrerName: string;
  referrerPhone: string;
  referredName: string;
  referredPhone: string;
  createdAt: string;
}

function ReferralRowItem({ referral }: { referral: ReferralRow }) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function handleDeleteClick() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    startDeleting(async () => {
      const result = await deleteReferral(referral.id);
      if (result.success) {
        toast.success(`Referral for ${referral.referredName} deleted.`);
      } else {
        toast.error("Failed to delete referral.");
      }
    });
  }

  return (
    <TableRow className="border-b-white/5">
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatSignalDate(referral.createdAt)}{" "}
        <span className="text-xs">{formatSignalTime(referral.createdAt)}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">
        {referral.referrerName}
        <div className="text-xs text-muted-foreground">{referral.referrerPhone}</div>
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">
        {referral.referredName}
        <div className="text-xs text-muted-foreground">{referral.referredPhone}</div>
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          disabled={isDeleting}
          className={
            deleteArmed
              ? "h-8 gap-1 px-2 border-[var(--thc-loss)]/60 text-[var(--thc-loss)]"
              : "h-8 gap-1 px-2 text-muted-foreground"
          }
          title={deleteArmed ? "Click again to confirm delete" : "Delete referral"}
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleteArmed && <span className="text-xs">Confirm?</span>}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ReferralsTable({ referrals }: { referrals: ReferralRow[] }) {
  return (
    <div className="thc-glass overflow-hidden rounded-xl border border-white/5">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-white/10 hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Referred</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No referrals submitted yet.
                </TableCell>
              </TableRow>
            ) : (
              referrals.map((r) => <ReferralRowItem key={r.id} referral={r} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
