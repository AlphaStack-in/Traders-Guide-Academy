"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Register Premium",
    description: "Share your name and phone number — takes under a minute.",
  },
  {
    title: "Get instant signal alerts",
    description:
      "Every call, update and exit pushes straight to your dashboard the second it's posted — real-time, with sound alerts, so you never miss an entry.",
  },
  {
    title: "Trade the plan",
    description: "Each signal comes with entry, stop loss and target — you decide sizing.",
  },
];

function StepBadge({ index }: { index: number }) {
  return (
    <div className="thc-glow flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary/60 bg-gradient-to-b from-primary/20 to-transparent font-heading text-2xl font-bold text-primary sm:h-24 sm:w-24 sm:text-3xl">
      {index + 1}
    </div>
  );
}

// A single dipping arc with an arrowhead — horizontal between two badges on
// desktop, rotated to bow sideways (pointing down) when stacked on mobile.
function Connector({ orientation }: { orientation: "horizontal" | "vertical" }) {
  if (orientation === "vertical") {
    return (
      <svg
        viewBox="0 0 40 72"
        className="h-14 w-10 shrink-0 text-primary/60 sm:hidden"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 4 Q 40 36 6 68"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M1 59 L6 70 L13 60"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 100 36"
      className="hidden h-9 w-16 shrink-0 text-primary/60 sm:block md:w-24 lg:w-28"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 6 Q 50 40 98 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M89 1 L99 6 L88 13"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">
          How it <span className="thc-gold-text">works</span>
        </h2>
        <div className="mt-14 flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:justify-center sm:gap-1">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center sm:flex-row">
              {i > 0 && <Connector orientation="vertical" />}
              {i > 0 && <Connector orientation="horizontal" />}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex w-48 flex-col items-center text-center sm:w-44 md:w-52"
              >
                <StepBadge index={i} />
                <h3 className="mt-4 font-heading text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            </div>
          ))}

          <Connector orientation="vertical" />
          <Connector orientation="horizontal" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: steps.length * 0.15 }}
            className="flex w-48 flex-col items-center sm:w-44 md:w-52"
          >
            <Button asChild size="lg" className="thc-glow thc-btn-gradient h-14 px-8 text-base">
              <Link href="/register">Start Trading</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
