"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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
      className="signalflow-glass mt-4 flex flex-col gap-3 rounded-2xl border border-white/5 p-4 sm:flex-row sm:items-center"
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
      <Button asChild size="sm" variant="outline" className="signalflow-glow w-fit shrink-0 gap-1.5">
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

  return (
    <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Join the <span className="signalflow-gold-text">{headline}</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{subheadline}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="signalflow-glass mt-8 rounded-2xl border border-white/5 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Choose your plan
            </p>
            {benefits.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-[11.5px] text-foreground/85">{benefit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 h-px bg-white/5" />

          <div className="grid sm:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col px-0 py-4 sm:px-5",
                  plan.highlight && "rounded-xl border border-primary/25 bg-primary/[0.06]",
                )}
              >
                <div className="flex items-center gap-2">
                  <p className="font-heading text-sm font-semibold text-muted-foreground">
                    {plan.label}
                  </p>
                  {plan.highlight && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-2xl font-bold signalflow-gold-text">
                    ₹{plan.priceInr.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">{plan.periodLabel}</span>
                </div>
                <span
                  className={cn(
                    "mt-1.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    plan.savingsLabel
                      ? "border-[var(--signalflow-win)]/40 bg-[var(--signalflow-win)]/10 text-[var(--signalflow-win)]"
                      : "invisible",
                  )}
                >
                  {plan.savingsLabel ?? "—"}
                </span>
                <Button
                  asChild
                  size="sm"
                  variant={plan.highlight ? undefined : "outline"}
                  className={cn(
                    "signalflow-glow mt-2.5 w-full",
                    plan.highlight && "signalflow-btn-gradient",
                  )}
                >
                  <Link href={`/register?plan=${plan.id}`}>{registerLabel}</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 h-px bg-white/5" />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              WhatsApp {batchInfo.whatsappTimings} &nbsp;·&nbsp; Zoom{" "}
              {batchInfo.zoomTimings.join(" · ")} &nbsp;·&nbsp; Check our actual{" "}
              <Link href="/dashboard" className="text-primary underline underline-offset-2">
                Win Rate and Total Capture %
              </Link>
              . {batchInfo.refundPolicy}{" "}
              <Link href="/terms" className="text-primary underline underline-offset-2">
                T &amp; C
              </Link>
            </p>
            <ContinuePremiumPanel plans={pricingPlans} />
          </div>
        </motion.div>

        {clientConfig.dhanOfferEnabled && <BrokerOfferBanner />}
      </div>
    </section>
  );
}
