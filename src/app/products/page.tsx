import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ProductCatalog } from "@/components/site/product-catalog";
import { getActiveProducts } from "@/lib/products";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { clientConfig } from "@/lib/client-config";

export const metadata = {
  title: `Products — ${process.env.NEXT_PUBLIC_SITE_NAME_SHORT ?? "TGA"}`,
};

export default async function ProductsPage() {
  const [products, subscriber] = await Promise.all([getActiveProducts(), getCurrentSubscriber()]);

  return (
    <div className="flex min-h-screen flex-col md:pl-64">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            <span className="signalflow-gold-text">Products</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Courses, indicators, e-books, our PMS and membership plans from {clientConfig.siteName} — all in
            one place.
          </p>
        </div>

        <ProductCatalog products={products} isAuthenticated={Boolean(subscriber)} />
      </main>
      <Footer />
    </div>
  );
}
