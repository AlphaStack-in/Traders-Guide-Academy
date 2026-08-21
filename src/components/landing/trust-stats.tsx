"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/landing/count-up";

const STATS = [
  { label: "Active Students", value: 650, suffix: "+" },
  { label: "Years of Trading Exp", value: 12, suffix: "+" },
  { label: "Live Sessions Hosted", value: 250, suffix: "+" },
  { label: "Total Beneficiaries", value: 1000, suffix: "+" },
];

export function TrustStats() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="signalflow-glass signalflow-glow relative overflow-hidden rounded-xl border border-white/5 px-4 py-6 text-center"
          >
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ backgroundImage: "var(--signalflow-gold-gradient)" }}
            />
            <p className="font-heading text-3xl font-bold signalflow-gold-text sm:text-4xl">
              <CountUp value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
