"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, ShoppingBag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignalDate } from "@/lib/utils";
import { setNewsAlertActive, deleteNewsAlert } from "@/app/admin/(protected)/news-alerts/actions";

export interface NewsAlertRow {
  id: string;
  title: string;
  category: string;
  summary: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  productSlug: string | null;
  isBreaking: boolean;
  isActive: boolean;
  publishedAt: string;
}

function NewsAlertRowItem({ row }: { row: NewsAlertRow }) {
  const [isActive, setIsActive] = useState(row.isActive);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isToggling, startToggling] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function handleToggle(next: boolean) {
    setIsActive(next);
    startToggling(async () => {
      const result = await setNewsAlertActive(row.id, next);
      if (!result.success) {
        toast.error(result.error ?? "Couldn't update that.");
        setIsActive(!next);
        return;
      }
      toast.success(next ? "Now visible on the site." : "Hidden from the site.");
    });
  }

  function handleDeleteClick() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    startDeleting(async () => {
      const result = await deleteNewsAlert(row.id);
      if (result.success) {
        toast.success(`"${row.title}" deleted.`);
      } else {
        toast.error(result.error ?? "Failed to delete.");
      }
    });
  }

  return (
    <TableRow className="border-b-white/5">
      <TableCell className="w-20">
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt={row.title}
            className="h-14 w-20 rounded-md border border-white/10 object-cover bg-black/40"
          />
        ) : (
          <div className="h-14 w-20 rounded-md border border-white/10 bg-white/[0.03] flex items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="font-medium">{row.title}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{row.summary}</div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{row.category}</Badge>
        {row.isBreaking && (
          <Badge variant="destructive" className="ml-1">
            Breaking
          </Badge>
        )}
        {row.productSlug && (
          <Badge variant="outline" className="ml-1 gap-1">
            <ShoppingBag className="h-3 w-3" />
            {row.productSlug}
          </Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {formatSignalDate(row.publishedAt)}
      </TableCell>
      <TableCell>
        <Switch checked={isActive} disabled={isToggling} onCheckedChange={handleToggle} />
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          disabled={isDeleting}
          className={
            deleteArmed
              ? "h-8 gap-1 px-2 border-[var(--signalflow-loss)]/60 text-[var(--signalflow-loss)]"
              : "h-8 gap-1 px-2 text-muted-foreground"
          }
          title={deleteArmed ? "Click again to confirm delete" : "Delete"}
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleteArmed && <span className="text-xs">Confirm?</span>}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function NewsAlertsTable({ rows }: { rows: NewsAlertRow[] }) {
  return (
    <div className="signalflow-glass overflow-hidden rounded-xl border border-white/5">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-white/10 hover:bg-transparent">
              <TableHead>Poster</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Nothing added yet — use the form above.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => <NewsAlertRowItem key={row.id} row={row} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
