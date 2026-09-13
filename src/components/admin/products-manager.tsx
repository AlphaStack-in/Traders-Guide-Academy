"use client";

import { useState } from "react";
import { AddProductForm } from "@/components/admin/add-product-form";
import { ProductsTable, type ProductRow } from "@/components/admin/products-table";

/** Client shell for /admin/products — wires Edit in the table to the form above. */
export function ProductsManager({ products }: { products: ProductRow[] }) {
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <AddProductForm
        key={editingProduct?.id ?? "new"}
        editingProduct={editingProduct}
        onSaved={() => setEditingProduct(null)}
        onCancelEdit={() => setEditingProduct(null)}
      />
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">
          All Products{" "}
          <span className="text-sm font-normal text-muted-foreground">({products.length})</span>
        </h2>
        <ProductsTable rows={products} onEdit={setEditingProduct} />
      </div>
    </div>
  );
}
