"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProductCategory } from "@prisma/client";
import { PlusCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartImageUploader } from "@/components/signals/chart-image-uploader";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ORDER } from "@/lib/products";
import { createProduct, updateProduct } from "@/app/admin/(protected)/products/product-actions";
import type { ProductRow } from "@/components/admin/products-table";

function emptyForm() {
  return {
    name: "",
    category: "COURSE" as ProductCategory,
    description: "",
    longDescription: "",
    price: "",
    originalPrice: "",
    rating: "",
    ratingCount: "",
    imageUrl: null as string | null,
    isFeatured: false,
    accessValidityDays: "",
    courseAccessUrl: "",
  };
}

type FormState = ReturnType<typeof emptyForm>;

function fromRow(row: ProductRow): FormState {
  return {
    name: row.name,
    category: row.category,
    description: row.description,
    longDescription: row.longDescription,
    price: String(row.priceInPaise / 100),
    originalPrice: row.originalPriceInPaise != null ? String(row.originalPriceInPaise / 100) : "",
    rating: row.rating != null ? String(row.rating) : "",
    ratingCount: row.ratingCount != null ? String(row.ratingCount) : "",
    imageUrl: row.imageUrl,
    isFeatured: row.isFeatured,
    accessValidityDays: row.accessValidityDays != null ? String(row.accessValidityDays) : "",
    courseAccessUrl: row.courseAccessUrl ?? "",
  };
}

/**
 * Add/edit form for the /products catalog — the Product-CRUD half of this
 * page at /admin/products. Doubles as
 * the edit form: passing `editingProduct` pre-fills every field and routes
 * the submit to updateProduct instead of createProduct. A product's slug
 * (its public /products/[slug] URL) is fixed at creation and never exposed
 * here for editing — same "don't let admin's own edits move a
 * still-referenced identifier" reasoning as leaving a signal's id alone.
 */
export function AddProductForm({
  editingProduct,
  onSaved,
  onCancelEdit,
}: {
  editingProduct?: ProductRow | null;
  onSaved?: () => void;
  onCancelEdit?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() =>
    editingProduct ? fromRow(editingProduct) : emptyForm(),
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Add a short description.");
      return;
    }
    if (!form.longDescription.trim()) {
      toast.error("Add the longer description shown on the product page.");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid price (0 for free).");
      return;
    }

    const input = {
      name: form.name,
      category: form.category,
      description: form.description,
      longDescription: form.longDescription,
      priceInRupees: price,
      originalPriceInRupees: form.originalPrice.trim() ? Number(form.originalPrice) : null,
      rating: form.rating.trim() ? Number(form.rating) : null,
      ratingCount: form.ratingCount.trim() ? Number(form.ratingCount) : null,
      imageUrl: form.imageUrl,
      isFeatured: form.isFeatured,
      accessValidityDays: form.accessValidityDays.trim() ? Number(form.accessValidityDays) : null,
      courseAccessUrl: form.courseAccessUrl.trim() || null,
    };

    startTransition(async () => {
      const result = editingProduct
        ? await updateProduct(editingProduct.id, input)
        : await createProduct(input);
      if (result.success) {
        toast.success(editingProduct ? "Product updated." : "Product added to the catalog.");
        setForm(emptyForm());
        onSaved?.();
        router.refresh();
      } else {
        toast.error(result.error ?? "Couldn't save that.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0e14]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2.5 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold">
              {editingProduct ? `Edit "${editingProduct.name}"` : "Add product"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Courses, indicators, e-books, PMS and membership plans shown on the /products catalog.
            </p>
          </div>
        </div>
        {editingProduct && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 border-white/10 text-xs"
            onClick={() => onCancelEdit?.()}
          >
            <X className="h-3.5 w-3.5" />
            Cancel edit
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Option Mastery"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-category">Category</Label>
          <Select value={form.category} onValueChange={(v) => update("category", v as ProductCategory)}>
            <SelectTrigger id="p-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORY_ORDER.map((c) => (
                <SelectItem key={c} value={c}>
                  {PRODUCT_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-description">Short description</Label>
        <Textarea
          id="p-description"
          rows={2}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Two-line summary shown on the catalog row."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-long-description">Full description</Label>
        <Textarea
          id="p-long-description"
          rows={4}
          value={form.longDescription}
          onChange={(e) => update("longDescription", e.target.value)}
          placeholder="Longer copy shown on the product's own page."
        />
      </div>

      <ChartImageUploader
        value={form.imageUrl}
        onChange={(url) => update("imageUrl", url)}
        label="Product image"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-price">Price (₹)</Label>
          <Input
            id="p-price"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            placeholder="0 for free"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-original-price">
            Strikethrough price (₹) <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="p-original-price"
            type="number"
            min={0}
            value={form.originalPrice}
            onChange={(e) => update("originalPrice", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-rating">
            Rating <span className="text-muted-foreground font-normal">(optional, 0–5)</span>
          </Label>
          <Input
            id="p-rating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.rating}
            onChange={(e) => update("rating", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-rating-count">
            Rating count <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="p-rating-count"
            type="number"
            min={0}
            value={form.ratingCount}
            onChange={(e) => update("ratingCount", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-validity">
            Access validity (days){" "}
            <span className="text-muted-foreground font-normal">(optional — blank = lifetime)</span>
          </Label>
          <Input
            id="p-validity"
            type="number"
            min={0}
            value={form.accessValidityDays}
            onChange={(e) => update("accessValidityDays", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-access-url">
            Access link <span className="text-muted-foreground font-normal">(optional — LMS/course URL)</span>
          </Label>
          <Input
            id="p-access-url"
            value={form.courseAccessUrl}
            onChange={(e) => update("courseAccessUrl", e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <label className="flex w-fit items-center gap-2 text-sm">
        <Checkbox
          checked={form.isFeatured}
          onCheckedChange={(checked) => update("isFeatured", Boolean(checked))}
        />
        <span className="text-foreground/90">Featured (gold-bordered band at the top of the catalog)</span>
      </label>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="signalflow-glow signalflow-btn-gradient w-fit gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {isPending ? "Saving…" : editingProduct ? "Save changes" : "Add to catalog"}
      </Button>
    </div>
  );
}
