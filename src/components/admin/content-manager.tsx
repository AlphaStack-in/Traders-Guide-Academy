"use client";

import { useState } from "react";
import { Newspaper, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddNewsAlertForm, type ProductOption } from "@/components/admin/add-news-alert-form";
import { NewsAlertsTable, type NewsAlertRow } from "@/components/admin/news-alerts-table";
import { AddProductForm } from "@/components/admin/add-product-form";
import { ProductsTable, type ProductRow } from "@/components/admin/products-table";

type ContentTab = "alerts" | "products";

/**
 * Tab-switched wrapper around the two content types the News & Alerts admin
 * page now manages — plain/poster News & Market Alerts (unchanged: see
 * add-news-alert-form.tsx / news-alerts-table.tsx), and the /products
 * catalog (new: add-product-form.tsx / products-table.tsx). This is the
 * "differentiate whether an entry goes to the news module or the product
 * module" piece — picking a tab picks which backend (actions.ts vs
 * product-actions.ts) a submit or row action goes to; nothing downstream
 * needs to guess.
 *
 * The only state shared across the tab boundary: which product (if any) is
 * currently being edited, so clicking "Edit" in ProductsTable can populate
 * AddProductForm sitting above it — the news-alert side has no edit flow to
 * mirror (it never did; only create/toggle/delete).
 */
export function ContentManager({
  alerts,
  products,
  productOptions,
}: {
  alerts: NewsAlertRow[];
  products: ProductRow[];
  productOptions: ProductOption[];
}) {
  const [tab, setTab] = useState<ContentTab>("alerts");
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-fit gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setTab("alerts")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            tab === "alerts" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Newspaper className="h-4 w-4" />
          News &amp; Alerts
          <span className="text-xs text-muted-foreground">({alerts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("products")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            tab === "products" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          Products
          <span className="text-xs text-muted-foreground">({products.length})</span>
        </button>
      </div>

      {tab === "alerts" ? (
        <>
          <AddNewsAlertForm products={productOptions} />
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-bold">
              All Entries <span className="text-sm font-normal text-muted-foreground">({alerts.length})</span>
            </h2>
            <NewsAlertsTable rows={alerts} />
          </div>
        </>
      ) : (
        <>
          <AddProductForm
            key={editingProduct?.id ?? "new"}
            editingProduct={editingProduct}
            onSaved={() => setEditingProduct(null)}
            onCancelEdit={() => setEditingProduct(null)}
          />
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-lg font-bold">
              All Products <span className="text-sm font-normal text-muted-foreground">({products.length})</span>
            </h2>
            <ProductsTable rows={products} onEdit={setEditingProduct} />
          </div>
        </>
      )}
    </div>
  );
}
