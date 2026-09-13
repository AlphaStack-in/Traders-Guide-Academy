"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ProductCategory } from "@prisma/client";
import { Trash2, Pencil, Star } from "lucide-react";
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
import { PRODUCT_CATEGORY_LABELS, formatPriceInPaise } from "@/lib/products";
import { setProductActive, deleteProduct } from "@/app/admin/(protected)/news-alerts/product-actions";

// Product-CRUD counterpart to news-alerts-table.tsx's NewsAlertRow/Table —
// same list-with-inline-actions shape (toggle Active, arm-then-confirm
// Delete), plus an Edit button neither the alert nor product table had
// before: lifts the clicked row up to the parent (content-manager.tsx),
// which feeds it to add-product-form.tsx as `editingProduct`.
export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  longDescription: string;
  priceInPaise: number;
  originalPriceInPaise: number | null;
  rating: number | null;
  ratingCount: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  accessValidityDays: number | null;
  courseAccessUrl: string | null;
}

function ProductRowItem({
  row,
  onEdit,
}: {
  row: ProductRow;
  onEdit: (row: ProductRow) => void;
}) {
  const [isActive, setIsActive] = useState(row.isActive);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isToggling, startToggling] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function handleToggle(next: boolean) {
    setIsActive(next);
    startToggling(async () => {
      const result = await setProductActive(row.id, next);
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
      const result = await deleteProduct(row.id);
      if (result.success) {
        toast.success(`"${row.name}" deleted.`);
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
            alt={row.name}
            className="h-14 w-20 rounded-md border border-white/10 object-cover bg-black/40"
          />
        ) : (
          <div className="h-14 w-20 rounded-md border border-white/10 bg-white/[0.03] flex items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="font-medium">{row.name}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{row.description}</div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{PRODUCT_CATEGORY_LABELS[row.category]}</Badge>
        {row.isFeatured && (
          <Badge variant="outline" className="ml-1 gap-1">
            <Star className="h-3 w-3" />
            Featured
          </Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {formatPriceInPaise(row.priceInPaise)}
        {row.originalPriceInPaise != null && (
          <span className="ml-1.5 text-xs text-muted-foreground line-through">
            {formatPriceInPaise(row.originalPriceInPaise)}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Switch checked={isActive} disabled={isToggling} onCheckedChange={handleToggle} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 px-2 border-white/10 text-xs"
            onClick={() => onEdit(row)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
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
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProductsTable({
  rows,
  onEdit,
}: {
  rows: ProductRow[];
  onEdit: (row: ProductRow) => void;
}) {
  return (
    <div className="signalflow-glass overflow-hidden rounded-xl border border-white/5">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b-white/10 hover:bg-transparent">
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
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
              rows.map((row) => <ProductRowItem key={row.id} row={row} onEdit={onEdit} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
