"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/site/icons";
import { clientConfig } from "@/lib/client-config";
import { checkExistingMember } from "@/app/register/actions";

function toWhatsAppLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function ContinuePremiumPanel({
  existingMemberPriceInr,
}: {
  existingMemberPriceInr: number;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<{ found: boolean; name: string | null } | null>(null);
  const [isChecking, startChecking] = useTransition();

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
        variant="outline"
        size="lg"
        className="thc-glow mt-3 w-full"
        onClick={() => setOpen(true)}
      >
        Continue Premium
      </Button>
    );
  }

  const manager = clientConfig.paymentInfo.managers[0];

  return (
    <div className="thc-glass mt-3 rounded-xl border border-white/5 p-4">
      <p className="text-sm font-medium text-foreground">
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
          className="thc-glow thc-btn-gradient"
          disabled={isChecking}
          onClick={handleCheck}
        >
          {isChecking ? "Checking…" : "Validate"}
        </Button>
      </div>

      {result && (
        <div className="mt-3">
          {result.found ? (
            <div className="rounded-lg border border-[var(--thc-win)]/40 bg-[var(--thc-win)]/10 p-3 text-sm">
              <p className="text-foreground/90">
                {result.name ? `Welcome back, ${result.name}!` : "Membership confirmed!"}{" "}
                Continue at{" "}
                <span className="font-semibold text-[var(--thc-win)]">
                  ₹{existingMemberPriceInr.toLocaleString("en-IN")}
                </span>
                .
              </p>
              {manager && (
                <Button asChild size="sm" className="thc-glow thc-btn-gradient mt-3 w-full">
                  <a
                    href={toWhatsAppLink(
                      manager.phone,
                      `Hi, I'd like to continue my premium membership at the existing-member price of ₹${existingMemberPriceInr}.`,
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

function DhanOfferCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="thc-glass thc-glow relative flex flex-col overflow-hidden rounded-2xl border border-white/5 p-6 text-center lg:max-w-xs"
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundImage: "var(--thc-gold-gradient)" }}
      />
      <Image
        src="/dhan-logo.jpg"
        alt="Dhan"
        width={40}
        height={40}
        className="mx-auto rounded-xl"
      />
      <p className="mt-3 font-heading text-lg font-bold">
        Free Demat account with <span className="thc-gold-text">Dhan</span> 🔥
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Don&apos;t miss it — pick either offer:
      </p>

      <div className="mt-4 flex flex-col gap-2.5 text-sm">
        <div className="rounded-lg border border-[var(--thc-win)]/40 bg-[var(--thc-win)]/10 px-3 py-2">
          <span className="font-semibold text-[var(--thc-win)]">₹500 off</span>{" "}
          <span className="text-foreground/90">your next premium batch</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">— or —</p>
        <div className="rounded-lg border border-[var(--thc-win)]/40 bg-[var(--thc-win)]/10 px-3 py-2">
          <span className="font-semibold text-[var(--thc-win)]">15% off</span>{" "}
          <span className="text-foreground/90">your brokerage</span>
        </div>
      </div>

      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="text-sm font-medium text-foreground">Already have a Dhan account?</p>
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

      <Button asChild size="sm" variant="outline" className="thc-glow mt-auto w-full">
        <a href={clientConfig.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="h-4 w-4" />
          Grab this offer
        </a>
      </Button>
    </motion.div>
  );
}

export function Pricing() {
  const { batchInfo } = clientConfig;
  const headline = clientConfig.pricingHeadline ?? `${batchInfo.batchNumber}th Batch`;
  const dateRange = `${new Date(batchInfo.startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} – ${new Date(batchInfo.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Join the <span className="thc-gold-text">{headline}</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every call, live Zoom session, and WhatsApp signal — one flat price.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="thc-glass thc-gold-border thc-glow rounded-2xl p-8 lg:max-w-xl lg:flex-1"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-heading text-4xl font-bold thc-gold-text">
              ₹{batchInfo.priceInr.toLocaleString("en-IN")}
            </p>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
              Batch runs {dateRange}
            </span>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--thc-win)]/40 bg-[var(--thc-win)]/10 px-3 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--thc-win)]" />
            <span className="text-foreground/90">
              2nd month onwards for Existing members:{" "}
              <span className="font-semibold text-[var(--thc-win)]">
                ₹{batchInfo.existingMemberPriceInr.toLocaleString("en-IN")} only
              </span>
            </span>
          </div>

          <ContinuePremiumPanel existingMemberPriceInr={batchInfo.existingMemberPriceInr} />

          <ul className="mt-6 flex flex-col gap-2.5 text-sm">
            {batchInfo.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground/90">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Live Zoom timings</p>
              <p>{batchInfo.zoomTimings.join(" · ")}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">WhatsApp signal hours</p>
              <p>{batchInfo.whatsappTimings}</p>
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

          <Button asChild size="lg" className="thc-glow thc-btn-gradient mt-6 w-full">
            <Link href="/register">Register for this Batch</Link>
          </Button>
        </motion.div>

          {clientConfig.dhanOfferEnabled && <DhanOfferCard />}
        </div>
      </div>
    </section>
  );
}
