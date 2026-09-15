"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";

const ACCENT_STYLES = {
  amber: {
    card: "border-amber-500/40 hover:border-amber-500/70",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    stat: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    category: "bg-amber-500/20 text-amber-300",
    title: "group-hover:text-amber-300",
    check: "text-amber-400",
    priceValue: "text-foreground",
    cta: "bg-gradient-to-r from-amber-500 to-amber-300 text-slate-950 hover:brightness-110",
  },
  cyan: {
    card: "border-primary/40 hover:border-primary",
    badge: "bg-primary/20 text-primary border-primary/40",
    stat: "border-primary/40 bg-primary/10 text-primary",
    category: "bg-primary/20 text-primary",
    title: "group-hover:text-primary",
    check: "text-primary",
    priceValue: "signalflow-gold-text",
    cta: "signalflow-btn-gradient",
  },
} as const;

export function ExploreProducts() {
  const { exploreProducts } = clientConfig;
  if (exploreProducts.length === 0) return null;

  return (
    <section id="products" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[10px] font-bold tracking-widest text-amber-300 uppercase sm:text-xs">
            <span>✦</span>
            <span>Flagship wealth &amp; institutional offerings</span>
            <span>✦</span>
          </div>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Explore <span className="signalflow-gold-text">Flagship Products</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Premium high-alpha algorithmic execution &amp; institutional portfolio management
            designed for high-capital traders.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-2">
          {exploreProducts.map((product, i) => {
            const accent = ACCENT_STYLES[product.accent];
            return (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-3xl border-2 bg-card p-8 shadow-lg transition-all hover:-translate-y-0.5 sm:p-10",
                  accent.card,
                )}
              >
                <span
                  className={cn(
                    "absolute -top-3.5 right-6 rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase",
                    accent.badge,
                  )}
                >
                  {product.badge}
                </span>

                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border font-mono font-bold shadow-sm",
                        accent.stat,
                      )}
                    >
                      <span className="text-xl">{product.stat[0]}</span>
                      <span className="text-[9px] tracking-widest uppercase">{product.stat[1]}</span>
                      <span className="text-[8px] uppercase text-muted-foreground">{product.stat[2]}</span>
                    </div>
                    <div>
                      <span
                        className={cn(
                          "rounded px-2.5 py-1 font-mono text-[10px] font-bold uppercase",
                          accent.category,
                        )}
                      >
                        {product.category}
                      </span>
                      <h3
                        className={cn(
                          "mt-2 text-2xl font-extrabold text-foreground transition-colors",
                          accent.title,
                        )}
                      >
                        {product.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">{product.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-5 pb-1">
                    <p className="mb-3 font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Key Deliverables &amp; Structure
                    </p>
                    <ul className="space-y-2.5 text-xs text-foreground/85">
                      {product.deliverables.map((item) => (
                        <li key={item.label} className="flex items-start gap-2">
                          <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", accent.check)} />
                          <span>
                            <strong className="font-semibold text-foreground">{item.label}:</strong>{" "}
                            {item.detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-semibold text-muted-foreground uppercase">
                      {product.priceCaption}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn("font-heading text-3xl font-black", accent.priceValue)}>
                        {product.priceLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">{product.priceSuffix}</span>
                    </div>
                  </div>
                  <Button asChild size="lg" className={cn("w-full sm:w-auto", accent.cta)}>
                    <Link href={product.href}>{product.ctaLabel}</Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
