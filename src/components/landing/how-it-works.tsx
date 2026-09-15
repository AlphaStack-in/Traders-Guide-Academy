"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Register Premium",
    description:
      "Share your name, phone and email — takes under a minute and sets up your dashboard login.",
    footnote: "Instant provisioning",
  },
  {
    title: "Get instant signal alerts",
    description:
      "Every call, update and exit lands on your dashboard instantly — with sound alerts, so nothing gets missed.",
    footnote: "Real-time dashboard sync",
    tag: "Sound on alert",
    highlight: true,
  },
  {
    title: "Trade the plan",
    description:
      "Every signal on your dashboard comes with entry, stop loss and target — you decide sizing.",
    footnote: "Zero second guessing",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            How it <span className="signalflow-gold-text">works</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Simple 3-step discipline to execute high-probability option buying setups without
            emotional second guessing.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "group relative rounded-2xl border bg-card p-8 shadow-lg transition-colors",
                step.highlight
                  ? "border-primary/40 hover:border-primary"
                  : "border-white/10 hover:border-primary/50",
              )}
            >
              {step.tag && (
                <span className="absolute -top-3.5 right-6 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
                  {step.tag}
                </span>
              )}
              <div
                className={cn(
                  "mb-6 flex h-12 w-12 items-center justify-center rounded-xl border font-heading text-lg font-bold transition-colors",
                  step.highlight
                    ? "border-primary/40 bg-primary/20 text-primary"
                    : "border-white/10 bg-white/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                )}
              >
                {i + 1}
              </div>
              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <div className="mt-6 flex items-center text-xs font-semibold text-primary">
                <span>{step.footnote}</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
