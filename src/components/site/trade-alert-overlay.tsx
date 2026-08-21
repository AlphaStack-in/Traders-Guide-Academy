"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface CelebrationEvent {
  key: string;
  signalLabel: string;
  targetLabel: string | null;
  pnlPercent: number;
}

export interface SlHitEvent {
  key: string;
  signalLabel: string;
  sellPrice: number;
}

const CONFETTI_COLORS = ["var(--signalflow-gold-start)", "var(--signalflow-gold-end)", "var(--signalflow-win)", "#ffffff"];

interface ConfettiPiece {
  id: number;
  x: number;
  rotate: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
}

function ConfettiBurst() {
  // Randomization happens in an effect (post-render), not during render —
  // Math.random() directly in the render path trips the purity lint rule.
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 480,
        rotate: Math.random() * 360,
        delay: Math.random() * 0.25,
        duration: 2 + Math.random() * 0.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    );
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: `calc(50vw + ${p.x}px)`, y: "30vh", opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute top-0 left-0 rounded-sm"
          style={{ width: p.size, height: p.size * 1.6, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

function SlHitPulse() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.14, 0] }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--signalflow-loss) 60%, transparent), transparent 70%)",
      }}
    />
  );
}

export function TradeAlertOverlay({
  celebration,
  slHitAlert,
}: {
  celebration: CelebrationEvent | null;
  slHitAlert: SlHitEvent | null;
}) {
  return (
    <AnimatePresence>
      {celebration && <ConfettiBurst key={celebration.key} />}
      {slHitAlert && <SlHitPulse key={slHitAlert.key} />}
    </AnimatePresence>
  );
}
