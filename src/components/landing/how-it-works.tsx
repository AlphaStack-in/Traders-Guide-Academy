"use client";

import { motion } from "framer-motion";

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

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">
          How it <span className="thc-gold-text">works</span>
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="thc-glass thc-glow rounded-xl border border-white/5 p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full thc-gold-border font-heading text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
