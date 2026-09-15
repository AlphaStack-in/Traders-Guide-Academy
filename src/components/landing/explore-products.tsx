"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { clientConfig } from "@/lib/client-config";

export function ExploreProducts() {
  const { exploreProducts } = clientConfig;
  if (exploreProducts.length === 0) return null;

  return (
    <section id="products" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">Explore Products</h2>
              <p className="text-sm text-muted-foreground">Advisory &amp; membership programs</p>
            </div>
          </div>
          <Link
            href="/contact"
            className="hidden shrink-0 items-center text-sm font-semibold text-primary transition-colors hover:text-foreground sm:flex"
          >
            View all <span className="ml-1">→</span>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {exploreProducts.map((product, i) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col items-start gap-6 rounded-3xl border border-white/10 bg-card p-8 transition-colors hover:border-primary/40 sm:flex-row"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 font-mono font-bold text-primary">
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <span className="rounded bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wide text-primary uppercase">
                  {product.eyebrow}
                </span>
                <h3 className="mt-2 text-xl font-bold text-foreground">{product.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-heading text-2xl font-black text-foreground">
                    {product.priceLabel}
                  </span>
                  <Link
                    href={product.href}
                    className="flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    Learn more <span className="ml-1">→</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
