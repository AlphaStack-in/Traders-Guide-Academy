import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  accent,
  delayMs = 0,
}: {
  label: string;
  value: string;
  accent?: "win" | "loss" | "neutral";
  delayMs?: number;
}) {
  const valueClass =
    accent === "win"
      ? "text-[var(--signalflow-win)]"
      : accent === "loss"
        ? "text-[var(--signalflow-loss)]"
        : "signalflow-gold-text";

  const barGradient =
    accent === "win"
      ? "linear-gradient(90deg, color-mix(in oklab, var(--signalflow-win) 60%, transparent), var(--signalflow-win))"
      : accent === "loss"
        ? "linear-gradient(90deg, color-mix(in oklab, var(--signalflow-loss) 60%, transparent), var(--signalflow-loss))"
        : "var(--signalflow-gold-gradient)";

  return (
    <div
      className="signalflow-glass signalflow-glow signalflow-reveal relative overflow-hidden rounded-xl border border-white/5 p-4"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundImage: barGradient }}
      />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 font-heading text-2xl font-bold", valueClass)}>{value}</p>
    </div>
  );
}
