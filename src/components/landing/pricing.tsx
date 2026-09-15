"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/icons";
import { ContinuePremiumPanel } from "@/components/site/continue-premium-panel";
import { clientConfig } from "@/lib/client-config";
import { cn } from "@/lib/utils";

function BrokerOfferBanner() {
  const offer = clientConfig.brokerOffer ?? {
    brandName: "Dhan",
    logoSrc: "/dhan-logo.jpg",
    logoAlt: "Dhan",
    brokerageDiscountPercent: 15,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mx-auto mt-10 flex max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-card p-5 sm:flex-row sm:items-center"
    >
      <Image
        src={offer.logoSrc}
        alt={offer.logoAlt}
        width={offer.logoWidth ?? 40}
        height={offer.logoHeight ?? 40}
        className={
          offer.logoWidth
            ? "h-6 w-auto max-w-[110px] object-contain"
            : "h-7 w-7 shrink-0 rounded-md object-contain"
        }
      />
      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
        Free Demat account with{" "}
        <span className="font-semibold signalflow-gold-text">{offer.brandName}</span> — pick{" "}
        <span className="font-semibold text-[var(--signalflow-win)]">₹500 off</span> your next
        premium batch or{" "}
        <span className="font-semibold text-[var(--signalflow-win)]">
          {offer.brokerageDiscountPercent}% off
        </span>{" "}
        your brokerage. Already have {offer.brandName.startsWith("A") ? "an" : "a"}{" "}
        {offer.brandName} account? Refer &amp; earn{" "}
        <span className="font-semibold text-primary">free premium access*</span> —{" "}
        <Link href="/terms" className="text-primary underline underline-offset-2">
          T&amp;C
        </Link>
        .
      </p>
      <Button asChild size="sm" variant="outline" className="w-fit shrink-0 gap-1.5">
        <a href={clientConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4" />
          Grab it
        </a>
      </Button>
    </motion.div>
  );
}

export function Pricing() {
  const { batchInfo, pricingPlans } = clientConfig;
  const headline = clientConfig.pricingHeadline ?? "Premium Community";
  const subheadline =
    clientConfig.pricingSubheadline ??
    "Every call, live Zoom session, and WhatsApp signal — pick the plan that fits you.";
  const registerLabel = clientConfig.pricingRegisterLabel ?? "Register Premium";
  const benefits = batchInfo.benefits.filter((benefit) => benefit.trim().length > 0);
  // Same feature set on every tier (cheaper per period the longer you
  // commit) — see PricingPlan doc comment in client-config.ts. Real
  // schedule details from batchInfo, never invented per-tier perks.
  const planFeatures = [
    ...benefits,
    `Live Zoom ${batchInfo.zoomTimings.join(" & ")}`,
    `WhatsApp signals ${batchInfo.whatsappTimings}`,
  ];

  return (
    <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Join the <span className="signalflow-gold-text">{headline}</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{subheadline}</p>
        </div>

        {benefits.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-xs font-medium text-foreground/85 sm:text-sm"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative flex flex-col justify-between rounded-3xl border p-8",
                plan.highlight
                  ? "border-2 border-primary bg-gradient-to-b from-primary/10 to-card shadow-[0_0_40px_-10px_var(--primary)] lg:-translate-y-3 sm:p-10"
                  : "border-white/10 bg-card transition-colors hover:border-white/20",
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-xs font-black tracking-widest text-primary-foreground uppercase shadow-md">
                  {plan.savingsLabel ? `Most Popular · ${plan.savingsLabel}` : "Most Popular"}
                </span>
              )}
              {!plan.highlight && plan.savingsLabel && (
                <span className="absolute -top-3.5 right-6 rounded-full border border-[var(--signalflow-win)]/30 bg-[var(--signalflow-win)]/20 px-3 py-1 text-[10px] font-bold tracking-wide text-[var(--signalflow-win)] uppercase">
                  {plan.savingsLabel}
                </span>
              )}

              <div>
                <p
                  className={cn(
                    "text-xs font-bold tracking-wider uppercase",
                    plan.highlight ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {plan.label}
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "font-heading font-extrabold",
                      plan.highlight ? "text-4xl text-foreground sm:text-5xl" : "text-4xl text-foreground",
                    )}
                  >
                    ₹{plan.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {plan.periodLabel}
                  </span>
                </div>

                <ul
                  className={cn(
                    "mt-6 space-y-3 border-t pt-6 text-xs",
                    plan.highlight ? "border-primary/20 text-foreground/90" : "border-white/10 text-muted-foreground",
                  )}
                >
                  {planFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                asChild
                className={cn(
                  "mt-8 w-full",
                  plan.highlight ? "signalflow-btn-gradient" : "",
                )}
                variant={plan.highlight ? undefined : "outline"}
                size="lg"
              >
                <Link href={`/register?plan=${plan.id}`}>{registerLabel}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-xl space-y-1 text-center text-xs text-muted-foreground">
          <p>
            WhatsApp Signals: {batchInfo.whatsappTimings} • Live Zoom:{" "}
            {batchInfo.zoomTimings.join(" & ")}.
          </p>
          <p>
            Check our transparent{" "}
            <Link href="/dashboard" className="text-primary underline underline-offset-2">
              Win Rate and Total Capture %
            </Link>
            . {batchInfo.refundPolicy}{" "}
            <Link href="/terms" className="text-primary underline underline-offset-2">
              T &amp; C
            </Link>
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <ContinuePremiumPanel plans={pricingPlans} />
        </div>

        {clientConfig.dhanOfferEnabled && <BrokerOfferBanner />}
      </div>
    </section>
  );
}
