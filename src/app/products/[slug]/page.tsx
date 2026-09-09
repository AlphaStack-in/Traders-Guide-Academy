import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { StarRating } from "@/components/site/star-rating";
import { ProductCheckoutButton } from "@/components/site/product-checkout-button";
import { getProductBySlug, isHighTouchCategory, PRODUCT_CATEGORY_LABELS, formatPriceInPaise } from "@/lib/products";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { tgaManagerWhatsAppLink } from "@/lib/product-fulfillment";
import { WhatsAppIcon } from "@/components/site/icons";

const CATEGORY_FEATURES: Record<string, string[]> = {
  COURSE: ["Lifetime access to recorded modules", "Practical, example-driven lessons"],
  INDICATOR: ["Installs on your own charting platform", "Ongoing updates included"],
  EBOOK: ["Instant download after enrolling", "Reference material you keep"],
  PMS: ["Hands-on portfolio construction", "Ongoing review and rebalancing", "Direct onboarding call"],
  MEMBERSHIP: ["Priority access and updates", "Direct onboarding after purchase"],
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, subscriber] = await Promise.all([getProductBySlug(slug), getCurrentSubscriber()]);

  if (!product || !product.isActive) {
    notFound();
  }

  const highTouch = isHighTouchCategory(product.category);
  const whatsappLink = highTouch
    ? tgaManagerWhatsAppLink(`Hi, I'd like to know more about "${product.name}" (₹${product.priceInPaise / 100}).`)
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <span
          className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </span>

        <h1 className="font-heading mt-2 text-3xl font-bold sm:text-4xl">{product.name}</h1>

        {product.rating != null && (
          <StarRating rating={product.rating} count={product.ratingCount} className="mt-2" />
        )}

        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{product.longDescription}</p>

        <div className="signalflow-glass mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            {product.originalPriceInPaise != null && (
              <span className="text-base text-muted-foreground line-through">
                {formatPriceInPaise(product.originalPriceInPaise)}
              </span>
            )}
            <span className="font-heading text-2xl font-bold text-foreground">
              {formatPriceInPaise(product.priceInPaise)}
            </span>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <ProductCheckoutButton
              productId={product.id}
              priceInPaise={product.priceInPaise}
              isAuthenticated={Boolean(subscriber)}
              className="px-6 py-2 text-base"
            />
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-2"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                Ask a question on WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-foreground">What you get</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {(CATEGORY_FEATURES[product.category] ?? []).map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
