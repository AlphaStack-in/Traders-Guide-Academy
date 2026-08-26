"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/site/icons";
import { clientConfig, type PricingPlan } from "@/lib/client-config";
import { checkExistingMember } from "@/app/register/actions";
import { cn } from "@/lib/utils";

function toWhatsAppLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function ContinuePremiumPanel({ plans }: { plans: PricingPlan[] }) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(
    plans.find((p) => p.highlight)?.id ?? plans[0]?.id,
  );
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{ found: boolean; name: string | null } | null>(null);
  const [isChecking, startChecking] = useTransition();

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0];

  function handleCheck() {
    if (phone.replace(/\D/g, "").length < 8) return;
    startChecking(async () => {
      const data = await checkExistingMember(phone);
      setResult(data);
    });
  }

  if (!open) {
    return (
      <Button
        variant={clientConfig.logoAccent ? undefined : "outline"}
        size="lg"
        className="signalflow-glow mt-3 w-full border-0"
        style={
          clientConfig.logoAccent
            ? { backgroundColor: clientConfig.logoAccent, color: "#fff" }
            : undefined
        }
        onClick={() => setOpen(true)}
      >
        Continue Premium
      </Button>
    );
  }

  const manager = clientConfig.paymentInfo.managers[0];

  return (
    <div className="signalflow-glass mt-3 rounded-xl border border-white/5 p-4">
      <p className="text-sm font-medium text-foreground">Which plan are you continuing on?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPlanId(p.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              p.id === selectedPlanId
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-white/10 text-muted-foreground hover:border-white/20",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">
        Enter your registered phone number to confirm your membership.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setResult(null);
          }}
          placeholder="Phone number"
          inputMode="tel"
          className="sm:flex-1"
        />
        <Button
          className="signalflow-glow signalflow-btn-gradient"
          disabled={isChecking}
          onClick={handleCheck}
        >
          {isChecking ? "Checking…" : "Validate"}
        </Button>
      </div>

      {result && selectedPlan && (
        <div className="mt-3">
          {result.found ? (
            <div className="rounded-lg border border-[var(--signalflow-win)]/40 bg-[var(--signalflow-win)]/10 p-3 text-sm">
              <p className="text-foreground/90">
                {result.name ? `Welcome back, ${result.name}!` : "Membership confirmed!"}{" "}
                Continue on the {selectedPlan.label} plan at{" "}
                <span className="font-semibold text-[var(--signalflow-win)]">
                  ₹{selectedPlan.existingMemberPriceInr.toLocaleString("en-IN")}
                </span>
                .
              </p>
              {manager && (
                <Button asChild size="sm" className="signalflow-glow signalflow-btn-gradient mt-3 w-full">
                  <a
                    href={toWhatsAppLink(
                      manager.phone,
                      `Hi, I'd like to continue my premium membership on the ${selectedPlan.label} plan at the existing-member price of ₹${selectedPlan.existingMemberPriceInr}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Continue via WhatsApp
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
              We couldn&apos;t find an existing membership for that number.{" "}
              <Link href="/register" className="text-primary underline underline-offset-2">
                Register as a new member
              </Link>{" "}
              instead.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BrokerOfferCard() {
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
      className="signalflow-glass signalflow-glow relative flex flex-col overflow-hidden rounded-2xl border border-white/5 p-6 text-center lg:max-w-xs"
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundImage: "var(--signalflow-gold-gradient)" }}
      />
      <Image
        src={offer.logoSrc}
        alt={offer.logoAlt}
        width={offer.logoWidth ?? 40}
        height={offer.logoHeight ?? 40}
        className={
          offer.logoWidth
            ? "mx-auto h-10 w-auto max-w-[140px] object-contain"
            : "mx-auto rounded-xl"
        }
      />
      <p className="mt-3 font-heading text-lg font-bold">
        Free Demat account with <span className="signalflow-gold-text">{offer.brandName}</span> 🔥
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Don&apos;t miss it — pick either offer:
      </p>

      <div className="mt-4 flex flex-col gap-2.5 text-sm">
        <div className="rounded-lg border border-[var(--signalflow-win)]/40 bg-[var(--signalflow-win)]/10 px-3 py-2">
          <span className="font-semibold text-[var(--signalflow-win)]">₹500 off</span>{" "}
          <span className="text-foreground/90">your next premium batch</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">— or —</p>
        <div className="rounded-lg border border-[var(--signalflow-win)]/40 bg-[var(--signalflow-win)]/10 px-3 py-2">
          <span className="font-semibold text-[var(--signalflow-win)]">
            {offer.brokerageDiscountPercent}% off
          </span>{" "}
          <span className="text-foreground/90">your brokerage</span>
        </div>
      </div>

      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="text-sm font-medium text-foreground">
          Already have {offer.brandName.startsWith("A") ? "an" : "a"} {offer.brandName} account?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Refer friends &amp; family and{" "}
          <span className="font-semibold text-primary">Win Free premium group access*</span>
        </p>
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          *Conditions apply — see{" "}
          <Link href="/terms" className="text-primary underline underline-offset-2">
            T&amp;C
          </Link>
          .
        </p>
      </div>

      <Button asChild size="sm" variant="outline" className="signalflow-glow mt-auto w-full">
        <a href={clientConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4" />
          Grab this offer
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
  // Clients using the "Premium Community" pricing headline (Stockops,
  // Goodwill) show the bull image in the Hero section instead, to the left
  // of the hero text — see hero.tsx's showBull. (Note: TGA's own headline is
  // "Premium community", lower-case c, so this comparison intentionally
  // doesn't match it — pre-existing behavior, unrelated to the pricing-tier
  // change here, left as-is.)
  const showBullImage = headline !== "Premium Community";

  return (
    <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Join the <span className="signalflow-gold-text">{headline}</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{subheadline}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                "signalflow-glass relative flex flex-col rounded-2xl border p-6",
                plan.highlight
                  ? "signalflow-gold-border signalflow-glow border-2"
                  : "border-white/5",
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
                  Most Popular
                </span>
              )}
              <p className="font-heading text-sm font-semibold text-muted-foreground">
                {plan.label}
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-bold signalflow-gold-text">
                  ₹{plan.priceInr.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-muted-foreground">{plan.periodLabel}</span>
              </div>
              {plan.savingsLabel && (
                <span className="mt-1.5 inline-flex w-fit rounded-full border border-[var(--signalflow-win)]/40 bg-[var(--signalflow-win)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--signalflow-win)]">
                  {plan.savingsLabel}
                </span>
              )}
              <Button asChild size="lg" className="signalflow-glow signalflow-btn-gradient mt-5 w-full">
                <Link href={`/register?plan=${plan.id}`}>{registerLabel}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="signalflow-glass signalflow-neutral-border mt-6 rounded-2xl border p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Every plan includes
          </p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm sm:grid sm:grid-cols-2 sm:gap-x-6">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground/90">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">WhatsApp signal hours</p>
              <p>{batchInfo.whatsappTimings}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Live Zoom timings</p>
              <p>{batchInfo.zoomTimings.join(" · ")}</p>
            </div>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Check our actual{" "}
            <Link href="/dashboard" className="text-primary underline underline-offset-2">
              Win Rate and Total Capture %
            </Link>
            , computed live from every signal we&apos;ve published. {batchInfo.refundPolicy}{" "}
            <Link href="/terms" className="text-primary underline underline-offset-2">
              T &amp; C
            </Link>
          </p>

          <ContinuePremiumPanel plans={pricingPlans} />
        </motion.div>

        {(showBullImage || clientConfig.dhanOfferEnabled) && (
          <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:justify-center">
            {showBullImage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5 }}
                className="relative z-10 mx-auto shrink-0 self-center"
              >
                <Image
                  src="/bull-3d.png"
                  alt="Bull market"
                  width={736}
                  height={734}
                  className="h-40 w-40 object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.35)] sm:h-56 sm:w-56 lg:h-64 lg:w-64"
                />
              </motion.div>
            )}

            {clientConfig.dhanOfferEnabled && <BrokerOfferCard />}
          </div>
        )}
      </div>
    </section>
  );
}
