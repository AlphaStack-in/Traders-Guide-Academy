export function SliderStat({
  label,
  value,
  max,
  displayValue,
  accent = "gold",
}: {
  label: string;
  value: number;
  max: number;
  displayValue: string;
  accent?: "gold" | "win" | "loss";
}) {
  const pct = Math.max(4, Math.min(100, (Math.abs(value) / max) * 100));

  const gradient =
    accent === "win"
      ? "linear-gradient(90deg, color-mix(in oklab, var(--signalflow-win) 60%, transparent), var(--signalflow-win))"
      : accent === "loss"
        ? "linear-gradient(90deg, color-mix(in oklab, var(--signalflow-loss) 60%, transparent), var(--signalflow-loss))"
        : "var(--signalflow-gold-gradient)";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="relative h-2 rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, backgroundImage: gradient }}
        />
        <div
          className="absolute top-1/2 flex h-7 min-w-7 items-center justify-center whitespace-nowrap rounded-full px-2 text-[10px] font-bold text-[#0b0b0d] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.6)]"
          style={{ left: `${pct}%`, transform: "translate(-50%, -50%)", backgroundImage: gradient }}
        >
          {displayValue}
        </div>
      </div>
    </div>
  );
}
