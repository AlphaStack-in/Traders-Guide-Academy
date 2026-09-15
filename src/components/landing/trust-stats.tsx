"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/landing/count-up";

const STATS = [
  {
    label: "Active Students",
    value: 1500,
    caption: "Active premium subscribers",
  },
  {
    label: "Years of Market Exp",
    value: 25,
    caption: "Tested across bull & bear cycles",
  },
  {
    label: "Live Sessions Hosted",
    value: 250,
    caption: "Real-time market screen shares",
  },
  {
    label: "Total Beneficiaries",
    value: 3000,
    caption: "Webinar & signal community",
  },
];

export function TrustStats() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/90 p-6 text-left transition-colors hover:border-primary/40"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-primary/5 transition-colors group-hover:bg-primary/10"
            />
            <p className="relative flex items-baseline font-heading text-3xl font-extrabold text-foreground sm:text-4xl">
              <CountUp value={stat.value} />
              <span className="ml-0.5 font-sans text-primary">+</span>
            </p>
            <p className="relative mt-2 text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="relative mt-0.5 text-xs text-muted-foreground/70">{stat.caption}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
