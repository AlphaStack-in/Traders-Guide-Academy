import { ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductsManager } from "@/components/admin/products-manager";
import type { ProductRow } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

/** Admin CRUD for the public /products catalog (courses, indicators, e-books, PMS, memberships). */
export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  const productRows: ProductRow[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    description: p.description,
    longDescription: p.longDescription,
    priceInPaise: p.priceInPaise,
    originalPriceInPaise: p.originalPriceInPaise,
    rating: p.rating,
    ratingCount: p.ratingCount,
    imageUrl: p.imageUrl,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    accessValidityDays: p.accessValidityDays,
    courseAccessUrl: p.courseAccessUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl flex items-center gap-2.5">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span>
            Product <span className="signalflow-gold-text">Catalog</span>
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage everything shown on the public <strong>/products</strong> page. Only{" "}
          <strong>Active</strong> items appear on the site — toggle one off instead of deleting it
          when you want to hide it temporarily.
        </p>
      </div>

      <ProductsManager products={productRows} />
    </div>
  );
}
