"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Trash2 } from "lucide-react";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteSubscriber } from "@/app/admin/(protected)/subscribers/actions";

export interface SubscriberRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  plan: string;
  createdAt: string;
}

function toWhatsAppLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

function SubscriberRowItem({ subscriber }: { subscriber: SubscriberRow }) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function handleDeleteClick() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    startDeleting(async () => {
      const result = await deleteSubscriber(subscriber.id);
      if (result.success) {
        toast.success(`${subscriber.name} removed.`);
      } else {
        toast.error("Failed to delete member.");
      }
    });
  }

  return (
    <TableRow className="border-b-white/5">
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatSignalDate(subscriber.createdAt)}{" "}
        <span className="text-xs">{formatSignalTime(subscriber.createdAt)}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">{subscriber.name}</TableCell>
      <TableCell className="whitespace-nowrap">
        <a href={`tel:${subscriber.phone}`} className="text-primary">
          {subscriber.phone}
        </a>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {subscriber.email ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="thc-gold-border text-xs">
          {subscriber.plan}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" variant="outline" className="thc-glow h-8">
            <a href={toWhatsAppLink(subscriber.phone)} target="_blank" rel="noopener noreferrer">
              Message
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isDeleting}
            className={
              deleteArmed
                ? "h-8 gap-1 px-2 border-[var(--thc-loss)]/60 text-[var(--thc-loss)]"
                : "h-8 gap-1 px-2 text-muted-foreground"
            }
            title={deleteArmed ? "Click again to confirm delete" : "Remove member"}
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteArmed && <span className="text-xs">Confirm?</span>}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SubscribersTable({ subscribers }: { subscribers: SubscriberRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) =>
      [s.name, s.phone, s.email ?? ""].some((field) => field.toLowerCase().includes(q)),
    );
  }, [subscribers, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="pl-9"
        />
      </div>

      <div className="thc-glass overflow-hidden rounded-xl border border-white/5">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/10 hover:bg-transparent">
                <TableHead>Registered</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {subscribers.length === 0
                      ? "No members registered yet."
                      : "No members match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => <SubscriberRowItem key={s.id} subscriber={s} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
